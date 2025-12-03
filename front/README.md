# Memorae Frontend (React + TypeScript)

This is the new frontend for Memorae, built with React, TypeScript, and Vite.

## Features
- **Reconhecimento de voz nativo do navegador**: Usa SpeechRecognition API (funciona offline).
- **Fluxo guiado passo a passo**: Sistema pergunta nome, data, hora e repetição.
- **Acesso persistente ao microfone** sem ficar pedindo permissão.
- **Interface acessível** pensada para todos os usuários.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure o Google Gemini TTS (recomendado para voz mais natural):
   - Copie o arquivo `.env.example` para `.env`:
     ```bash
     cp .env.example .env
     ```
   - Obtenha sua API Key em: https://aistudio.google.com/app/apikey
   - Adicione no arquivo `.env`:
     ```
     VITE_GOOGLE_API_KEY=sua_google_api_key_aqui
     ```
   - **Nota**: Se não configurar o Gemini TTS, o sistema usará automaticamente o SpeechSynthesis do navegador como fallback.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser.

## Text-to-Speech

O sistema usa o **Google Gemini TTS** para gerar vozes mais naturais:

### Google Gemini TTS
- **Mais natural e de alta qualidade**
- Usa o modelo `gemini-2.5-flash-preview-tts`
- Voz configurada: `Puck` (voz feminina)
- Requer: `VITE_GOOGLE_API_KEY` no `.env`

### SpeechSynthesis (Fallback)
- Usa a API nativa do navegador
- Funciona sem configuração adicional
- Ativado automaticamente se o Gemini TTS não estiver configurado ou falhar
- Qualidade variável dependendo do navegador

**Ordem de prioridade**: Gemini → SpeechSynthesis

## Key Files
- `src/hooks/useSpeechAssistant.ts`: Contains the core voice logic and state machine.
- `src/App.tsx`: Main UI component.
- `src/utils/dateUtils.ts`: Date and time parsing logic.
