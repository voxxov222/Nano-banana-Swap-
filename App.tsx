import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { TokenLauncher } from './components/token-launcher/TokenLauncher';
import { ImageEditor } from './components/media-studio/ImageEditor';
import { ImageGenerator } from './components/media-studio/ImageGenerator';
import { VideoGenerator } from './components/media-studio/VideoGenerator';
import { ImageAnalyzer } from './components/media-studio/ImageAnalyzer';
import { VoiceAssistant } from './components/voice-studio/VoiceAssistant';
import { Chatbot } from './components/chat/Chatbot';
import { AudioTranscriber } from './components/tools/AudioTranscriber';
import { ComplexTaskSolver } from './components/tools/ComplexTaskSolver';
import { Swap } from './components/swap/Swap';
import { NftGenerator } from './components/nft-generator/NftGenerator';
import { Page } from './types';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = useCallback(() => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'tokenLauncher':
        return <TokenLauncher />;
      case 'swap':
        return <Swap />;
      case 'nftGenerator':
        return <NftGenerator />;
      case 'imageGenerator':
        return <ImageGenerator />;
      case 'imageEditor':
        return <ImageEditor />;
      case 'imageAnalyzer':
        return <ImageAnalyzer />;
      case 'videoGenerator':
        return <VideoGenerator />;
      case 'voiceAssistant':
        return <VoiceAssistant />;
      case 'chatbot':
        return <Chatbot />;
      case 'audioTranscriber':
        return <AudioTranscriber />;
      case 'complexTaskSolver':
        return <ComplexTaskSolver />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  }, [activePage]);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-900">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
