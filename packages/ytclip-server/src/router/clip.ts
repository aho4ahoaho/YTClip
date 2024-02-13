import fs from "fs";
import { Prisma, PrismaClient, ProcessStatus } from "@ytclip/database";
import { Elysia, t } from "elysia";
import ffmpeg from "fluent-ffmpeg";
import { AddQueueFFmpeg, ProcessFFmpeg } from "../lib/ffmpeg";
import { FileOrganizer } from "../lib/file";
import { Logger } from "../lib/logger";

const prismaOption: Prisma.PrismaClientOptions | undefined =
    process.env.NODE_ENV === "production" ? undefined : { log: ["query"] };
const prisma = new PrismaClient(prismaOption);
const videoFileOrganizer = new FileOrganizer("videos");
const clipFileOrganizer = new FileOrganizer("clips");

const ClipRouter = new Elysia({ prefix: "/clip" })
    .get(
        "/get/:videoId",
        async ({ params, set }) => {
            const videoId = params.videoId;
            if (!videoId) {
                set.status = 400;
                return {
                    error: "No videoId provided",
                };
            }
            const data = await prisma.video.findUnique({
                where: {
                    videoId,
                },
                include: {
                    clips: true,
                },
            });
            return {
                videoId: videoId,
                ...data,
            };
        },
        {
            params: t.Object({
                videoId: t.String(),
            }),
        },
    )
    .post(
        "/create/:videoId",
        async ({ query, params, set }) => {
            const videoId = params.videoId;
            const start = query.start;
            const end = query.end;
            if (!videoId || !start || !end) {
                set.status = 400;
                return {
                    error: "No videoId provided",
                };
            } else if (start >= end) {
                set.status = 400;
                return {
                    error: "Invalid start or end",
                };
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
                set.status = 400;
                return {
                    error: "Video not found",
                };
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

            if (duplicateClip) {
                set.status = 400;
                return {
                    error: "Clip already exists",
                };
            } else {
                //新しいクリップを作成
                const newClip: Prisma.ClipCreateManyVideoInput = {
                    start,
                    end,
                    processed: ProcessStatus.NoProcessed,
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
                return clipData.clips[0];
            }
        },
        {
            query: t.Object({
                start: t.Number(),
                end: t.Number(),
            }),
            params: t.Object({
                videoId: t.String(),
            }),
        },
    )
    .get(
        "/process",
        async ({ query, set }) => {
            const clipId = query.clipId;
            if (!clipId) {
                set.status = 400;
                return {
                    error: "No clipId provided",
                };
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
                            originalFileName: true,
                        },
                    },
                },
            });
            if (clip?.processed !== ProcessStatus.NoProcessed) {
                set.status = 400;
                return {
                    error: "Clip already processed",
                };
            } else if (!clip?.Video.originalFileName) {
                set.status = 400;
                return {
                    error: "Clip not found",
                };
            }

            await prisma.clip
                .update({
                    where: {
                        id: clipId,
                    },
                    data: {
                        processed: ProcessStatus.Processing,
                    },
                })
                .catch((e) => Logger.error(e));

            const {
                start,
                end,
                Video: { videoId, originalFileName },
            } = clip;

            const clipName = `${videoId}_${start}-${end}.mp4`;
            const videoPath = videoFileOrganizer.getPath(originalFileName);
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
                    await prisma.clip
                        .update({
                            where: {
                                id: clipId,
                            },
                            data: {
                                processed: ProcessStatus.Processed,
                                fileName: clipName,
                            },
                        })
                        .catch((e) => Logger.error(e));
                    Logger.debug(`${clipName} conversion finished.`);
                });
            AddQueueFFmpeg(ffmpegCmd);
            ProcessFFmpeg();
            return clip;
        },
        {
            query: t.Object({
                clipId: t.Number(),
            }),
        },
    )
    .delete(
        "/delete/:videoId/:clipId",
        async ({ params, set }) => {
            const videoId = params.videoId;
            const clipId = params.clipId;
            if (!videoId || !clipId) {
                set.status = 400;
                return {
                    error: "No videoId provided",
                };
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
                set.status = 400;
                return {
                    error: "Video not found",
                };
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
            return {
                message: "OK",
            };
        },
        {
            params: t.Object({
                videoId: t.String(),
                clipId: t.Number(),
            }),
        },
    );
export default ClipRouter;
