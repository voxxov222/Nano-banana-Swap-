import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { generateImage } from '../../services/geminiService';
import { ImageIcon } from 'lucide-react';

export const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A golden banana-shaped rocket flying through a cosmic nebula, hyperrealistic.');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const imageUrl = await generateImage(prompt, aspectRatio);
            setGeneratedImage(imageUrl);
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
                <CardTitle>Image Generator</CardTitle>
                <CardDescription>Create stunning visuals from text prompts using Imagen 4.0.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="prompt">Prompt</Label>
                            <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A cute robot holding a banana"
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Aspect Ratio</Label>
                            <div className="flex flex-wrap gap-2">
                                {aspectRatios.map(ratio => (
                                    <Button
                                        key={ratio}
                                        type="button"
                                        variant={aspectRatio === ratio ? 'primary' : 'secondary'}
                                        onClick={() => setAspectRatio(ratio)}
                                    >
                                        {ratio}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Button type="submit" disabled={isLoading || !prompt} className="w-full">
                            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                            {isLoading ? 'Generating...' : 'Generate Image'}
                        </Button>
                    </form>

                    <div className="flex items-center justify-center bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg p-4 min-h-[300px]">
                        {isLoading && <Spinner size="lg" />}
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        {generatedImage && (
                            <img src={generatedImage} alt="Generated" className="rounded-lg max-w-full max-h-full object-contain" />
                        )}
                        {!isLoading && !error && !generatedImage && (
                            <div className="text-center text-gray-500">
                                <ImageIcon className="mx-auto h-12 w-12" />
                                <p className="mt-2">Your generated image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
