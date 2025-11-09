import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { generateImage, editImage, generateNftMetadata, generateVideo, checkVideoOperation } from '../../services/geminiService';
import { dataUrlToFile } from '../../utils/fileUtils';
import { NFTMetadata } from '../../types';
import { UploadCloud, Sparkles, Image as ImageIcon, Clapperboard, Video } from 'lucide-react';
import { ApiKeySelector } from '../ui/ApiKeySelector';
import { VideosOperation } from '@google/genai';

const ART_STYLES = ["Photorealistic", "Cartoon", "Pixel Art", "Abstract", "3D Render", "Vaporwave", "Steampunk"];
const IMAGE_ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const VIDEO_ASPECT_RATIOS = ['16:9', '9:16'];

const LOADING_MESSAGES = [
    "Warming up the digital director...",
    "Assembling pixels into a masterpiece...",
    "Teaching virtual actors their lines...",
    "Waiting for the cosmic render farm...",
    "Polishing the final cut...",
];

type NftType = 'image' | 'video';
type GenerationStatus = 'idle' | 'key_selection' | 'generating' | 'polling' | 'success' | 'error';


export const NftGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A mystical banana king sitting on a throne in a cosmic jungle');
    const [artStyle, setArtStyle] = useState(ART_STYLES[0]);
    const [aspectRatio, setAspectRatio] = useState('1:1');
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
    
    const [nftType, setNftType] = useState<NftType>('image');
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [error, setError] = useState<string | null>(null);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setOriginalImageUrl(URL.createObjectURL(file));
        }
    };

    const handleNftTypeChange = (type: NftType) => {
        setNftType(type);
        setGeneratedImageUrl(null);
        setGeneratedVideoUrl(null);
        setMetadata(null);
        setError(null);
        setStatus(type === 'video' ? 'key_selection' : 'idle');
        setAspectRatio(type === 'video' ? '16:9' : '1:1');
    };

    const handleKeySelected = () => {
        setStatus('idle');
    };

    const generateThumbnailForMetadata = (videoUrl: string): Promise<File> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = videoUrl;
            video.crossOrigin = 'anonymous';
            video.onloadeddata = () => {
                video.currentTime = 1; // Seek to 1s to get a good frame
            };
            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject('Could not get canvas context');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (blob) => {
                    if (!blob) return reject('Could not create blob from canvas');
                    resolve(new File([blob], 'nft-thumbnail.jpg', { type: 'image/jpeg' }));
                }, 'image/jpeg');
            };
            video.onerror = (e) => reject(`Video error: ${e}`);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;

        setStatus('generating');
        setError(null);
        setGeneratedImageUrl(null);
        setGeneratedVideoUrl(null);
        setMetadata(null);
        
        const finalPrompt = `${prompt}, ${artStyle} style.`;

        if (nftType === 'image') {
            await handleImageGeneration(finalPrompt);
        } else {
            await handleVideoGeneration(finalPrompt);
        }
    };
    
    const handleImageGeneration = async (fullPrompt: string) => {
        try {
            let imageUrl: string;
            if (imageFile) {
                imageUrl = await editImage(fullPrompt, imageFile);
            } else {
                imageUrl = await generateImage(fullPrompt, aspectRatio);
            }
            setGeneratedImageUrl(imageUrl);

            const nftImageFile = await dataUrlToFile(imageUrl, 'nft-image.jpg');
            const generatedMeta = await generateNftMetadata(nftImageFile);
            setMetadata(generatedMeta);
            setStatus('success');
        } catch (err) {
            handleError(err);
        }
    };

    const handleVideoGeneration = async (fullPrompt: string) => {
        startLoadingMessages();
        try {
            const initialOperation = await generateVideo(fullPrompt, imageFile, aspectRatio as '16:9' | '9:16');
            setStatus('polling');
            pollOperation(initialOperation);
        } catch (err) {
            handleError(err);
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
                        const videoUrl = URL.createObjectURL(videoBlob);
                        setGeneratedVideoUrl(videoUrl);
                        
                        // Generate metadata from a video frame
                        const thumbnailFile = await generateThumbnailForMetadata(videoUrl);
                        const generatedMeta = await generateNftMetadata(thumbnailFile);
                        setMetadata(generatedMeta);
                        setStatus('success');
                    } else {
                        throw new Error('Video generation completed, but no video URI was found.');
                    }
                }
            } catch (err) {
                handleError(err);
            }
        }, 10000);
    }, [cleanupIntervals]);

    const startLoadingMessages = () => {
        let index = 0;
        setLoadingMessage(LOADING_MESSAGES[index]);
        messageIntervalRef.current = window.setInterval(() => {
            index = (index + 1) % LOADING_MESSAGES.length;
            setLoadingMessage(LOADING_MESSAGES[index]);
        }, 5000);
    };

    const handleError = (err: any) => {
        cleanupIntervals();
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        if(errorMessage.includes("Requested entity was not found")) {
             setError("API Key not valid. Please select a key again.");
             setStatus('key_selection');
        } else {
             setError(errorMessage);
             setStatus('error');
        }
    };

    const currentAspectRatios = nftType === 'image' ? IMAGE_ASPECT_RATIOS : VIDEO_ASPECT_RATIOS;

    return (
        <Card className="max-w-6xl mx-auto">
            <CardHeader>
                <CardTitle>NFT Generator</CardTitle>
                <CardDescription>Create unique digital art and metadata for your next NFT collection using Gemini.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form Section */}
                    <div className="space-y-6">
                        <div className="flex bg-gray-800 p-1 rounded-lg">
                            <Button onClick={() => handleNftTypeChange('image')} variant={nftType === 'image' ? 'primary' : 'secondary'} className="flex-1">Image NFT</Button>
                            <Button onClick={() => handleNftTypeChange('video')} variant={nftType === 'video' ? 'primary' : 'secondary'} className="flex-1">Animated NFT</Button>
                        </div>

                        {status === 'key_selection' && nftType === 'video' ? (
                            <ApiKeySelector onKeySelected={handleKeySelected} featureName="Animated NFT Generation" />
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Base Image (Optional)</Label>
                                    <div 
                                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:border-yellow-400"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="space-y-1 text-center">
                                            {originalImageUrl ? (
                                                <img src={originalImageUrl} alt="Original" className="mx-auto max-h-24 rounded-md"/>
                                            ) : (
                                                <>
                                                    <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                                                    <p className="text-sm text-gray-500">Upload an image to edit</p>
                                                </>
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="prompt">Prompt</Label>
                                    <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} required/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Art Style</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {ART_STYLES.map(style => (
                                            <Button key={style} type="button" variant={artStyle === style ? 'primary' : 'secondary'} onClick={() => setArtStyle(style)}>{style}</Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Aspect Ratio {!imageFile && <span className="text-gray-400 text-xs">(for new generations)</span>}</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {currentAspectRatios.map(ratio => (
                                            <Button key={ratio} type="button" variant={aspectRatio === ratio ? 'primary' : 'secondary'} onClick={() => setAspectRatio(ratio)} disabled={!!imageFile}>{ratio}</Button>
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" disabled={status === 'generating' || status === 'polling' || !prompt} className="w-full">
                                    {(status === 'generating' || status === 'polling') ? <Spinner size="sm" className="mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                    {status === 'generating' || status === 'polling' ? 'Generating...' : `Generate ${nftType === 'image' ? 'Image' : 'Animation'}`}
                                </Button>
                            </form>
                        )}
                    </div>
                    {/* Result Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-center bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-lg p-4 min-h-[300px] lg:min-h-[400px]">
                             {(status === 'generating' || status === 'polling') && (
                                <div className="text-center">
                                    <Spinner size="lg" />
                                    <p className="mt-4 text-yellow-300">{loadingMessage}</p>
                                    <p className="text-sm text-gray-400 mt-1">Video generation can take a few minutes.</p>
                                </div>
                            )}
                             {status === 'error' && <p className="text-red-500 text-center">{error}</p>}
                             {status === 'success' && generatedImageUrl && (
                                <img src={generatedImageUrl} alt="Generated NFT" className="rounded-lg max-w-full max-h-full object-contain" />
                            )}
                            {status === 'success' && generatedVideoUrl && (
                                <video src={generatedVideoUrl} controls autoPlay loop className="rounded-lg max-w-full max-h-full" />
                            )}
                            {status === 'idle' && (
                                <div className="text-center text-gray-500">
                                    {nftType === 'image' ? <ImageIcon className="mx-auto h-12 w-12" /> : <Video className="mx-auto h-12 w-12" />}
                                    <p className="mt-2">Your generated NFT will appear here.</p>
                                </div>
                            )}
                        </div>
                        
                        {metadata && status === 'success' && (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
                                <h3 className="text-xl font-bold text-yellow-300">{metadata.title}</h3>
                                <p className="text-sm text-gray-300">{metadata.description}</p>
                                <div className="border-t border-gray-700 pt-3">
                                    <h4 className="font-semibold text-gray-200 mb-2">Attributes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {metadata.attributes.map((attr, index) => (
                                            <div key={index} className="bg-gray-700 rounded-lg px-3 py-1.5">
                                                <p className="text-xs text-gray-400 font-semibold uppercase">{attr.trait_type}</p>
                                                <p className="text-sm text-white">{attr.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {(generatedImageUrl || generatedVideoUrl) && status === 'success' && (
                             <Button disabled={true} className="w-full" title="Blockchain integration coming soon!">Mint NFT (Coming Soon)</Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
