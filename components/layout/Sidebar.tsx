import React from 'react';
import { Page } from '../../types';
import { LayoutDashboard, Rocket, Repeat, ImageIcon, Scissors, ScanSearch, Clapperboard, Mic, MessageSquare, AudioWaveform, BrainCircuit, X, Sparkles } from 'lucide-react';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  page: Page;
  activePage: Page;
  onClick: (page: Page) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, page, activePage, onClick }) => {
    const isActive = activePage === page;
    return (
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(page); }}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-yellow-400 text-gray-900'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
        >
            <Icon className="h-5 w-5 mr-3" />
            <span>{label}</span>
        </a>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, isOpen, setOpen }) => {
  
  const handleNavigation = (page: Page) => {
    setActivePage(page);
    setOpen(false); // Close sidebar on navigation
  };
  
  const navItems = [
      { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' as Page },
      { icon: Rocket, label: 'Token Launcher', page: 'tokenLauncher' as Page },
      { icon: Repeat, label: 'Nano Swap', page: 'swap' as Page },
      { icon: Sparkles, label: 'NFT Generator', page: 'nftGenerator' as Page },
      { icon: ImageIcon, label: 'Image Generator', page: 'imageGenerator' as Page },
      { icon: Scissors, label: 'Image Editor', page: 'imageEditor' as Page },
      { icon: ScanSearch, label: 'Image Analyzer', page: 'imageAnalyzer' as Page },
      { icon: Clapperboard, label: 'Video Generator', page: 'videoGenerator' as Page },
      { icon: Mic, label: 'Voice Assistant', page: 'voiceAssistant' as Page },
      { icon: MessageSquare, label: 'Chatbot', page: 'chatbot' as Page },
      { icon: AudioWaveform, label: 'Audio Transcriber', page: 'audioTranscriber' as Page },
      { icon: BrainCircuit, label: 'Complex Solver', page: 'complexTaskSolver' as Page },
  ];

  return (
    <>
    <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
    ></div>
    <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 z-40 flex flex-col p-4 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex-shrink-0`}>
        <div className="flex items-center justify-between mb-6 lg:hidden">
            <span className="text-lg font-bold text-yellow-300">Nano Banana</span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
            </button>
        </div>
        <nav className="flex-1 space-y-2">
            {navItems.map(item => (
                <NavItem key={item.page} {...item} activePage={activePage} onClick={handleNavigation} />
            ))}
        </nav>
    </aside>
    </>
  );
};
