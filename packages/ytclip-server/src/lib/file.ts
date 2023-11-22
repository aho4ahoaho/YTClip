import fs from "fs";
import path from "path";

const projectRoot = path.resolve(__dirname, "..", "..");
export class FileOrganizer {
    readonly basePath: string;
    constructor(basePath: string) {
        this.basePath = path.resolve(projectRoot, basePath);
        this.makeDirectory();
    }

    public makeDirectory(): void {
        const char = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (const firstChar of char) {
            for (const secondChar of char) {
                const dirName = path.resolve(this.basePath, firstChar + secondChar);
                fs.mkdirSync(dirName, { recursive: true });
            }
        }
    }

    public getPath(filename: string): string {
        const prefix = filename.substring(0, 2);
        return path.resolve(this.basePath, `${prefix.toLowerCase()}`, filename);
    }

    public getWriteStream(filename: string): fs.WriteStream {
        const filePath = this.getPath(filename);
        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            //Ignore
        }
        return fs.createWriteStream(filePath);
    }
}
