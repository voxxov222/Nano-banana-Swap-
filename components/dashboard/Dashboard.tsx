import React from 'react';
import { Page } from '../../types';
import { FeatureCard } from './FeatureCard';
import { Rocket, Repeat, ImageIcon, Scissors, ScanSearch, Clapperboard, Mic, MessageSquare, AudioWaveform, BrainCircuit, Sparkles } from 'lucide-react';

interface DashboardProps {
    setActivePage: (page: Page) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActivePage }) => {
  const features = [
    { page: 'tokenLauncher' as Page, icon: Rocket, title: 'Token Launcher', description: 'Deploy your own BEP-20 token on the BNB Smart Chain.' },
    { page: 'swap' as Page, icon: Repeat, title: 'Nano Swap', description: 'A mock interface to swap tokens, styled after PancakeSwap.' },
    { page: 'nftGenerator' as Page, icon: Sparkles, title: 'NFT Generator', description: 'Create unique digital art and metadata for your NFT collection.' },
    { page: 'imageGenerator' as Page, icon: ImageIcon, title: 'Image Generator', description: 'Create stunning visuals from text prompts with Imagen 4.' },
    { page: 'imageEditor' as Page, icon: Scissors, title: 'Image Editor', description: 'Edit and modify your images using conversational prompts.' },
    { page: 'imageAnalyzer' as Page, icon: ScanSearch, title: 'Image Analyzer', description: 'Understand the content of your images and get insights.' },
    { page: 'videoGenerator' as Page, icon: Clapperboard, title: 'Video Generator', description: 'Generate high-quality videos from text or images with Veo.' },
    { page: 'voiceAssistant' as Page, icon: Mic, title: 'Voice Assistant', description: 'Have real-time conversations with a Gemini-powered AI.' },
    { page: 'chatbot' as Page, icon: MessageSquare, title: 'Chatbot', description: 'Chat with Gemini and get real-time info with Search Grounding.' },
    { page: 'audioTranscriber' as Page, icon: AudioWaveform, title: 'Audio Transcriber', description: 'Transcribe spoken words from any audio file.' },
    { page: 'complexTaskSolver' as Page, icon: BrainCircuit, title: 'Complex Solver', description: 'Tackle complex problems with Gemini Pro in Thinking Mode.' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-yellow-300">Welcome to the Nano Banana AI Studio</h1>
        <p className="mt-2 text-gray-400">Your all-in-one platform for creating on the BNB Smart Chain with the power of Google AI.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(feature => (
          <FeatureCard 
            key={feature.page}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            onClick={() => setActivePage(feature.page)}
          />
        ))}
      </div>
    </div>
  );
};
