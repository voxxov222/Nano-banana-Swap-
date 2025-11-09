import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { encode, decode, decodeAudioData } from '../../utils/audioUtils';
import { TranscriptionEntry } from '../../types';
import { MODELS } from '../../constants';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// Main component defined at the top level
export const VoiceAssistant: React.FC = () => {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
    const [isMuted, setIsMuted] = useState(false);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const stopAudioProcessing = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
             outputAudioContextRef.current.close();
             outputAudioContextRef.current = null;
        }
    }, []);

    const disconnect = useCallback(async () => {
        setStatus('disconnected');
        stopAudioProcessing();
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }
        outputSourcesRef.current.forEach(source => source.stop());
        outputSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, [stopAudioProcessing]);

    const handleConnect = useCallback(async () => {
        if (status === 'connected' || status === 'connecting') return;
        setStatus('connecting');
        setTranscriptionHistory([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            sessionPromiseRef.current = ai.live.connect({
                model: MODELS.GEMINI_LIVE,
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                        setStatus('connected');
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            const fullOutput = currentOutputTranscriptionRef.current.trim();
                             setTranscriptionHistory(prev => {
                                const newHistory = [...prev];
                                if (fullInput) newHistory.push({ speaker: 'user', text: fullInput });
                                if (fullOutput) newHistory.push({ speaker: 'model', text: fullOutput });
                                return newHistory;
                            });
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }
                        
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                            const outputContext = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outputContext, OUTPUT_SAMPLE_RATE, 1);
                            const source = outputContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputContext.destination);
                            source.addEventListener('ended', () => {
                                outputSourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            outputSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e) => {
                        console.error('Live session error:', e);
                        setStatus('error');
                        disconnect();
                    },
                    onclose: () => {
                       disconnect();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                },
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            setStatus('error');
        }
    }, [status, disconnect]);

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);
    
    useEffect(() => {
        if(inputAudioContextRef.current) {
            if(isMuted) {
                inputAudioContextRef.current.suspend();
            } else {
                inputAudioContextRef.current.resume();
            }
        }
    }, [isMuted]);

    return (
        <Card className="max-w-2xl mx-auto flex flex-col" style={{minHeight: '70vh'}}>
            <CardHeader>
                <CardTitle>Conversational Voice Assistant</CardTitle>
                <CardDescription>Speak with Gemini in real-time. Connect your microphone to begin.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
                <div className="flex-grow bg-gray-800/50 rounded-lg p-4 mb-4 overflow-y-auto">
                    {transcriptionHistory.length === 0 && (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Conversation will appear here...</p>
                        </div>
                    )}
                    <div className="space-y-4">
                        {transcriptionHistory.map((entry, index) => (
                            <div key={index} className={`flex items-start gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                                {entry.speaker === 'model' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold">AI</div>}
                                <div className={`p-3 rounded-lg max-w-sm ${entry.speaker === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                                    <p className="text-sm">{entry.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                    {status === 'disconnected' || status === 'error' ? (
                        <Button onClick={handleConnect}>Start Conversation</Button>
                    ) : (
                        <Button onClick={disconnect} variant="destructive">End Conversation</Button>
                    )}
                     {status === 'connected' && (
                        <Button onClick={() => setIsMuted(!isMuted)} variant="secondary" className="p-3 h-auto">
                            {isMuted ? <MicOff /> : <Mic />}
                        </Button>
                     )}
                </div>
                 <p className="text-center text-sm text-gray-400 mt-4">
                    Status: <span className={`font-semibold ${status === 'connected' ? 'text-green-400' : 'text-yellow-400'}`}>{status}</span>
                </p>
                {status === 'error' && <p className="text-center text-sm text-red-500 mt-2">Connection failed. Please try again.</p>}
            </CardContent>
        </Card>
    );
};
