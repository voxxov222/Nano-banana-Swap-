import React, { useState, useMemo } from 'react';
import { Token } from '../../types';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';

interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: Token) => void;
  tokens: Token[];
}

export const TokenSelectModal: React.FC<TokenSelectModalProps> = ({ isOpen, onClose, onSelectToken, tokens }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query)
    );
  }, [searchQuery, tokens]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div 
        className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm flex flex-col overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Select a token</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <Input
            placeholder="Search name or symbol"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-grow overflow-y-auto px-4 pb-4">
          <ul className="space-y-2">
            {filteredTokens.map((token) => (
              <li key={token.symbol}>
                <button
                  onClick={() => {
                    onSelectToken(token);
                    onClose();
                  }}
                  className="w-full flex items-center p-2 rounded-lg hover:bg-gray-700"
                >
                  <token.icon className="h-8 w-8 mr-3" />
                  <div>
                    <p className="font-bold text-left">{token.symbol}</p>
                    <p className="text-sm text-gray-400 text-left">{token.name}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};