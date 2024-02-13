import { exec } from "child_process";

//biome-ignore lint/suspicious/noExplicitAny: any is used for type safety
export const safeNumber = (value: any): number | null => {
    const i = Number(value);
    if (Number.isNaN(i)) {
        return null;
    }
    return i;
};
const zeroPadding = (num: number, length: number) => {
    return num.toString().padStart(length, "0");
};

export const formatDateTime = (date: Date = new Date(), padding?: boolean) => {
    const Y = date.getFullYear();
    const Mo = date.getMonth() + 1;
    const D = date.getDate();
    const H = date.getHours();
    const Mi = date.getMinutes();
    const S = date.getSeconds();
    const ms = date.getMilliseconds();
    if (padding) {
        return `${Y}-${zeroPadding(Mo, 2)}-${zeroPadding(D, 2)} ${zeroPadding(H, 2)}:${zeroPadding(
            Mi,
            2,
        )}:${zeroPadding(S, 2)}.${zeroPadding(ms, 3)}`;
    }
    return `${Y}-${Mo}-${D} ${H}:${Mi}:${S}.${ms}`;
};

export const formatDate = (date: Date = new Date()) => {
    return `${date.getFullYear()}-${zeroPadding(date.getMonth() + 1, 2)}-${zeroPadding(date.getDate(), 2)}`;
};

/**
 *
 * @param cmd 実行するコマンド
 * @returns stdout
 */
export const execAsync = (cmd: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, _stderr) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(stdout.toString());
        });
    });
};
/**
 *
 * @param url 保存する動画のURL
 * @param outputPath 保存先のパス、拡張子は付与される。
 * @returns {filepath: string, stdout: string} filepath: 保存したファイルのパス, stdout: yt-dlpの標準出力
 */
export const youtubeDl = async (url: string, outputPath: string) => {
    const cmd = ["yt-dlp", "--add-header Accept-Language:ja-JP", "-o", `"${outputPath}.%(ext)s"`, url];
    //ファイルパスのみ取得
    const filepath = (await execAsync([...cmd, "--print", "filename"].join(" "))).trim();
    //ダウンロード
    const stdout = await execAsync(cmd.join(" "));
    stdout;
    return {
        filepath,
        stdout,
    };
};
