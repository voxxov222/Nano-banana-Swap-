import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between lg:justify-center">
      <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white">
        <Menu className="h-6 w-6" />
      </button>
      <h1 className="text-xl font-bold text-yellow-300">
        Nano Banana <span className="text-white font-normal">AI Studio</span>
      </h1>
       <div className="lg:hidden w-6"></div> {/* Spacer to center title */}
    </header>
  );
};
