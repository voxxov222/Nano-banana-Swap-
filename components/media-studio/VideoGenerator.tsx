import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { generateVideo, checkVideoOperation } from '../../services/geminiService';
import { ApiKeySelector } from '../ui/ApiKeySelector';
import { VideosOperation } from '@google/genai';
import { UploadCloud, Clapperboard } from 'lucide-react';

type GenerationStatus = 'idle' | 'key_selection' | 'generating' | 'polling' | 'success' | 'error';

const LOADING_MESSAGES = [
    "Warming up the digital director...",
    "Assembling pixels into a masterpiece...",
    "Teaching virtual actors their lines...",
    "Waiting for the cosmic render farm...",
    "Polishing the final cut...",
];

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A neon hologram of a cat driving a banana car at top speed.');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [status, setStatus] = useState<GenerationStatus>('key_selection');
    const [error, setError] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingIntervalRef = useRef<number | null>(null);
    const messageIntervalRef = useRef<number | null>(null);

    const cleanupIntervals = useCallback(() => {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
        pollingIntervalRef.current = null;
        messageIntervalRef.current = null;
    }, []);
    
    useEffect(() => {
        return () => cleanupIntervals();
    }, [cleanupIntervals]);

    const startLoadingMessages = () => {
        let index = 0;
        setLoadingMessage(LOADING_MESSAGES[index]);
        messageIntervalRef.current = window.setInterval(() => {
            index = (index + 1) % LOADING_MESSAGES.length;
            setLoadingMessage(LOADING_MESSAGES[index]);
        }, 5000);
    };

    const handleKeySelected = () => {
        setStatus('idle');
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
        }
    };

    const pollOperation = useCallback(async (operation: VideosOperation) => {
        pollingIntervalRef.current = window.setInterval(async () => {
            try {
                const updatedOp = await checkVideoOperation(operation);
                if (updatedOp.done) {
                    cleanupIntervals();
                    if (updatedOp.response?.generatedVideos?.[0]?.video?.uri) {
                        const downloadLink = updatedOp.response.generatedVideos[0].video.uri;
                        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                        const videoBlob = await videoResponse.blob();
                        setGeneratedVideoUrl(URL.createObjectURL(videoBlob));
                        setStatus('success');
                    } else {
                        setError('Video generation completed, but no video URI was found.');
                        setStatus('error');
                    }
                }
            } catch (err) {
                cleanupIntervals();
                setError(err instanceof Error ? err.message : 'Failed to poll for video status.');
                setStatus('error');
            }
        }, 10000); // Poll every 10 seconds
    }, [cleanupIntervals]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;

        setStatus('generating');
        setError(null);
        setGeneratedVideoUrl(null);
        startLoadingMessages();

        try {
            const initialOperation = await generateVideo(prompt, imageFile, aspectRatio);
            setStatus('polling');
            pollOperation(initialOperation);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            if(errorMessage.includes("Requested entity was not found")) {
                 setError("API Key not valid. Please select a key again.");
                 setStatus('key_selection'); // Reset to re-trigger key selection
            } else {
                 setError(errorMessage);
                 setStatus('error');
            }
            cleanupIntervals();
        }
    };
    
    if (status === 'key_selection') {
        return <ApiKeySelector onKeySelected={handleKeySelected} featureName="Veo Video Generation" />;
    }

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Veo Video Generator</CardTitle>
                <CardDescription>Generate high-quality video from text or an image. This process can take a few minutes.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="prompt">Prompt</Label>
                            <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image-upload">Starting Image (Optional)</Label>
                            <div className="mt-1 flex items-center gap-4">
                               <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                                    <UploadCloud className="mr-2 h-4 w-4" /> Upload
                               </Button>
                               {imageFile && <span className="text-sm text-gray-400 truncate">{imageFile.name}</span>}
                               <input id="image-upload" ref={fileInputRef} type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Aspect Ratio</Label>
                            <div className="flex gap-2">
                                <Button type="button" variant={aspectRatio === '16:9' ? 'primary' : 'secondary'} onClick={() => setAspectRatio('16:9')}>Landscape (16:9)</Button>
                                <Button type="button" variant={aspectRatio === '9:16' ? 'primary' : 'secondary'} onClick={() => setAspectRatio('9:16')}>Portrait (9:16)</Button>
                            </div>
                        </div>
                        <Button type="submit" disabled={status === 'generating' || status === 'polling' || !prompt} className="w-full">
                            {(status === 'generating' || status === 'polling') && <Spinner size="sm" className="mr-2" />}
                            Generate Video
                        </Button>
                    </form>

                    <div className="flex flex-col items-center justify-center bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg p-4 min-h-[300px]">
                        {(status === 'generating' || status === 'polling') && (
                            <div className="text-center">
                                <Spinner size="lg" />
                                <p className="mt-4 text-yellow-300">{loadingMessage}</p>
                                <p className="text-sm text-gray-400 mt-1">This can take a few minutes. Please stay on this page.</p>
                            </div>
                        )}
                        {status === 'error' && <p className="text-red-500 text-center">{error}</p>}
                        {status === 'success' && generatedVideoUrl && (
                            <video src={generatedVideoUrl} controls autoPlay loop className="rounded-lg max-w-full max-h-full" />
                        )}
                        {status === 'idle' && (
                            <div className="text-center text-gray-500">
                                <Clapperboard className="mx-auto h-12 w-12" />
                                <p className="mt-2">Your generated video will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
