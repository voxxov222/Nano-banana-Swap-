import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { editImage } from '../../services/geminiService';
import { UploadCloud, Image, ArrowRight } from 'lucide-react';

export const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('Add a retro, vintage filter to the image.');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setEditedImageUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt || !imageFile) return;

        setIsLoading(true);
        setError(null);
        setEditedImageUrl(null);

        try {
            const resultUrl = await editImage(prompt, imageFile);
            setEditedImageUrl(resultUrl);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <CardTitle>AI Image Editor</CardTitle>
                <CardDescription>Upload an image and describe your edits using Gemini 2.5 Flash Image.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                             <Label htmlFor="image-upload">Original Image</Label>
                             <div 
                                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-yellow-400"
                                onClick={() => fileInputRef.current?.click()}
                             >
                                <div className="space-y-1 text-center">
                                    {originalImageUrl ? (
                                        <img src={originalImageUrl} alt="Original" className="mx-auto max-h-32 rounded-md"/>
                                    ) : (
                                        <>
                                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="text-sm text-gray-500">Click to upload an image</p>
                                        </>
                                    )}
                                </div>
                                <input id="image-upload" ref={fileInputRef} name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                             </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt">Editing Prompt</Label>
                            <Textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., Change the background to a beach"
                                rows={5}
                            />
                        </div>
                     </div>
                     <Button type="submit" disabled={isLoading || !prompt || !imageFile} className="w-full">
                        {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                        {isLoading ? 'Editing...' : 'Apply Edit'}
                    </Button>
                </form>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div className="flex flex-col items-center justify-center bg-gray-900/50 border border-dashed border-gray-700 rounded-lg p-4 min-h-[300px]">
                        <h3 className="text-lg font-semibold mb-2 text-gray-400">Original</h3>
                        {originalImageUrl ? <img src={originalImageUrl} alt="Original Preview" className="rounded-lg max-w-full max-h-full object-contain" /> : <p className="text-gray-500">Upload an image to start</p>}
                    </div>
                     <div className="flex flex-col items-center justify-center bg-gray-900/50 border border-dashed border-gray-700 rounded-lg p-4 min-h-[300px]">
                        <h3 className="text-lg font-semibold mb-2 text-gray-400">Edited</h3>
                        {isLoading && <Spinner size="lg" />}
                        {editedImageUrl && <img src={editedImageUrl} alt="Edited Preview" className="rounded-lg max-w-full max-h-full object-contain" />}
                        {!isLoading && !editedImageUrl && <p className="text-gray-500">Your edited image will appear here</p>}
                    </div>
                </div>

            </CardContent>
        </Card>
    );
};
