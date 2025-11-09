// FIX: Import React to resolve the 'Cannot find namespace React' error.
import React from 'react';

export type Page = 
  | 'dashboard'
  | 'tokenLauncher'
  | 'swap'
  | 'nftGenerator'
  | 'imageGenerator'
  | 'imageEditor'
  | 'imageAnalyzer'
  | 'videoGenerator'
  | 'voiceAssistant'
  | 'chatbot'
  | 'audioTranscriber'
  | 'complexTaskSolver';

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  sources?: GroundingSource[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface TranscriptionEntry {
  speaker: 'user' | 'model';
  text: string;
}

export interface Token {
  symbol: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NFTMetadata {
  title: string;
  description: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
}
