import { GoogleGenAI, GenerateContentResponse, Modality, Chat, VideosOperation } from "@google/genai";
import { MODELS } from '../constants';
import { NFTMetadata } from '../types';

const getApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set.");
  }
  return apiKey;
};

// General purpose AI instance
const ai = new GoogleGenAI({ apiKey: getApiKey() });

// --- Text & Chat ---

export const generateQuickSuggestion = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: MODELS.GEMINI_FLASH_LITE,
    contents: prompt,
  });
  return response.text;
};

export const createChat = (): Chat => {
  return ai.chats.create({
    model: MODELS.GEMINI_FLASH,
  });
};

export const generateGroundedResponse = async (prompt: string): Promise<GenerateContentResponse> => {
    return await ai.models.generateContent({
        model: MODELS.GEMINI_FLASH,
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
};

export const solveComplexTask = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: MODELS.GEMINI_PRO,
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });
    return response.text;
};

// --- Image ---

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: MODELS.IMAGEN_4,
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio,
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

const fileToGenerativePart = (file: File) => {
  return new Promise<{inlineData: {data: string, mimeType: string}}>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        return reject(new Error("Failed to read file as base64 string"));
      }
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


export const analyzeImage = async (prompt: string, image: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(image);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: MODELS.GEMINI_FLASH,
        contents: { parts: [imagePart, textPart] },
    });
    return response.text;
};

export const editImage = async (prompt: string, image: File): Promise<string> => {
    const imagePart = await fileToGenerativePart(image);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: MODELS.GEMINI_FLASH_IMAGE,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("No image generated in response");
};

export const generateNftMetadata = async (image: File): Promise<NFTMetadata> => {
    const imagePart = await fileToGenerativePart(image);
    const prompt = `Analyze this image and generate metadata for it as an NFT. Provide a creative title, a short, compelling description, and a list of 3-5 attributes (traits). Respond with ONLY a valid JSON object in the following format: {"title": "...", "description": "...", "attributes": [{"trait_type": "...", "value": "..."}, ...]}`;
    
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: MODELS.GEMINI_FLASH,
        contents: { parts: [imagePart, textPart] },
    });
    
    try {
        // The model might wrap the JSON in markdown, so we strip it.
        const jsonString = response.text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonString) as NFTMetadata;
    } catch (e) {
        console.error("Failed to parse NFT metadata JSON:", e, "Raw response:", response.text);
        throw new Error("The AI failed to generate valid metadata in JSON format. Please try again.");
    }
};


// --- Video ---

export const generateVideo = async (prompt: string, image: File | null, aspectRatio: '16:9' | '9:16'): Promise<VideosOperation> => {
    // Veo requires just-in-time instantiation to get the latest key from the selector dialog
    const veoAI = new GoogleGenAI({ apiKey: getApiKey() });

    const imagePayload = image ? {
        imageBytes: (await fileToGenerativePart(image)).inlineData.data,
        mimeType: image.type,
    } : undefined;

    return await veoAI.models.generateVideos({
        model: MODELS.VEO_3_1_FAST,
        prompt,
        image: imagePayload,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio,
        }
    });
};

export const checkVideoOperation = async (operation: VideosOperation): Promise<VideosOperation> => {
    const veoAI = new GoogleGenAI({ apiKey: getApiKey() });
    return await veoAI.operations.getVideosOperation({ operation });
};


// --- Audio ---

export const transcribeAudio = async (audio: File): Promise<string> => {
    const audioPart = await fileToGenerativePart(audio);
    const promptPart = { text: "Transcribe the following audio." };
    
    const response = await ai.models.generateContent({
        model: MODELS.GEMINI_FLASH,
        contents: { parts: [audioPart, promptPart] }
    });
    return response.text;
};
