import aiService from "./ai.service";
import { FileService } from "./file.service";


class TranscribeAudioIntent {
    private static instance: TranscribeAudioIntent;

    private constructor() {

    }

    public static getInstance(): TranscribeAudioIntent {
        if (!TranscribeAudioIntent.instance) {
            TranscribeAudioIntent.instance = new TranscribeAudioIntent();
        }
        return TranscribeAudioIntent.instance;
    }

    async transcribeAudio(audioFilePath: string, mimeType: string = "audio/mpeg") {
        const audio = await FileService.getInstance().readFile(audioFilePath);
        const prompt = 
        `
        Analise este áudio em português e extraia as informações de um lembrete.
        
        Extraia os seguintes dados:
        - title: Título ou descrição curta do lembrete
        - type: Tipo de frequência do lembrete. Opções: "one_time" (uma única vez), "daily" (diariamente), "weekly" (semanalmente), "custom" (personalizado)
        - category: Categoria do lembrete. Opções: "medication" (medicamento), "meal" (refeição), "exercise" (exercício), "sleep" (sono)
        - initialDate: Data inicial no formato YYYY-MM-DD. Se não especificado, use a data atual
        - endDate: Data final no formato YYYY-MM-DD (opcional, apenas para lembretes recorrentes)
        - timeDay: Horário no formato HH:MM (exemplo: "08:00", "14:30")
        - weekDays: Array de dias da semana (apenas para type="weekly"). Opções: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        
        Exemplos de resposta:
        
        Áudio: "Me lembre de tomar o remédio do coração todos os dias às 8 da manhã"
        { "title": "Tomar remédio do coração", "type": "daily", "category": "medication", "timeDay": "08:00" }
        
        Áudio: "Preciso me lembrar de fazer exercício na segunda, quarta e sexta às 18h"
        { "title": "Fazer exercício", "type": "weekly", "category": "exercise", "timeDay": "18:00", "weekDays": ["monday", "wednesday", "friday"] }
        
        Áudio: "Me lembre de almoçar amanhã ao meio-dia"
        { "title": "Almoçar", "type": "one_time", "category": "meal", "initialDate": "2025-10-17", "timeDay": "12:00" }
        
        Retorne APENAS o JSON, sem nenhuma explicação extra ou blocos de código markdown.
        `;

        const response = await aiService.processIntentInAudio(audioFilePath, prompt, mimeType);
        return response;
    }
}

export default TranscribeAudioIntent.getInstance();