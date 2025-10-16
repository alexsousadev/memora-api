import { GoogleGenAI } from '@google/genai';
import envLoader from './env_loader';

const GEMINI_API_KEY = envLoader.getEnv("GEMINI_API_KEY");

if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não está definida no arquivo .env");
}

const gemini = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

export default gemini;
