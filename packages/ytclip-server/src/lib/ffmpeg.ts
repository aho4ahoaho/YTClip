import ffmpeg, { FfmpegCommand } from "fluent-ffmpeg";
import { safeNumber } from ".";
import { Logger } from "./logger";

const queue: FfmpegCommand[] = [];
let isProcessing = safeNumber(process.env.FFMPEG_MAX_PROCESSES) ?? 1;

export const AddQueueFFmpeg = (command: ffmpeg.FfmpegCommand) => {
    Logger.info(`AddQueueFFmpeg: ${queue.length}`);
    queue.push(command);
};

export const ProcessFFmpeg = async () => {
    if (isProcessing < 1) return;
    isProcessing--;
    while (queue.length > 0) {
        Logger.info(`ProcessFFmpeg: ${queue.length}`);
        const cmd = queue.shift();
        if (!cmd) continue;
        cmd.run();
    }
    isProcessing++;
};
