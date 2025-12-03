// Configurações
import { useState, useEffect, useRef, useCallback } from 'react';
import type { ConversationState, AudioFileMap, ReminderPayload } from '../types';
import { normalizeTimePt, normalizeDatePt, formatDateForSpeech, translateWeekdaysToPt } from '../utils/dateUtils';

const CONFIG = {
    backendUrl: 'http://localhost:3000/api',
    maxRecordingTime: 30000,
    audioPath: '/',
    googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || null
};

const AUDIO_FILES: AudioFileMap = {
    welcome: 'Bem_vindo.wav',
    listening: 'Estou_ouvindo.wav',
    repeat: 'Por_favor_repita.wav',
    reminderName: 'nome_lembrete.wav',
    reminderDate: 'dia_lembrete.wav',
    reminderTime: 'horario_lembrete.wav',
    reminderRepeat: 'repetir_lembrete.wav',
    editReminder: 'Acao_pos_editar.wav',
    deleteReminder: 'acao_pos_excluir.wav',
    loading: 'estamos_carregando.wav',
    reminderCreated: 'criamos_lembrete.wav',
    wantToDelete: 'quer_apagar.wav',
    deleted: 'apagou.wav',
    presentation1: 'apresentacao1.wav',
    presentation2: 'apresentacao2.wav',
    presentation3: 'apresentacao3.wav',
    presentation4: 'apresentacao4.wav',
    presentation5: 'apresentacao5.wav'
};

export function useSpeechAssistant() {
    // Estado da UI
    const [status, setStatus] = useState<'ready' | 'recording' | 'processing'>('ready');
    const [feedback, setFeedback] = useState<{ message: string; type: 'info' | 'success' | 'error' | 'json' } | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [conversationState, setConversationState] = useState<ConversationState>('welcome');
    const [reminders, setReminders] = useState<any[]>([]);
    const [showRemindersList, setShowRemindersList] = useState(false);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [loadingReminderId, setLoadingReminderId] = useState<string | number | null>(null);
    const [isLoadingReminders, setIsLoadingReminders] = useState(false);
    const [shouldPlayLoadingAudio, setShouldPlayLoadingAudio] = useState(true);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ name: string; id: string | number } | null>(null);
    
    // Refs para persistência
    const currentStream = useRef<MediaStream | null>(null);
    const recognition = useRef<any>(null);
    const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
    const currentPlayingAudio = useRef<HTMLAudioElement | null>(null);
    const recordingStartTime = useRef<number | null>(null);
    const isRecordingRef = useRef(false);
    const microphonePermissionGranted = useRef(false);
    const microphonePermissionChecked = useRef(false);
    const welcomePlayedRef = useRef(false);
    const currentReminderData = useRef<any>({});
    const lastProcessedText = useRef<string | null>(null);
    const lastProcessedState = useRef<ConversationState | null>(null);
    const listeningAudioEndTime = useRef<number | null>(null);
    const pendingRecognizedTexts = useRef<string[]>([]); // Array para acumular todas as frases
    const microphoneClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasClickedMicrophoneRef = useRef(false);
    const presentationAudioPlayedRef = useRef(false);
    const initialWelcomeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopOutputAudio = useCallback(() => {
        if (currentPlayingAudio.current) {
            currentPlayingAudio.current.pause();
            currentPlayingAudio.current.currentTime = 0;
            currentPlayingAudio.current = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    // Função para converter PCM para WAV no navegador
    const pcmToWav = useCallback((pcmData: Uint8Array, sampleRate: number = 24000, channels: number = 1): Blob => {
        const length = pcmData.length;
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, 1, true); // audio format (1 = PCM)
        view.setUint16(22, channels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * channels * 2, true); // byte rate
        view.setUint16(32, channels * 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample
        writeString(36, 'data');
        view.setUint32(40, length, true);
        
        // Copy PCM data
        const pcmView = new Uint8Array(buffer, 44);
        pcmView.set(pcmData);
        
        return new Blob([buffer], { type: 'audio/wav' });
    }, []);

    // Google Gemini TTS usando API REST diretamente
    const speakWithGeminiTTS = useCallback(async (text: string): Promise<void> => {
        if (!CONFIG.googleApiKey) {
            throw new Error('Google API Key não configurada');
        }

        // Mostrar animação de carregamento
        setStatus('processing');
        setIsGeneratingAudio(true);

        try {
            const response = await fetch(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
                {
                    method: 'POST',
                    headers: {
                        'x-goog-api-key': CONFIG.googleApiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text }]
                        }],
                        generationConfig: {
                            responseModalities: ['AUDIO'],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: 'Kore'
                                    }
                                }
                            }
                        },
                        model: 'gemini-2.5-flash-preview-tts'
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                setStatus('ready');
                throw new Error(`Erro na API: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const base64Data = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            
            if (!base64Data) {
                setStatus('ready');
                throw new Error('Resposta inválida do Gemini TTS');
            }

            // Decodificar base64 para PCM (s16le, 24000Hz, mono)
            const binaryString = atob(base64Data);
            const pcmData = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                pcmData[i] = binaryString.charCodeAt(i);
            }

            // Converter PCM para WAV
            const wavBlob = pcmToWav(pcmData, 24000, 1);
            const audioUrl = window.URL.createObjectURL(wavBlob);

            // Criar elemento de áudio e aguardar carregamento
            return new Promise((resolve, reject) => {
                const audio = new Audio();
                audio.src = audioUrl;
                audio.volume = 1.0;
                
                // Aguardar o áudio carregar antes de tentar reproduzir
                audio.addEventListener('loadeddata', () => {
                    stopOutputAudio();
                    currentPlayingAudio.current = audio;
                    setStatus('ready'); // Mudar para ready quando começar a tocar
                    setIsGeneratingAudio(false); // Parar animação de carregamento quando áudio estiver pronto
                    audio.play().then(() => {
                        // Áudio iniciado com sucesso
                    }).catch((playError) => {
                        console.error('Erro ao reproduzir áudio:', playError);
                        setStatus('ready');
                        setIsGeneratingAudio(false);
                        window.URL.revokeObjectURL(audioUrl);
                        reject(playError);
                    });
                }, { once: true });
                
                audio.addEventListener('ended', () => {
                    window.URL.revokeObjectURL(audioUrl);
                    resolve();
                }, { once: true });
                
                audio.addEventListener('error', (error) => {
                    console.error('Erro no elemento de áudio:', error);
                    console.error('Audio error details:', {
                        error: audio.error,
                        networkState: audio.networkState,
                        readyState: audio.readyState
                    });
                    setStatus('ready');
                    setIsGeneratingAudio(false);
                    window.URL.revokeObjectURL(audioUrl);
                    reject(new Error(`Erro ao carregar áudio: ${audio.error?.message || 'Erro desconhecido'}`));
                }, { once: true });

                // Tentar carregar o áudio
                audio.load();
            });
        } catch (error) {
            console.error('Erro ao usar Gemini TTS:', error);
            setStatus('ready');
            setIsGeneratingAudio(false);
            throw error;
        }
    }, [stopOutputAudio, pcmToWav]);
     


    // Função para usar APENAS Gemini (sem fallback para navegador)
    const speakWithGeminiOnly = useCallback(async (text: string, waitForCurrentAudio = true): Promise<void> => {
        // Se waitForCurrentAudio for true, aguardar o áudio atual terminar antes de começar
        if (waitForCurrentAudio && currentPlayingAudio.current) {
            await new Promise<void>((resolve) => {
                const checkAudio = () => {
                    if (!currentPlayingAudio.current) {
                        resolve();
                    } else {
                        setTimeout(checkAudio, 100);
                    }
                };
                checkAudio();
            });
        }
        
        stopOutputAudio();
        
        // Usar APENAS Gemini - sem fallback
        if (!CONFIG.googleApiKey) {
            throw new Error('Google API Key não configurada - não é possível usar Gemini TTS');
        }
        
        try {
            // Criar uma Promise com timeout para o Gemini
            const geminiPromise = speakWithGeminiTTS(text);
            const timeoutPromise = new Promise<void>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), 20000); // 20 segundos de timeout
            });
            
            // Tentar usar Gemini com timeout
            await Promise.race([geminiPromise, timeoutPromise]);
        } catch (error) {
            console.error('Erro ao usar Gemini TTS (sem fallback):', error);
            throw error; // Lançar erro ao invés de usar fallback
        }
    }, [speakWithGeminiTTS, stopOutputAudio]);

    // TTS com fallback (prioridade: Gemini > SpeechSynthesis)
    const speakText = useCallback(async (text: string, waitForCurrentAudio = true): Promise<void> => {
        // Se waitForCurrentAudio for true, aguardar o áudio atual terminar antes de começar
        if (waitForCurrentAudio && currentPlayingAudio.current) {
            await new Promise<void>((resolve) => {
                const checkAudio = () => {
                    if (!currentPlayingAudio.current) {
                        resolve();
                    } else {
                        setTimeout(checkAudio, 100);
                    }
                };
                checkAudio();
            });
        }
        
        stopOutputAudio();
        
        // 1. SEMPRE tentar usar Google Gemini TTS primeiro (mais natural)
        if (CONFIG.googleApiKey) {
            try {
                // Criar uma Promise com timeout para o Gemini
                const geminiPromise = speakWithGeminiTTS(text);
                const timeoutPromise = new Promise<void>((_, reject) => {
                    setTimeout(() => reject(new Error('Timeout')), 15000); // 15 segundos de timeout
                });
                
                // Tentar usar Gemini com timeout
                await Promise.race([geminiPromise, timeoutPromise]);
                return; // Se Gemini funcionou, retornar
            } catch (error) {
                console.log('Gemini TTS falhou ou demorou muito, aguardando um pouco antes do fallback:', error);
                // Aguardar um pouco antes de usar o fallback
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } else {
            console.log('Gemini TTS não configurado (sem API key), usando SpeechSynthesis');
        }
        
        // 2. Fallback: SpeechSynthesis do navegador (só se Gemini falhar ou demorar muito)
        return new Promise((resolve) => {
            const speak = () => {
                const naturalText = text
                    .replace(/\./g, '. ')
                    .replace(/,/g, ', ')
                    .replace(/:/g, ': ')
                    .replace(/;/g, '; ');
                
                const utter = new SpeechSynthesisUtterance(naturalText);
                utter.lang = 'pt-BR';
                utter.rate = 0.88;
                utter.pitch = 1.05;
                utter.volume = 1.0;
                
                const voices = window.speechSynthesis.getVoices();
                const ptBrVoices = voices.filter(voice => 
                    voice.lang.includes('pt-BR') || voice.lang.includes('pt')
                );
                
                const preferredVoices = ptBrVoices.filter(voice => {
                    const name = voice.name.toLowerCase();
                    return name.includes('neural') ||
                           name.includes('premium') ||
                           name.includes('google') ||
                           name.includes('microsoft') ||
                           name.includes('amazon') ||
                           name.includes('polly') ||
                           name.includes('natural') ||
                           name.includes('female') ||
                           name.includes('feminina');
                });
                
                const femaleVoices = ptBrVoices.filter(voice => {
                    const name = voice.name.toLowerCase();
                    return name.includes('female') || 
                           name.includes('feminina') ||
                           name.includes('mulher') ||
                           (voice.name.includes('Maria') || voice.name.includes('Ana') || voice.name.includes('Luciana'));
                });
                
                if (preferredVoices.length > 0) {
                    utter.voice = preferredVoices[0];
                } else if (femaleVoices.length > 0) {
                    utter.voice = femaleVoices[0];
                } else if (ptBrVoices.length > 0) {
                    utter.voice = ptBrVoices[0];
                }
                
                utter.onend = () => resolve();
                utter.onerror = () => resolve();
                window.speechSynthesis.speak(utter);
            };
            
            if (window.speechSynthesis.getVoices().length === 0) {
                window.speechSynthesis.onvoiceschanged = () => {
                    speak();
                };
            } else {
                speak();
            }
        });
    }, [stopOutputAudio, speakWithGeminiTTS]);

    const playAudio = useCallback(async (audioKey: string, speed = 1.0): Promise<void> => {
        return new Promise((resolve, reject) => {
            let audio = audioCache.current.get(audioKey);
            
            if (!audio) {
                const filename = AUDIO_FILES[audioKey];
                if (!filename) {
                    resolve();
                    return;
                }
                audio = new Audio(filename.startsWith('/') ? filename : `/${filename}`);
                audio.volume = 1;
                audioCache.current.set(audioKey, audio);
            }

            // Garantir que audio não é undefined
            if (!audio) {
                resolve();
                return;
            }

            const audioToPlay = audio; // Capturar referência para usar dentro da função

            // Aguardar qualquer áudio atual terminar antes de tocar o próximo
            if (currentPlayingAudio.current) {
                const waitForCurrent = () => {
                    if (!currentPlayingAudio.current) {
                        startPlaying();
                    } else {
                        setTimeout(waitForCurrent, 50);
                    }
                };
                waitForCurrent();
            } else {
                startPlaying();
            }

            function startPlaying() {
                stopOutputAudio();

                const audioClone = audioToPlay.cloneNode() as HTMLAudioElement;
                audioClone.volume = 1;
                audioClone.playbackRate = speed;
                currentPlayingAudio.current = audioClone;

                const timeout = setTimeout(() => {
                    if (currentPlayingAudio.current === audioClone) {
                        currentPlayingAudio.current = null;
                    }
                    resolve();
                }, 30000);

                audioClone.onended = () => {
                    clearTimeout(timeout);
                    if (currentPlayingAudio.current === audioClone) {
                        currentPlayingAudio.current = null;
                    }
                    // Pequeno delay para garantir que o áudio realmente terminou
                    setTimeout(() => resolve(), 100);
                };
                
                audioClone.onerror = (error) => {
                    clearTimeout(timeout);
                    if (currentPlayingAudio.current === audioClone) {
                        currentPlayingAudio.current = null;
                    }
                    reject(error);
                };

                audioClone.play().catch(error => {
                    clearTimeout(timeout);
                    if (currentPlayingAudio.current === audioClone) {
                        currentPlayingAudio.current = null;
                    }
                    reject(error);
                });
            }
        });
    }, [stopOutputAudio]);

    const playAudioFast = useCallback(async (audioKey: string) => {
        try {
            await playAudio(audioKey, 1.2);
        } catch (error) {
            console.error(`Erro ao reproduzir áudio ${audioKey}:`, error);
        }
    }, [playAudio]);

    // API Calls
    const apiCall = useCallback(async (endpoint: string, method = 'GET', body: any = null) => {
        const url = `${CONFIG.backendUrl}${endpoint}`;
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : null
        };
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(await res.text());
        const contentType = res.headers.get("content-type");
        return contentType && contentType.includes("application/json") ? await res.json() : await res.text();
    }, []);

    const createReminderAPI = useCallback(async (payload: any) => {
        await apiCall('/reminders', 'POST', payload);
    }, [apiCall]);

    const handleListReminders = useCallback(async () => {
        setStatus('processing');
        setIsLoadingReminders(true);
        setShowRemindersList(false); // Garantir que a lista não está visível durante o carregamento
        
        try {
            const fetchedReminders = await apiCall('/reminders', 'GET');
            if (Array.isArray(fetchedReminders) && fetchedReminders.length > 0) {
                setReminders(fetchedReminders);
                const count = fetchedReminders.length;
                const message = count === 1 
                    ? 'Você tem 1 lembrete.' 
                    : `Você tem ${count} lembretes.`;
                // Usar APENAS Gemini para essa mensagem (sem fallback para navegador)
                try {
                    await speakWithGeminiOnly(message);
                    
                    // Aguardar o áudio terminar completamente antes de mostrar a lista
                    await new Promise<void>((resolve) => {
                        const checkAudioEnded = () => {
                            if (!currentPlayingAudio.current) {
                                // Áudio terminou, aguardar um pouco mais para garantir
                                setTimeout(() => {
                                    resolve();
                                }, 300);
                            } else {
                                // Ainda está tocando, verificar novamente
                                setTimeout(checkAudioEnded, 100);
                            }
                        };
                        checkAudioEnded();
                    });
                } catch (error) {
                    console.error('Erro ao usar Gemini para mensagem de lembretes:', error);
                    // Se falhar, aguardar um pouco antes de mostrar a lista
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                // Mostrar a lista apenas depois que o áudio terminar completamente
                setIsLoadingReminders(false);
                setShowRemindersList(true);
            } else {
                setReminders([]);
                // Usar APENAS Gemini para essa mensagem também
                try {
                    await speakWithGeminiOnly('Você não tem lembretes.');
                    
                    // Aguardar o áudio terminar completamente
                    await new Promise<void>((resolve) => {
                        const checkAudioEnded = () => {
                            if (!currentPlayingAudio.current) {
                                setTimeout(() => {
                                    resolve();
                                }, 300);
                            } else {
                                setTimeout(checkAudioEnded, 100);
                            }
                        };
                        checkAudioEnded();
                    });
                } catch (error) {
                    console.error('Erro ao usar Gemini para mensagem de sem lembretes:', error);
                }
                setIsLoadingReminders(false);
                setShowRemindersList(false);
            }
        } catch (e) {
             // Em caso de erro, não falar nada (não usar fallback)
             console.error('Erro ao listar lembretes:', e);
             setReminders([]);
             setIsLoadingReminders(false);
             setShowRemindersList(false);
        }
        setStatus('ready');
        setConversationState('welcome');
    }, [apiCall, speakWithGeminiOnly]);
    
    const loadReminders = useCallback(async (silent = true) => {
        try {
            const fetchedReminders = await apiCall('/reminders', 'GET');
            if (Array.isArray(fetchedReminders)) {
                setReminders(fetchedReminders);
                // Só mostra a lista se não for silencioso e tiver lembretes
                if (!silent && fetchedReminders.length > 0) {
                    setShowRemindersList(true);
                }
            }
        } catch (e) {
            console.error('Erro ao carregar lembretes:', e);
        }
    }, [apiCall]);
    
    const speakReminder = useCallback(async (reminder: any) => {
        const reminderId = reminder.id || reminder.name;
        setLoadingReminderId(reminderId);
        
        // Não tocar o áudio de carregamento quando for escutar um lembrete específico
        setShouldPlayLoadingAudio(false);
        
        try {
            const dateFormatted = formatDateForSpeech(reminder.date);
            let message = `${reminder.name}, agendado para ${dateFormatted} às ${reminder.time}.`;
            
            if (reminder.repeat && reminder.repeatDays) {
                const days = translateWeekdaysToPt(reminder.repeatDays);
                message += ` Este lembrete se repete nos seguintes dias: ${days}.`;
            }
            
            // Aguardar um pouco para mostrar a animação de carregamento
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Usar speakText que sempre tenta Gemini primeiro
            // A função speakText já garante que o Gemini seja usado quando disponível
            await speakText(message, false);
        } finally {
            // Aguardar mais tempo antes de remover a animação para garantir que o áudio começou a tocar
            setTimeout(() => {
                setLoadingReminderId(null);
                setShouldPlayLoadingAudio(true); // Reativar o áudio de carregamento para outras situações
            }, 800);
        }
    }, [speakText]);
    
    const closeRemindersList = useCallback(() => {
        setShowRemindersList(false);
    }, []);
    
    const handleDeleteReminder = useCallback(async (name: string) => {
        // Encontrar o lembrete para pegar o ID
        const reminder = reminders.find(r => r.name === name);
        const reminderId = reminder?.id || reminder?.name || name;
        
        // Mostrar confirmação e tocar áudio "quer apagar"
        setDeleteConfirmation({ name, id: reminderId });
        
        try {
            await playAudio('wantToDelete', 1.0);
        } catch (e) {
            console.log('Erro ao tocar áudio de confirmação:', e);
        }
    }, [reminders, playAudio]);
    
    const confirmDeleteReminder = useCallback(async () => {
        if (!deleteConfirmation) return;
        
        // Fechar a janela de confirmação imediatamente
        const reminderName = deleteConfirmation.name;
        setDeleteConfirmation(null);
        
        try {
            await apiCall('/reminders', 'DELETE', { name: reminderName });
            await loadReminders(); // Recarregar lista
            
            // Tocar áudio "apagou"
            try {
                await playAudio('deleted', 1.0);
            } catch (e) {
                console.log('Erro ao tocar áudio de apagado:', e);
            }
        } catch (e) {
            console.error('Erro ao remover lembrete:', e);
        }
        
        setConversationState('welcome');
    }, [deleteConfirmation, apiCall, loadReminders, playAudio]);
    
    const cancelDeleteReminder = useCallback(() => {
        setDeleteConfirmation(null);
    }, []);

    const saveReminder = useCallback(async () => {
        const data = currentReminderData.current;
        
        if (!data.name || !data.date || !data.time || data.repeat === undefined) {
            await speakText('Ainda faltam informações. Por favor, complete todos os dados do lembrete.');
            return;
        }

        try {
            // Payload no formato do schema do banco de dados
            const payload = {
                name: data.name,
                date: data.date,
                time: data.time,
                repeat: data.repeat,
                repeatDays: data.repeat && data.repeatDays ? data.repeatDays : null
            };

            console.log('💾 Salvando no backend:', JSON.stringify(payload, null, 2));
            await createReminderAPI(payload);
            await loadReminders(); // Recarregar lista
            
            // Mostrar animação de sucesso
            setShowSuccessAnimation(true);
            setTimeout(() => {
                setShowSuccessAnimation(false);
            }, 3000);
            
            // Tocar apenas o áudio de lembrete criado (sem ler a mensagem)
            try {
                await playAudio('reminderCreated', 1.0);
            } catch (e) {
                console.log('Erro ao tocar áudio de lembrete criado:', e);
            }
            
            currentReminderData.current = {};
            lastProcessedText.current = null;
            lastProcessedState.current = null;
            setConversationState('welcome');
            
        } catch (error) {
            console.error('Erro ao salvar lembrete:', error);
            await speakText('Erro ao salvar lembrete.');
            setConversationState('welcome');
        }
    }, [createReminderAPI, speakText, loadReminders]);

    // Função para formatar texto em Title Case (ex: "remédio de pressão" -> "Remédio de Pressão")
    const formatTitleCase = useCallback((text: string): string => {
        if (!text) return text;
        return text
            .split(' ')
            .map(word => {
                if (word.length === 0) return word;
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    }, []);

    // Função para interpretar comando completo em uma frase
    const interpretFullCommand = useCallback((text: string): ReminderPayload | null => {
        const lowerText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Detectar se é um comando de criação completo
        if (!lowerText.includes('criar') && !lowerText.includes('lembrete')) {
            return null;
        }

        const result: any = {};

        // Extrair NOME do lembrete (tudo entre "criar lembrete" e indicadores temporais)
        const namePatterns = [
            /criar\s+(?:um|lembrete|um\s+lembrete)?\s*(?:sobre|de|para|do|da)?\s*([^0-9]+?)(?:\s+(?:as|às|na|no|dia|amanha|amanhã|hoje|segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo))/i,
            /criar\s+(?:um|lembrete|um\s+lembrete)?\s*(?:sobre|de|para|do|da)?\s*(.+?)(?:\s+(?:as|às|na|no|dia|amanha|amanhã|hoje))/i,
            /criar\s+(?:um)?\s*(.+?)(?:\s+(?:as|às))/i
        ];
        
        for (const pattern of namePatterns) {
            const nameMatch = text.match(pattern);
            if (nameMatch && nameMatch[1]) {
                result.name = nameMatch[1].trim().replace(/^(um\s+lembrete|lembrete)\s*/i, '').trim();
                break;
            }
        }

        // Extrair HORA (formato HH:MM ou "X horas")
        const timePatterns = [
            /(?:as|às)\s+(\d{1,2}):(\d{2})/i,
            /(?:as|às)\s+(\d{1,2})\s*(?:horas?|h)/i,
            /(\d{1,2}):(\d{2})/
        ];
        
        for (const pattern of timePatterns) {
            const timeMatch = text.match(pattern);
            if (timeMatch) {
                const hour = timeMatch[1];
                const minute = timeMatch[2] || '00';
                result.time = normalizeTimePt(`${hour}:${minute}`);
                break;
            }
        }

        // Extrair DIAS DA SEMANA
        const weekdaysMap: { [key: string]: string } = {
            'segunda': 'monday',
            'terca': 'tuesday',
            'terça': 'tuesday',
            'quarta': 'wednesday',
            'quinta': 'thursday',
            'sexta': 'friday',
            'sabado': 'saturday',
            'sábado': 'saturday',
            'domingo': 'sunday'
        };
        
        const foundDays: string[] = [];
        for (const [ptDay, enDay] of Object.entries(weekdaysMap)) {
            if (lowerText.includes(ptDay)) {
                if (!foundDays.includes(enDay)) {
                    foundDays.push(enDay);
                }
            }
        }

        if (foundDays.length > 0) {
            result.repeat = true;
            result.repeatDays = foundDays.join(','); // Formato: "monday,friday"
        } else {
            result.repeat = false;
            result.repeatDays = null;
        }

        // Extrair DATA (se não tiver dias da semana)
        if (foundDays.length === 0) {
            const datePatterns = [
                /(?:dia|no)\s+(\d{1,2})\s+de\s+(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
                /(?:dia|no)\s+(\d{1,2})\s+(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i
            ];
            
            for (const pattern of datePatterns) {
                const dateMatch = text.match(pattern);
                if (dateMatch) {
                    result.date = normalizeDatePt(`${dateMatch[1]} de ${dateMatch[2]}`);
                    break;
                }
            }
            
            // Verificar "hoje" ou "amanhã"
            if (!result.date) {
                if (lowerText.includes('hoje')) {
                    result.date = normalizeDatePt('hoje');
                } else if (lowerText.includes('amanha') || lowerText.includes('amanhã')) {
                    result.date = normalizeDatePt('amanhã');
                }
            }
        }

        // Se tiver dias da semana, calcular próxima ocorrência
        if (foundDays.length > 0 && !result.date) {
            // Pegar o primeiro dia da semana mencionado e calcular a próxima data
            const today = new Date();
            const currentDay = today.getDay(); // 0 = domingo, 1 = segunda, etc
            
            const dayMap: { [key: string]: number } = {
                'sunday': 0,
                'monday': 1,
                'tuesday': 2,
                'wednesday': 3,
                'thursday': 4,
                'friday': 5,
                'saturday': 6
            };
            
            const targetDayNum = dayMap[foundDays[0]];
            let daysUntilTarget = targetDayNum - currentDay;
            if (daysUntilTarget <= 0) daysUntilTarget += 7;
            
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysUntilTarget);
            
            const yyyy = targetDate.getFullYear();
            const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getDate()).padStart(2, '0');
            result.date = `${yyyy}-${mm}-${dd}`;
        }

        // Validar se temos pelo menos nome e hora
        if (!result.name || !result.time) {
            return null;
        }

        // Se não tiver data, usar hoje
        if (!result.date) {
            result.date = normalizeDatePt('hoje');
        }

        // Organizar no formato do schema do banco de dados
        const reminderPayload = {
            name: formatTitleCase(result.name),
            date: result.date,
            time: result.time,
            repeat: result.repeat,
            repeatDays: result.repeatDays
        };

        console.log('✅ Comando interpretado:', result);
        console.log('📦 JSON para backend (formato DB schema):', JSON.stringify(reminderPayload, null, 2));
        
        return reminderPayload;
    }, [formatTitleCase]);

    const processRecognizedText = useCallback(async (text: string) => {
        console.log('🔍 processRecognizedText chamado com:', text);
        if (!text || text.trim().length < 2) {
            console.log('⚠️ Texto muito curto, ignorando...');
            return;
        }

        const normalizedText = text.trim().toLowerCase();
        
        // Evitar reprocessamento
        if (lastProcessedText.current && lastProcessedState.current && 
            lastProcessedState.current !== conversationState) {
            const lastProcessedNormalized = lastProcessedText.current.toLowerCase().trim();
            if (normalizedText === lastProcessedNormalized) {
                console.log(`⚠️ Texto duplicado ignorado`);
                return;
            }
        }

        stopOutputAudio();
        setStatus('processing');
        
        lastProcessedText.current = text.trim();
        lastProcessedState.current = conversationState;

        const lowerText = normalizedText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Estados de comando principal
        if (conversationState === 'listening' || conversationState === 'welcome') {
            // NOVO: Tentar interpretar comando completo primeiro
            const fullCommand = interpretFullCommand(text);
            if (fullCommand) {
                console.log('🎯 Comando completo detectado!');
                
                // Salvar diretamente (sem mostrar JSON)
                currentReminderData.current = fullCommand;
                await saveReminder();
                setStatus('ready');
                return;
            }
            
            // Fallback: fluxo guiado
            if (lowerText.includes('criar')) {
                currentReminderData.current = {};
                setConversationState('reminder_name');
                try {
                    await playAudioFast('reminderName');
                } catch {
                    await speakText('Qual o nome do lembrete?');
                }
                await new Promise(r => setTimeout(r, 1000));
                startRecording();
            } else if (
                // Comandos diretos de listagem - sempre acionam, mesmo sem "lembrete"
                lowerText.includes('listar') || 
                lowerText.includes('lista') ||
                lowerText.includes('listar lembretes') ||
                lowerText.includes('lista lembretes') ||
                lowerText.includes('listar meus lembretes') ||
                lowerText.includes('lista meus lembretes') ||
                lowerText.includes('listar todos os lembretes') ||
                lowerText.includes('lista todos os lembretes') ||
                // Comandos de visualização - sempre acionam, mesmo sem "lembrete"
                lowerText.includes('ver') ||
                lowerText.includes('ver lembretes') ||
                lowerText.includes('ver meus lembretes') ||
                lowerText.includes('ver todos os lembretes') ||
                lowerText.includes('ver os lembretes') ||
                // Comandos de mostrar/exibir - sempre acionam, mesmo sem "lembrete"
                lowerText.includes('mostrar') ||
                lowerText.includes('mostre') ||
                lowerText.includes('mostrar lembretes') ||
                lowerText.includes('mostre lembretes') ||
                lowerText.includes('mostrar meus lembretes') ||
                lowerText.includes('mostre meus lembretes') ||
                lowerText.includes('mostrar os lembretes') ||
                lowerText.includes('mostre os lembretes') ||
                // Comandos de exibir
                lowerText.includes('exibir') ||
                lowerText.includes('exibir lembretes') ||
                lowerText.includes('exibir meus lembretes') ||
                // Perguntas sobre lembretes
                lowerText.includes('meus lembretes') ||
                lowerText.includes('todos os lembretes') ||
                lowerText.includes('os lembretes') ||
                lowerText.includes('quais lembretes') ||
                lowerText.includes('quais são os lembretes') ||
                lowerText.includes('quais sao os lembretes') ||
                lowerText.includes('quais meus lembretes') ||
                lowerText.includes('que lembretes') ||
                lowerText.includes('que lembretes tenho') ||
                // Variações com "tenho" ou "existe"
                (lowerText.includes('lembrete') && (lowerText.includes('tenho') || lowerText.includes('existe') || lowerText.includes('tem'))) ||
                // Comandos específicos
                lowerText.includes('quero ver meus lembretes') ||
                lowerText.includes('quero ver os lembretes') ||
                lowerText.includes('quero listar lembretes') ||
                lowerText.includes('quero lista lembretes') ||
                // Variações com "quantos"
                (lowerText.includes('quantos lembretes') && (lowerText.includes('tenho') || lowerText.includes('tem')))
            ) {
                await handleListReminders();
            } else if (lowerText.includes('excluir') || lowerText.includes('remover') || lowerText.includes('apagar')) {
                setConversationState('delete_reminder_name');
                try {
                    await playAudioFast('deleteReminder');
                } catch {
                    await speakText('Qual lembrete deseja excluir?');
                }
                await new Promise(r => setTimeout(r, 1000));
                startRecording();
            } else {
                await playAudioFast('repeat');
            }
            setStatus('ready');
            return;
        }

        // Fluxo de criação
        if (conversationState === 'reminder_name') {
            currentReminderData.current.name = formatTitleCase(text.trim());
            console.log('✅ Nome:', currentReminderData.current.name);
            lastProcessedText.current = null;
            lastProcessedState.current = null;
            setConversationState('reminder_date');
            try {
                await playAudioFast('reminderDate');
            } catch {
                await speakText('Que dia gostaria de ser lembrado?');
            }
            await new Promise(r => setTimeout(r, 2000));
            startRecording();
        } else if (conversationState === 'reminder_date') {
            currentReminderData.current.dateRaw = text.trim();
            currentReminderData.current.date = normalizeDatePt(text);
            
            if (!currentReminderData.current.date || !currentReminderData.current.date.match(/\d{4}-\d{2}-\d{2}/)) {
                await speakText('Não entendi a data. Por favor, diga o dia e o mês.');
                lastProcessedText.current = null;
                lastProcessedState.current = null;
                await new Promise(r => setTimeout(r, 1500));
                startRecording();
                return;
            }
            
            console.log('✅ Data:', currentReminderData.current.date);
            lastProcessedText.current = null;
            lastProcessedState.current = null;
            setConversationState('reminder_time');
            try {
                await playAudioFast('reminderTime');
            } catch {
                await speakText('Que horas gostaria de ser lembrado?');
            }
            await new Promise(r => setTimeout(r, 2000));
            startRecording();
        } else if (conversationState === 'reminder_time') {
            currentReminderData.current.time = normalizeTimePt(text);
            console.log('✅ Hora:', currentReminderData.current.time);
            lastProcessedText.current = null;
            lastProcessedState.current = null;
            setConversationState('reminder_repeat');
            try {
                await playAudioFast('reminderRepeat');
            } catch {
                await speakText('Este é um lembrete que gostaria de repetir?');
            }
            await new Promise(r => setTimeout(r, 2000));
            startRecording();
        } else if (conversationState === 'reminder_repeat') {
            const hasYes = lowerText.includes('sim') || lowerText.includes('quero') || lowerText.includes('repetir');
            const hasNo = lowerText.includes('nao') || lowerText.includes('não');
            
            if (hasNo) {
                currentReminderData.current.repeat = false;
                await saveReminder();
            } else if (hasYes) {
                currentReminderData.current.repeat = true;
                setConversationState('reminder_days');
                await speakText('Quais dias da semana deseja repetir?');
                await new Promise(r => setTimeout(r, 1500));
                startRecording();
            } else {
                await playAudioFast('repeat');
                await new Promise(r => setTimeout(r, 1500));
                startRecording();
            }
        } else if (conversationState === 'reminder_days') {
            currentReminderData.current.repeatDays = text.trim();
            console.log('✅ Dias:', currentReminderData.current.repeatDays);
            await saveReminder();
        } else if (conversationState === 'delete_reminder_name') {
            await handleDeleteReminder(text.trim());
        }

        setStatus('ready');
    }, [conversationState, handleListReminders, handleDeleteReminder, saveReminder, playAudioFast, speakText, stopOutputAudio, formatTitleCase]);

    // Check Permission
    const checkMicrophonePermission = useCallback(async () => {
        if (microphonePermissionChecked.current) return microphonePermissionGranted.current;
        microphonePermissionChecked.current = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            currentStream.current = stream;
            microphonePermissionGranted.current = true;
            return true;
        } catch (error) {
            console.error('Erro permissão microfone:', error);
            microphonePermissionGranted.current = false;
            await speakText('Preciso de acesso ao microfone para funcionar.');
            return false;
        }
    }, [speakText]);

    // Start Recording com SpeechRecognition
    const startRecording = useCallback(async () => {
        if (isRecordingRef.current) return;
        
        if (recognition.current) {
            try {
                recognition.current.abort();
            } catch {}
            recognition.current = null;
        }

        // Parar qualquer áudio que esteja tocando antes de iniciar gravação
        stopOutputAudio();
        
        // Limpar textos pendentes ao iniciar nova gravação
        pendingRecognizedTexts.current = [];
        
        isRecordingRef.current = true;
        setIsRecording(true);
        setStatus('recording');

        if (!currentStream.current || !currentStream.current.active) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
                currentStream.current = stream;
                microphonePermissionGranted.current = true;
            } catch (e) {
                console.error('Mic error:', e);
                await speakText('Não consegui acessar o microfone.');
                isRecordingRef.current = false;
                setIsRecording(false);
                setStatus('ready');
                return;
            }
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            await speakText('Seu navegador não suporta reconhecimento de fala.');
            isRecordingRef.current = false;
            setIsRecording(false);
            setStatus('ready');
            return;
        }

        const rec = new SpeechRecognition();
        rec.interimResults = false;
        rec.lang = 'pt-BR';
        rec.continuous = true; // Mudar para true para continuar reconhecendo até o usuário clicar novamente
        rec.maxAlternatives = 1;

        recordingStartTime.current = Date.now();

        rec.onresult = (event: any) => {
            const last = event.results.length - 1;
            const spokenText = event.results[last][0].transcript.trim();
            console.log(`🗣️ Fala reconhecida: ${spokenText}`);
            
            // Acumular todas as frases reconhecidas em um array
            // A análise só acontecerá quando o usuário clicar novamente no microfone
            // NÃO parar o reconhecimento aqui - deixar continuar até o usuário clicar novamente
            if (spokenText && !pendingRecognizedTexts.current.includes(spokenText)) {
                pendingRecognizedTexts.current.push(spokenText);
                console.log(`📝 Frases acumuladas: [${pendingRecognizedTexts.current.join(', ')}]`);
            }
            
            // NÃO chamar rec.stop() aqui - deixar o reconhecimento continuar
            // O usuário deve clicar novamente no microfone para parar e processar
        };

        rec.onerror = async (event: any) => {
            console.error('Erro no SpeechRecognition:', event.error);
            
            if (event.error === 'no-speech') {
                isRecordingRef.current = false;
                setIsRecording(false);
                setStatus('ready');
                return;
            }
            
            if (event.error === 'aborted') return;
            
            if (event.error !== 'network') {
                await playAudioFast('repeat');
                setTimeout(() => {
                    if (conversationState !== 'welcome' && !isRecordingRef.current) {
                        startRecording();
                    }
                }, 2000);
            }
        };
        
        rec.onend = () => {
            console.log('Reconhecimento encerrado.');
            recordingStartTime.current = null;
            
            // Quando o reconhecimento termina, apenas atualizar o estado
            // NÃO processar o texto automaticamente - isso só acontece no próximo clique
            if (isRecordingRef.current) {
                isRecordingRef.current = false;
                setIsRecording(false);
                setStatus('ready');
            }
            
            // Limpar a referência do reconhecimento
            if (recognition.current === rec) {
                recognition.current = null;
            }
        };

        recognition.current = rec;
        
        try {
            rec.start();
            
            // Tocar apenas o áudio "estou ouvindo" quando iniciar a gravação
            // Aguardar um tempo maior para garantir que outros áudios pararam completamente
            setTimeout(async () => {
                // Garantir que nenhum outro áudio está tocando
                stopOutputAudio();
                
                // Aguardar um tempo maior para garantir que o stopOutputAudio terminou completamente
                // e que não há outros áudios sendo iniciados
                await new Promise(resolve => setTimeout(resolve, 400));
                
                // Verificar novamente se não há áudio tocando antes de tocar "estou ouvindo"
                if (currentPlayingAudio.current) {
                    stopOutputAudio();
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                // Tocar apenas o áudio "estou ouvindo" - nenhum outro áudio deve tocar
                try {
                    await playAudio('listening', 1.0);
                    listeningAudioEndTime.current = Date.now();
                } catch (e) {
                    console.log('Erro ao tocar áudio "estou ouvindo":', e);
                }
            }, 200);

            setTimeout(() => {
                if (isRecordingRef.current && rec) {
                    rec.stop();
                }
            }, CONFIG.maxRecordingTime);
            
        } catch (e) {
            console.error("Start error:", e);
            isRecordingRef.current = false;
            setIsRecording(false);
            setStatus('ready');
        }
    }, [conversationState, processRecognizedText, playAudioFast, speakText, stopOutputAudio]);

    // Stop Recording
    const stopRecording = useCallback(async () => {
        if (recognition.current) {
            try {
                recognition.current.abort();
            } catch {}
            recognition.current = null;
        }
        
        if (currentStream.current) {
            currentStream.current.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            currentStream.current = null;
        }
        
        // Não limpar pendingRecognizedText aqui, pois queremos processá-lo no próximo clique
        // O texto será limpo quando iniciar nova gravação ou quando for processado
        
        isRecordingRef.current = false;
        setIsRecording(false);
        recordingStartTime.current = null;
        listeningAudioEndTime.current = null;
        
        setStatus('ready');
        
        return new Promise(resolve => setTimeout(resolve, 300));
    }, []);

    const playWelcomeSequence = useCallback(async () => {
        // Verificar se já tocou algum áudio de apresentação (usando lock para evitar race condition)
        // Esta verificação deve ser a PRIMEIRA coisa, antes de qualquer delay
        if (presentationAudioPlayedRef.current) {
            console.log('Áudio de apresentação já foi tocado, ignorando chamada duplicada...');
            return;
        }
        
        // Marcar IMEDIATAMENTE antes de qualquer coisa para evitar race conditions
        // Esta é a única linha que deve executar antes da verificação acima
        presentationAudioPlayedRef.current = true;
        welcomePlayedRef.current = true;
        
        // Cancelar o timer de 30 segundos se ainda estiver ativo
        if (microphoneClickTimeoutRef.current) {
            clearTimeout(microphoneClickTimeoutRef.current);
            microphoneClickTimeoutRef.current = null;
        }
        
        // Cancelar o timeout inicial também
        if (initialWelcomeTimeoutRef.current) {
            clearTimeout(initialWelcomeTimeoutRef.current);
            initialWelcomeTimeoutRef.current = null;
        }
        
        // Aguardar um tempo antes de tocar para evitar conflitos com outros áudios
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verificar novamente se ainda não tocou (double check após o delay)
        // Se outro áudio estiver tocando, não tocar o de apresentação
        if (currentPlayingAudio.current) {
            console.log('Áudio já está tocando, cancelando apresentação...');
            presentationAudioPlayedRef.current = false; // Resetar para permitir tentar depois
            return;
        }
        
        // Verificar uma última vez se a flag ainda está ativa (triple check)
        if (!presentationAudioPlayedRef.current) {
            console.log('Flag foi resetada, cancelando apresentação...');
            return;
        }
        
        try {
            // Sempre usar apenas apresentacao5
            await playAudio('presentation5', 1.0);
            setConversationState('listening');
        } catch (e) {
            // Se falhar, resetar a flag para permitir tentar novamente
            console.log('Erro ao tocar áudio de apresentação:', e);
            presentationAudioPlayedRef.current = false;
            setConversationState('listening');
        }
    }, [playAudio]);

    // Tocar áudio de carregamento quando isGeneratingAudio for true (mas não quando for para escutar lembrete)
    useEffect(() => {
        if (isGeneratingAudio && shouldPlayLoadingAudio) {
            playAudio('loading', 1.0).catch(() => {
                // Se falhar, não faz nada - o áudio é opcional
            });
        }
    }, [isGeneratingAudio, shouldPlayLoadingAudio, playAudio]);

    // Init
    useEffect(() => {
        checkMicrophonePermission();
        loadReminders();
        
        // Aguardar um pouco antes de tocar o áudio de apresentação inicial
        initialWelcomeTimeoutRef.current = setTimeout(() => {
            if (!presentationAudioPlayedRef.current) {
                playWelcomeSequence().catch(() => {
                    welcomePlayedRef.current = false;
                    presentationAudioPlayedRef.current = false;
                });
            }
        }, 500);
        
        Object.values(AUDIO_FILES).forEach(file => {
            const audio = new Audio(`${CONFIG.audioPath}${file}`);
            audio.preload = 'auto';
        });
        
        const unlock = () => {
            // Cancelar o timeout inicial se ainda não executou
            if (initialWelcomeTimeoutRef.current) {
                clearTimeout(initialWelcomeTimeoutRef.current);
                initialWelcomeTimeoutRef.current = null;
            }
            
            // Não tocar aqui - deixar apenas o timeout inicial tocar
            // Isso evita que toque duas vezes
        };
        window.addEventListener('click', unlock, { once: true });
        
        // Timer de 30 segundos para tocar apresentacao5 se não clicar no microfone
        microphoneClickTimeoutRef.current = setTimeout(() => {
            // Verificar novamente antes de tocar (double check)
            if (!hasClickedMicrophoneRef.current && !presentationAudioPlayedRef.current) {
                // Usar playWelcomeSequence para garantir que use a mesma lógica e proteções
                playWelcomeSequence().catch(() => {
                    console.log('Erro ao tocar apresentacao5 no timeout de 30s');
                    presentationAudioPlayedRef.current = false;
                });
            }
        }, 30000); // 30 segundos
        
        return () => {
            if (recognition.current) try { recognition.current.abort(); } catch {}
            window.removeEventListener('click', unlock);
            if (microphoneClickTimeoutRef.current) {
                clearTimeout(microphoneClickTimeoutRef.current);
            }
            if (initialWelcomeTimeoutRef.current) {
                clearTimeout(initialWelcomeTimeoutRef.current);
            }
        };
    }, [checkMicrophonePermission, playWelcomeSequence, loadReminders, playAudio]);

    return {
        status,
        feedback,
        isRecording,
        toggleRecording: async () => {
            console.log('🎤 toggleRecording chamado. isRecording:', isRecording, 'pendingTexts:', pendingRecognizedTexts.current);
            
            // Marcar que o usuário clicou no microfone e limpar o timer dos 30 segundos
            hasClickedMicrophoneRef.current = true;
            if (microphoneClickTimeoutRef.current) {
                clearTimeout(microphoneClickTimeoutRef.current);
                microphoneClickTimeoutRef.current = null;
            }
            
            // Parar qualquer áudio que esteja tocando antes de iniciar gravação
            stopOutputAudio();
            
            if (isRecording) {
                // Se está gravando, parar o reconhecimento e processar os textos pendentes
                console.log('⏹️ Parando gravação...');
                
                // Parar o reconhecimento primeiro
                if (recognition.current) {
                    try {
                        recognition.current.stop();
                    } catch {}
                }
                
                await stopRecording();
                
                // Aguardar um pouco para garantir que o onresult foi chamado
                await new Promise(r => setTimeout(r, 300));
                
                // Juntar todas as frases e processar
                if (pendingRecognizedTexts.current.length > 0) {
                    const combinedText = pendingRecognizedTexts.current.join(' ').trim();
                    console.log('✅ Processando texto completo (juntado):', combinedText);
                    console.log('📋 Frases individuais:', pendingRecognizedTexts.current);
                    pendingRecognizedTexts.current = [];
                    await processRecognizedText(combinedText);
                }
            } else {
                // Se não está gravando, verificar se há textos pendentes para processar
                if (pendingRecognizedTexts.current.length > 0) {
                    const combinedText = pendingRecognizedTexts.current.join(' ').trim();
                    console.log('✅ Processando texto completo (juntado):', combinedText);
                    console.log('📋 Frases individuais:', pendingRecognizedTexts.current);
                    pendingRecognizedTexts.current = [];
                    await processRecognizedText(combinedText);
                } else {
                    // Se não há texto pendente, iniciar nova gravação
                    console.log('🎙️ Iniciando nova gravação...');
                    startRecording();
                }
            }
        },
        conversationState,
        reminders,
        showRemindersList,
        showSuccessAnimation,
        isGeneratingAudio,
        loadingReminderId,
        isLoadingReminders,
        loadReminders,
        speakReminder,
        closeRemindersList,
        handleDeleteReminder,
        deleteConfirmation,
        confirmDeleteReminder,
        cancelDeleteReminder
    };
}
