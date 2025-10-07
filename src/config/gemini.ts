import { GoogleGenAI } from '@google/genai';
import envLoader from './env_loader';

const GEMINI_API_KEY = envLoader.getEnv("GEMINI_API_KEY");

const gemini = new GoogleGenAI({apiKey: GEMINI_API_KEY});

export default gemini;
