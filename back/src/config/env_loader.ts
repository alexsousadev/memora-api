import dotenv from "dotenv";

class EnvLoader {
    constructor() {
        this.loadEnv();
    }

    loadEnv() {
        dotenv.config();
    }

    getEnv(key: string): string {
        return process.env[key] ?? "";
    }
}

const envLoader = new EnvLoader();

export default envLoader;