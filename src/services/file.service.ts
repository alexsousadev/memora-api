import fs from "fs";

export class FileService {
    private static instance: FileService;

    private constructor() {
    }

    public static getInstance(): FileService {
        if (!FileService.instance) {
            FileService.instance = new FileService();
        }
        return FileService.instance;
    }

    async readFile(filePath: string) {
        const fileBuffer = fs.readFileSync(filePath);
        return fileBuffer.toString('base64');
    }
}

export default FileService.getInstance();