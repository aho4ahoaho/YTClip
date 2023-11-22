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
        detail: data,
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

    let clipId: number | undefined;
    if (duplicateClip) {
        if (duplicateClip?.processed === ProcessStatus.NoProcessed) {
            //既存のクリップを更新
            clipId = duplicateClip.id;
        } else {
            res.status(400).send("Clip already exists");
            return;
        }
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
        clipId = clipData.clips[0].id;
    }

    const clipName = `${videoId}_${start}-${end}.mp4`;
    const videoPath = videoFileOrganizer.getPath(videoData.fileName);
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
        .on("end", () => {
            Logger.debug(`${clipName} conversion finished.`);
            prisma.clip.update({
                where: {
                    id: clipId,
                },
                data: {
                    processed: ProcessStatus.Processed,
                    fileName: clipName,
                },
            });
        });
    AddQueueFFmpeg(ffmpegCmd);
    ProcessFFmpeg();

    res.send("OK");
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
