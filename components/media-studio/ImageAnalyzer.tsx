import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Label } from '../ui/Label';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { analyzeImage } from '../../services/geminiService';
import { UploadCloud } from 'lucide-react';
import { Textarea } from '../ui/Textarea';

export const ImageAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('Describe this image in detail. If it could be an NFT, what metadata properties would you suggest?');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
            setAnalysis(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile || !prompt) return;

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const result = await analyzeImage(prompt, imageFile);
            setAnalysis(result);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Image Content Analyzer</CardTitle>
                <CardDescription>Upload an image to get insights and metadata suggestions from Gemini.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="image-upload">Image</Label>
                            <div 
                                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-yellow-400"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="space-y-1 text-center">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="Upload preview" className="mx-auto max-h-32 rounded-md"/>
                                    ) : (
                                        <>
                                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="text-sm text-gray-500">Click to upload</p>
                                        </>
                                    )}
                                </div>
                                <input id="image-upload" ref={fileInputRef} name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="prompt">Analysis Prompt</Label>
                             <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., What is in this image?"
                                rows={4}
                            />
                        </div>

                        <Button type="submit" disabled={isLoading || !imageFile || !prompt} className="w-full">
                            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                            {isLoading ? 'Analyzing...' : 'Analyze Image'}
                        </Button>
                    </form>

                    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2 min-h-[300px]">
                        <h3 className="font-semibold text-yellow-300">Analysis Result</h3>
                        {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {analysis && <div className="text-gray-300 whitespace-pre-wrap text-sm">{analysis}</div>}
                        {!isLoading && !analysis && <p className="text-gray-500">Your analysis will appear here.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
