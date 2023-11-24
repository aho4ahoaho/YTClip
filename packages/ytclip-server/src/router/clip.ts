import fs from "fs";
import { Prisma, PrismaClient, ProcessStatus } from "@ytclip/database";
import { Router } from "express";
import ffmpeg from "fluent-ffmpeg";
import { safeNumber } from "../lib";
import { AddQueueFFmpeg, ProcessFFmpeg } from "../lib/ffmpeg";
import { FileOrganizer } from "../lib/file";
import { Logger } from "../lib/logger";
import { getQueryString } from "../lib/url";

const router = Router();
const prismaOption: Prisma.PrismaClientOptions | undefined =
    process.env.NODE_ENV === "production" ? undefined : { log: ["query"] };
const prisma = new PrismaClient(prismaOption);
const videoFileOrganizer = new FileOrganizer("videos");
const clipFileOrganizer = new FileOrganizer("clips");

router.get("/", (req, res) => {
    res.send("Hello Video!");
});

router.get("/get", async (req, res) => {
    const videoId = getQueryString(req.query.videoId);
    if (!videoId) {
        res.status(400).send("No videoId provided");
        return;
    }
    const data = await prisma.video.findUnique({
        where: {
            videoId,
        },
        include: {
            clips: true,
        },
    });
    res.send({
        videoId: videoId,
        ...data,
    });
});

router.put("/create", async (req, res) => {
    const videoId = getQueryString(req.query.videoId);
    const start = safeNumber(req.query.start);
    const end = safeNumber(req.query.end);
    if (!videoId || !start || !end) {
        res.status(400).send("No videoId provided");
        return;
    } else if (start >= end) {
        res.status(400).send("Invalid start or end");
        return;
    }

    //動画が存在するか確認
    const videoData = await prisma.video.findUnique({
        where: {
            videoId,
        },
        select: {
            id: true,
            fileName: true,
        },
    });
    if (!videoData?.fileName) {
        res.status(400).send("Video not found");
        return;
    }

    //同じクリップが存在しないか確認
    const duplicateClip = await prisma.clip.findFirst({
        where: {
            videoDataId: videoData.id,
            start,
            end,
        },
        select: {
            id: true,
            processed: true,
        },
    });
    console.log(duplicateClip);

    if (duplicateClip) {
        res.status(400).send("Clip already exists");
        return;
    } else {
        //新しいクリップを作成
        const newClip: Prisma.ClipCreateManyVideoInput = {
            start,
            end,
            processed: ProcessStatus.Processing,
        };
        const clipData = await prisma.video.update({
            where: {
                videoId,
            },
            data: {
                clips: {
                    create: newClip,
                },
            },
            select: {
                clips: {
                    where: {
                        start,
                        end,
                    },
                    select: {
                        id: true,
                    },
                },
            },
        });
        res.send(clipData.clips[0]);
    }
});

router.get("/process", async (req, res) => {
    const clipId = safeNumber(req.query.clipId);
    if (!clipId) {
        res.status(400).send("No clipId provided");
        return;
    }
    const clip = await prisma.clip.findUnique({
        where: {
            id: clipId,
        },
        select: {
            processed: true,
            start: true,
            end: true,
            Video: {
                select: {
                    videoId: true,
                    fileName: true,
                }
            },
        }
    });
    if (clip?.processed !== ProcessStatus.NoProcessed) {
        res.status(400).send("Clip already processed");
        return;
    } else if (!clip?.Video.fileName) {
        res.status(400).send("Clip not found");
        return;
    }
    const { start, end, Video: { fileName, videoId } } = clip;

    const clipName = `${videoId}_${start}-${end}.mp4`;
    const videoPath = videoFileOrganizer.getPath(fileName);
    const clipPath = clipFileOrganizer.getPath(clipName);
    Logger.debug(`Start converting ${clipName}...`);
    const ffmpegCmd = ffmpeg()
        .input(videoPath)
        .setStartTime(start)
        .setDuration(end - start)
        .output(clipPath)
        .on("start", (cmd) => {
            Logger.debug("FFmpeg CMD", cmd);
        })
        .on("end", async () => {
            await prisma.clip.update({
                where: {
                    id: clipId,
                },
                data: {
                    processed: ProcessStatus.Processed,
                    fileName: clipName,
                },
            }).catch((e) => Logger.error(e));
            Logger.debug(`${clipName} conversion finished.`);
        });
    AddQueueFFmpeg(ffmpegCmd);
    ProcessFFmpeg();
    res.send(clip);
});

router.delete("/delete", async (req, res) => {
    const videoId = getQueryString(req.query.videoId);
    const clipId = safeNumber(req.query.clipId);
    if (!videoId || !clipId) {
        res.status(400).send("No videoId provided");
        return;
    }

    const video = await prisma.video.findUnique({
        where: {
            videoId,
        },
        select: {
            id: true,
        },
    });
    if (!video) {
        res.status(400).send("Video not found");
        return;
    }

    const deleteClip = await prisma.clip.delete({
        where: {
            videoDataId: video.id,
            id: clipId,
        },
    });
    if (deleteClip.fileName) {
        const clipPath = clipFileOrganizer.getPath(deleteClip.fileName);
        fs.unlinkSync(clipPath);
    }
    res.send("OK");
});

export default router;
