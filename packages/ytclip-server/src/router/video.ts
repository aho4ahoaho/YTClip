import fs from "fs";
import https from "https";
import ytdl from "@distube/ytdl-core";
import { Prisma, PrismaClient, ProcessStatus } from "@ytclip/database";
import { Router } from "express";
import ffmpeg from "fluent-ffmpeg";
import { safeNumber } from "../lib";
import { AddQueueFFmpeg, ProcessFFmpeg } from "../lib/ffmpeg";
import { FileOrganizer } from "../lib/file";
import { Logger } from "../lib/logger";

const router = Router();
const fileOrganizer = new FileOrganizer("videos");
const prisma = new PrismaClient();

router.get("/getinfo", (req, res) => {
    const url = String(req.query.url);
    if (!url) {
        res.status(400).send("No URL provided");
        return;
    } else if (!ytdl.validateURL(url)) {
        res.status(400).send("Invalid URL");
        return;
    }

    ytdl.getInfo(url)
        .then((info) => {
            res.send(info);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

router.get("/get", async (req, res) => {
    const videoId = String(req.query.videoId);
    const detail = String(req.query.detail) === "true";
    const clips = String(req.query.clips) === "true";
    if (!videoId) {
        res.status(400).send("No videoId provided");
        return;
    }
    const data = await prisma.video.findUnique({
        where: {
            videoId,
        },
        include: {
            detail: detail,
            clips: clips,
        }
    });
    res.send(data);
});

router.get("/list", async (req, res) => {
    const data = await prisma.video.findMany({
        select: {
            videoId: true,
            title: true,
            thumbnail: true,
        },
    });
    res.send(data);
});

router.get("/add", async (req, res) => {
    const url = String(req.query.url);
    if (!url) {
        res.status(400).send("No URL provided");
        return;
    } else if (!ytdl.validateURL(url)) {
        res.status(400).send("Invalid URL");
        return;
    }
    const videoId = ytdl.getURLVideoID(url);
    const normalizeUrl = `https://youtu.be/${videoId}`;

    const prevData = await prisma.video.findUnique({
        where: {
            videoId,
        },
    });
    if (prevData) {
        res.status(400).send("Video already exists");
        return;
    }

    const videoInfo = await ytdl.getInfo(normalizeUrl, {
        lang: "ja",
    });

    const thumbnails = videoInfo.videoDetails.thumbnails.map((thumbnail) => ({
        url: thumbnail.url,
        width: thumbnail.width,
        height: thumbnail.height,
    }));

    const data: Prisma.VideoCreateInput = {
        videoId: videoId,
        thumbnail: thumbnails[thumbnails.length - 1].url,
        title: videoInfo.videoDetails.title,
        detail: {
            create: {
                description: videoInfo.videoDetails.description?.substring(0, 255) ?? "",
                duration: safeNumber(videoInfo.videoDetails.lengthSeconds) ?? 0,
                channelId: videoInfo.videoDetails.channelId,
                author: videoInfo.videoDetails.author.name,
                thumbnails: {
                    create: thumbnails,
                },
            },
        },
    };
    await prisma.video.create({ data });
    res.send({
        videoId: videoId,
        detail: {
            ...data.detail?.create,
            thumbnails: thumbnails,
        },
    });
});

router.delete("/delete", async (req, res) => {
    const videoId = String(req.query.videoId);
    if (!videoId || !ytdl.validateID(videoId)) {
        res.status(400).send("No videoId provided");
        return;
    }

    const video = await prisma.video.findUnique({
        where: {
            videoId,
        },
    });
    if (!video) {
        res.status(400).send("Video not found");
        return;
    }

    await prisma.video.delete({
        where: {
            videoId,
        },
    });
    res.send("OK");
});

router.get("/download", async (req, res) => {
    const videoId = String(req.query.videoId);
    if (!videoId) {
        res.status(400).send("No videoId provided");
        return;
    } else if (!ytdl.validateID(videoId)) {
        res.status(400).send("Invalid videoId");
        return;
    }

    const video = await prisma.video.findUnique({
        where: {
            videoId,
        },
    });
    if (!video) {
        res.status(400).send("Video not found");
        return;
    } else if (video.processed !== ProcessStatus.NoProcessed) {
        res.status(400).send("Video already processed");
        return;
    }

    await prisma.video.update({
        where: {
            videoId,
        },
        data: {
            processed: ProcessStatus.Processing,
        },
    });

    const url = `https://youtu.be/${videoId}`;
    const videoInfo = await ytdl.getInfo(url);
    const videoFormat = ytdl.chooseFormat(videoInfo.formats, { quality: "highestvideo" });
    const audioFormat = ytdl.chooseFormat(videoInfo.formats, { quality: "highestaudio" });
    const videoUrl = videoFormat.url;
    const audioUrl = audioFormat.url;

    const videoType = videoFormat.container;
    const audioType = audioFormat.container;
    const videoFileName = `${videoId}.video.${videoType}`;
    const audioFileName = `${videoId}.audio.${audioType}`;
    const videoPath = fileOrganizer.getPath(videoFileName);
    const audioPath = fileOrganizer.getPath(audioFileName);
    const videoFileStream = fileOrganizer.getWriteStream(videoFileName);
    const audioFileStream = fileOrganizer.getWriteStream(audioFileName);

    Logger.log(`Starting ${videoFileName} download. Video format: ${videoFormat.codecs} ${videoFormat.qualityLabel}.`);
    const videoPromise = new Promise<void>((resolve, reject) => {
        https
            .get(videoUrl, (res) => {
                res.pipe(videoFileStream);
                res.on("end", () => {
                    Logger.log(`${videoFileName} download finished.`);
                    resolve();
                });
                res.on("error", (err) => {
                    Logger.error("VideoDL", err);
                    reject(err);
                });
            })
            .on("error", (err) => {
                reject(err);
            });
    });

    Logger.log(`Starting ${audioFileName} download. Audio format: ${audioFormat.codecs} ${audioFormat.quality}.`);
    const audioPromise = new Promise<void>((resolve, reject) => {
        https
            .get(audioUrl, (res) => {
                res.pipe(audioFileStream);
                res.on("end", () => {
                    Logger.log(`${audioFileName} download finished.`);
                    resolve();
                });
                res.on("error", (err) => {
                    Logger.error("AudioDL", err);
                    reject(err);
                });
            })
            .on("error", (err) => {
                reject(err);
            });
    });

    Promise.all([videoPromise, audioPromise])
        .then(() => {
            Logger.log(`Starting ${videoId}.mp4 conversion.`);

            return new Promise<void>((resolve, reject) => {
                const ffmpegCmd = ffmpeg()
                    .input(videoPath)
                    .input(audioPath)
                    .videoCodec(videoType === "mp4" ? "copy" : "mp4")
                    .audioCodec("aac")
                    .on("end", () => {
                        Logger.log("FFmpeg CMD", `${videoId}.mp4 conversion finished.`);
                        resolve();
                    })
                    .on("start", (cmd) => Logger.debug(cmd))
                    .on("error", (err, stdout, stderr) => {
                        Logger.error("ConvertError", err);
                        Logger.error(stdout);
                        Logger.error(stderr);
                        reject(err);
                    })
                    .output(fileOrganizer.getPath(`${videoId}.mp4`));
                AddQueueFFmpeg(ffmpegCmd);
                ProcessFFmpeg();
            });
        })
        .then(() => {
            fs.unlinkSync(fileOrganizer.getPath(videoFileName));
            fs.unlinkSync(fileOrganizer.getPath(audioFileName));

            return prisma.video.update({
                where: {
                    videoId,
                },
                data: {
                    processed: ProcessStatus.Processed,
                    fileName: `${videoId}.mp4`,
                },
            });
        })
        .catch((err) => {
            Logger.error("DownloadError", err);
            fs.unlinkSync(fileOrganizer.getPath(videoFileName));
            fs.unlinkSync(fileOrganizer.getPath(audioFileName));

            prisma.video.update({
                where: {
                    videoId,
                },
                data: {
                    processed: ProcessStatus.NoProcessed,
                    fileName: null,
                },
            });
        });

    res.send("OK");
});

export default router;
