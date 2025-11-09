import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { transcribeAudio } from '../../services/geminiService';
import { UploadCloud } from 'lucide-react';

export const AudioTranscriber: React.FC = () => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
            setTranscription(null);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!audioFile) return;

        setIsLoading(true);
        setError(null);
        setTranscription(null);

        try {
            const result = await transcribeAudio(audioFile);
            setTranscription(result);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Audio Transcriber</CardTitle>
                <CardDescription>Upload an audio file to get a text transcription from Gemini.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <div 
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-yellow-400"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="space-y-1 text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="text-sm text-gray-500">
                                    {audioFile ? audioFile.name : 'Click to upload an audio file'}
                                </p>
                                <input id="audio-upload" ref={fileInputRef} name="audio-upload" type="file" className="sr-only" accept="audio/*" onChange={handleFileChange} />
                            </div>
                        </div>
                    </div>
                    <Button type="submit" disabled={isLoading || !audioFile} className="w-full">
                        {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                        {isLoading ? 'Transcribing...' : 'Transcribe Audio'}
                    </Button>
                </form>

                {(isLoading || error || transcription) && (
                    <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2 min-h-[150px]">
                        <h3 className="font-semibold text-yellow-300">Transcription</h3>
                        {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {transcription && <p className="text-gray-300 whitespace-pre-wrap text-sm">{transcription}</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
