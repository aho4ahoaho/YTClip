import ffmpeg, { FfmpegCommand } from "fluent-ffmpeg";
import { safeNumber } from ".";

const queue: FfmpegCommand[] = [];
let isProcessing = safeNumber(process.env.FFMPEG_MAX_PROCESSES) ?? 1;

export const AddQueueFFmpeg = (command: ffmpeg.FfmpegCommand) => {
    queue.push(command);
};

export const ProcessFFmpeg = async () => {
    if (isProcessing < 1) return;
    isProcessing--;
    while (queue.length > 0) {
        const cmd = queue.shift();
        if (!cmd) continue;
        cmd.run();
    }
    isProcessing++;
};
