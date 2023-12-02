import fs from "fs";
import https from "https";
import ytdl from "@distube/ytdl-core";
import { Prisma, PrismaClient, ProcessStatus } from "@ytclip/database";
import { Router } from "express";
import ffmpeg from "fluent-ffmpeg";
import { safeNumber, youtubeDl } from "../lib";
import { AddQueueFFmpeg, ProcessFFmpeg } from "../lib/ffmpeg";
import { FileOrganizer } from "../lib/file";
import { Logger } from "../lib/logger";
import { execAsync } from "../lib/index";
import path from "path";


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
    }
    switch (video?.processed) {
        case ProcessStatus.Processed:
            res.status(400).send("Video already processed");
            return;
        case ProcessStatus.Processing:
            res.status(400).send("Video already processing");
            return;
        // biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
        case ProcessStatus.Error:
            //削除して再ダウンロード
            Logger.log("DeleteErrorVideo", videoId);
            try {
                fs.unlinkSync(fileOrganizer.getPath(videoId));
            } catch (err) {
                Logger.error("DeleteErrorVideo", err);
            }
        case ProcessStatus.NoProcessed:
            //何もしない
            break;
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
    const videoPath = fileOrganizer.getPath(videoId);


    Logger.log(`Starting ${videoInfo.videoDetails.title} download.`);
    youtubeDl(url, videoPath).then(({ filepath }) => {
        Logger.log("yt-dlp", `${videoInfo.videoDetails.title} download finished.`);
        const fileName = `${path.basename(filepath).split(".").slice(0, -1).join(".")}.mkv`;
        const dirName = path.dirname(filepath);
        const videoPath = path.join(dirName, fileName);

        const convertPromise: Promise<string> = new Promise((resolve, reject) => {
            ffmpeg(filepath).videoCodec("copy").audioCodec("aac").save(videoPath).on("end", () => {
                fs.unlinkSync(filepath);
                resolve(fileName);
            }).on("error", (err) => {
                Logger.error("ffmpeg", err);
                reject(err);
            });
        });
        return convertPromise;
    }).then((fileName) => {
        Logger.log("ffmpeg", `${videoId}.mp4 convert finished.`);
        return prisma.video.update({
            where: {
                videoId,
            },
            data: {
                processed: ProcessStatus.Processed,
                fileName,
            },
        });
    }).catch((err) => {
        Logger.error("DownloadError", err);

        prisma.video.update({
            where: {
                videoId,
            },
            data: {
                processed: ProcessStatus.Error,
                fileName: null,
            },
        });
    });
    res.send("OK");
});

export default router;
