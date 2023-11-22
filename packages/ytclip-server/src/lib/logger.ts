import fs from "fs";
import path from "path";
import { gzipSync } from "zlib";
import { formatDate, formatDateTime } from "./index";

const logDir = path.resolve(__dirname, "..", "..", "logs");

// ログファイルの圧縮
try {
    fs.readdirSync(logDir)
        .filter((file) => {
            return path.extname(file) === ".log" && !file.startsWith(formatDate());
        })
        .map((file) => path.resolve(logDir, file))
        .forEach((file) => {
            const data = fs.readFileSync(file, "utf-8");
            const compressed = gzipSync(data);
            fs.writeFileSync(`${file}.gz`, compressed);
            fs.unlinkSync(file);
        });
} catch {
    fs.mkdirSync(logDir);
}

type logLevel = "info" | "error" | "warn" | "debug" | "log" | "verbose";
export class Logger {
    public prefix: string;
    constructor(prefix: string) {
        this.prefix = prefix;
    }
    //biome-ignore lint/suspicious/noExplicitAny: "any"を受け入れる
    public static log(...logs: any[]) {
        console.log(...logs);
        this.write("log", ...logs);
    }

    //biome-ignore lint/suspicious/noExplicitAny: "any"を受け入れる
    public static info(...logs: any[]) {
        console.info(...logs);
        this.write("info", ...logs);
    }

    //biome-ignore lint/suspicious/noExplicitAny: "any"を受け入れる
    public static error(...logs: any[]) {
        console.error(...logs);
        this.write("error", ...logs);
    }

    //biome-ignore lint/suspicious/noExplicitAny: "any"を受け入れる
    public static warn(...logs: any[]) {
        console.warn(...logs);
        this.write("warn", ...logs);
    }

    //biome-ignore lint/suspicious/noExplicitAny: "any"を受け入れる
    public static debug(...logs: any[]) {
        console.debug(...logs);
        if (process.env.NODE_ENV === "production") return;
        this.write("debug", ...logs);
    }

    //biome-ignore lint/suspicious/noExplicitAny: "any"を受け入れる
    private static write(type: logLevel, ...logs: Array<any>) {
        const date = new Date();
        const formattedDate = formatDate(date);
        const fileName = path.resolve(logDir, `${formattedDate}.log`);
        let msg = "";
        for (const log of logs) {
            if (typeof log === "object") {
                msg += JSON.stringify(log, null, 4);
                continue;
            }
            msg += `${log} `;
        }
        const timeZoneOffset = date.getTimezoneOffset();
        const timeZone = (timeZoneOffset / -60).toString().padStart(2, "0");
        fs.appendFileSync(
            fileName,
            `[${formatDateTime(date, true)} ${timeZoneOffset < 0 ? "+" : ""}${timeZone}] "${type}" - ${msg}\n`,
        );
    }

    public static read(date: Date = new Date()) {
        const formattedDate = formatDate(date);
        const fileName = path.resolve(logDir, `${formattedDate}.log`);
        return fs.readFileSync(fileName, "utf-8");
    }
}
