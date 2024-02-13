import fs from "fs";
import path from "path";
import ytdl from "@distube/ytdl-core";
import { Prisma, PrismaClient, ProcessStatus } from "@ytclip/database";
import { Elysia, t } from "elysia";
import ffmpeg from "fluent-ffmpeg";
import { safeNumber, youtubeDl } from "../lib";
import { AddQueueFFmpeg, ProcessFFmpeg } from "../lib/ffmpeg";
import { FileOrganizer } from "../lib/file";
import { Logger } from "../lib/logger";

const fileOrganizer = new FileOrganizer("videos");
const prisma = new PrismaClient();
const app = new Elysia({ prefix: "/video" })
    .get(
        "/getinfo",
        async ({ query, set }) => {
            const url = query.url;
            if (!url) {
                set.status = 400;
                return {
                    error: "No URL provided",
                };
            } else if (!ytdl.validateURL(url)) {
                set.status = 400;
                return {
                    error: "Invalid URL",
                };
            }
            const data = await ytdl.getInfo(url);
            return data;
        },
        {
            query: t.Object({
                url: t.String(),
            }),
        },
    )
    .get(
        "/get/:videoId",
        async ({ params, query, set }) => {
            const videoId = params.videoId;
            const detail = query.detail === "true";
            const clips = query.clips === "true";
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
                    detail: detail,
                    clips: clips,
                },
            });
            return data;
        },
        {
            query: t.Object({
                detail: t.String(),
                clips: t.String(),
            }),
            params: t.Object({
                videoId: t.String(),
            }),
        },
    )
    .get("/list", async () => {
        const data = await prisma.video.findMany({
            select: {
                videoId: true,
                title: true,
                thumbnail: true,
            },
        });
        return data;
    })
    .get("/add", async ({ query, set }) => {
        const url = query.url;
        if (!url) {
            set.status = 400;
            return {
                error: "No URL provided",
            };
        } else if (!ytdl.validateURL(url)) {
            set.status = 400;
            return {
                error: "Invalid URL",
            };
        }
        const videoId = ytdl.getURLVideoID(url);
        const normalizeUrl = `https://youtu.be/${videoId}`;

        const prevData = await prisma.video.findUnique({
            where: {
                videoId,
            },
        });
        if (prevData) {
            set.status = 400;
            return {
                error: "Video already exists",
            };
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
        return {
            videoId: videoId,
            detail: {
                ...data.detail?.create,
                thumbnails: thumbnails,
            },
        };
    })
    .get("/delete", async ({ query, set }) => {
        const videoId = query.videoId;
        if (!videoId || !ytdl.validateID(videoId)) {
            set.status = 400;
            return {
                error: "No videoId provided",
            };
        }

        const video = await prisma.video.findUnique({
            where: {
                videoId,
            },
        });
        if (!video) {
            set.status = 400;
            return {
                error: "Video not found",
            };
        }

        await prisma.video.delete({
            where: {
                videoId,
            },
        });
        return {
            message: "OK",
        };
    })
    .get("/download", async ({ query, set }) => {
        const videoId = query.videoId;
        if (!videoId) {
            set.status = 400;
            return {
                error: "No videoId provided",
            };
        } else if (!ytdl.validateID(videoId)) {
            set.status = 400;
            return {
                error: "Invalid videoId",
            };
        }

        const video = await prisma.video.findUnique({
            where: {
                videoId,
            },
        });

        if (!video) {
            set.status = 400;
            return {
                error: "Video not found",
            };
        }
        switch (video?.processed) {
            case ProcessStatus.Processed:
            case ProcessStatus.Processing:
                set.status = 400;
                return {
                    error: "Video already processed",
                };
            case ProcessStatus.Error:
                //削除して再ダウンロード
                Logger.log("DeleteErrorVideo", videoId);
                try {
                    fs.unlinkSync(fileOrganizer.getPath(videoId));
                } catch (err) {
                    Logger.error("DeleteErrorVideo", err);
                }
                break;
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
        youtubeDl(url, videoPath)
            .then(async ({ filepath }) => {
                Logger.log("yt-dlp", `${videoInfo.videoDetails.title} download finished.`);
                const fileName = `${path.basename(filepath).split(".").slice(0, -1).join(".")}.mp4`;
                const dirName = path.dirname(filepath);
                const videoPath = path.join(dirName, fileName);

                const convertPromise: Promise<void> = new Promise((resolve, reject) => {
                    const ffmpegCmd = ffmpeg(filepath)
                        .videoCodec("libx264")
                        .audioCodec("aac")
                        .outputOption("-crf", "26", "-preset", "ultrafast")
                        .size("1280x?")
                        .output(videoPath)
                        .on("end", () => {
                            resolve();
                        })
                        .on("error", (err) => {
                            Logger.error("ffmpeg", err);
                            reject(err);
                        });
                    AddQueueFFmpeg(ffmpegCmd);
                    ProcessFFmpeg();
                });
                await convertPromise;
                return {
                    fileName: fileName,
                    originalFileName: path.basename(filepath),
                };
            })
            .then(({ fileName, originalFileName }) => {
                Logger.log("ffmpeg", `${videoId}.mp4 convert finished.`);
                return prisma.video.update({
                    where: {
                        videoId,
                    },
                    data: {
                        processed: ProcessStatus.Processed,
                        fileName,
                        originalFileName,
                    },
                });
            })
            .catch((err) => {
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
        return {
            message: "OK",
        };
    });
export default app;
