import { createUserContent } from "@google/genai";
import gemini from "../config/gemini";
import { FileService } from "./file.service";


class AIService {
    private static instance: AIService;

    private constructor() {
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    async processIntentInAudio(audioFilePath: string, prompt: string, mimeType: string = "audio/mpeg")  {
       
       const audio = await FileService.getInstance().readFile(audioFilePath);
        
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: createUserContent([
              {
                inlineData: {
                  data: audio,
                  mimeType: mimeType
                }
              },
              prompt,
            ]),
          });
          
        return response.text;
    }
}

export default AIService.getInstance();