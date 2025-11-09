import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { BananaIcon } from '../ui/BananaIcon';
import { TokenSelectModal } from './TokenSelectModal';
import { Token } from '../../types';
import { ArrowDown, ChevronDown, Repeat } from 'lucide-react';
import { Spinner } from '../ui/Spinner';

const BnbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.624 13.92L12 18.544l-4.624-4.624 4.624 4.625V0l4.624 13.92z" fill="#F0B90B"></path>
    <path d="M12 0v18.545l-4.624-4.624L12 9.3l4.624 4.624L12 18.544V9.3l-4.624-4.624L12 0z" fill="#F0B90B"></path>
    <path d="M7.376 9.3l4.624 4.624v4.62l-4.624-4.623-4.625 4.624V9.3l4.625-4.625L2.75 9.3l4.625 4.624L2.75 9.3v9.248l4.625-4.624L12 18.544l-4.624-4.624" fill="#F0B90B"></path>
    <path d="M16.624 9.3l-4.624 4.624v4.62l4.624-4.623 4.625 4.624V9.3l-4.625-4.625 4.625 4.624-4.625-4.624v9.248l-4.624-4.624L12 18.544l4.624-4.624" fill="#F0B90B"></path>
  </svg>
);

const UsdcIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#2775CA"/>
        <path d="M14.931 7.341H9.897c-.328 0-.58.261-.58.58v8.158c0 .319.252.58.58.58h5.034c.328 0 .58-.261.58-.58V7.92c0-.319-.252-.58-.58-.58zm-1.121 7.55H11.04v-1.01h2.77v1.01zm0-2.22H11.04v-1.01h2.77v1.01zm0-2.23H11.04v-1.01h2.77v1.01z" fill="white"/>
    </svg>
);


const MOCK_TOKENS: Token[] = [
  { symbol: 'NANO', name: 'Nano Banana', icon: BananaIcon },
  { symbol: 'BNB', name: 'BNB', icon: BnbIcon },
  { symbol: 'USDC', name: 'USD Coin', icon: UsdcIcon },
];

const MOCK_RATES: { [key: string]: number } = {
  'NANO-BNB': 0.00033, 'BNB-NANO': 3000,
  'NANO-USDC': 0.15, 'USDC-NANO': 6.67,
  'BNB-USDC': 450, 'USDC-BNB': 0.0022,
};

export const Swap: React.FC = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [fromToken, setFromToken] = useState<Token>(MOCK_TOKENS[1]); // BNB
  const [toToken, setToToken] = useState<Token>(MOCK_TOKENS[0]); // NANO
  const [fromAmount, setFromAmount] = useState('1');
  const [toAmount, setToAmount] = useState('3000');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'from' | 'to' | null>(null);

  const handleAmountChange = (side: 'from' | 'to', value: string) => {
    if (isNaN(Number(value))) return;
    const rateKey = side === 'from' ? `${fromToken.symbol}-${toToken.symbol}` : `${toToken.symbol}-${fromToken.symbol}`;
    const rate = MOCK_RATES[rateKey] || 1;
    
    if (side === 'from') {
      setFromAmount(value);
      setToAmount((Number(value) * rate).toFixed(4));
    } else {
      setToAmount(value);
      setFromAmount((Number(value) / rate).toFixed(4));
    }
  };

  const handleTokenSelect = (token: Token) => {
    if (selectingFor === 'from') {
      if (token.symbol === toToken.symbol) { // If user selects the same token, swap them
        setToToken(fromToken);
      }
      setFromToken(token);
    } else {
       if (token.symbol === fromToken.symbol) {
        setFromToken(toToken);
      }
      setToToken(token);
    }
  };
  
  const handleSwapTokens = () => {
      const tempToken = fromToken;
      setFromToken(toToken);
      setToToken(tempToken);
  }

  const handleConnectWallet = () => {
    setIsSwapping(true);
    setTimeout(() => {
      setIsWalletConnected(true);
      setIsSwapping(false);
    }, 1000);
  };
  
  const handleSwap = () => {
      setIsSwapping(true);
      setTimeout(() => {
          alert(`Successfully swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}! (Mock)`);
          setIsSwapping(false);
          setFromAmount('1');
          handleAmountChange('from', '1');
      }, 1500);
  }

  return (
    <>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Nano Swap</CardTitle>
          <CardDescription>Trade tokens in an instant (Mock Interface)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {/* From Input */}
          <div className="bg-gray-700 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">From</span>
              <span className="text-xs text-gray-400">Balance: 12.5 (Mock)</span>
            </div>
            <div className="flex justify-between items-end">
              <Input
                type="text"
                value={fromAmount}
                onChange={e => handleAmountChange('from', e.target.value)}
                placeholder="0.0"
                className="bg-transparent border-none text-2xl p-0 h-auto focus:ring-0"
              />
              <Button variant="secondary" onClick={() => { setSelectingFor('from'); setIsModalOpen(true); }} className="flex items-center space-x-2">
                <fromToken.icon className="h-6 w-6" />
                <span>{fromToken.symbol}</span>
                <ChevronDown size={16} />
              </Button>
            </div>
          </div>

          {/* Swap Button */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <button onClick={handleSwapTokens} className="bg-gray-600 p-2 rounded-full border-4 border-gray-800 text-yellow-300 hover:bg-gray-500 transition">
                  <ArrowDown size={20} />
              </button>
          </div>

          {/* To Input */}
          <div className="bg-gray-700 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400">To</span>
               <span className="text-xs text-gray-400">Balance: 3,450.2 (Mock)</span>
            </div>
            <div className="flex justify-between items-end">
              <Input
                type="text"
                 value={toAmount}
                 onChange={e => handleAmountChange('to', e.target.value)}
                placeholder="0.0"
                className="bg-transparent border-none text-2xl p-0 h-auto focus:ring-0"
              />
              <Button variant="secondary" onClick={() => { setSelectingFor('to'); setIsModalOpen(true); }} className="flex items-center space-x-2">
                <toToken.icon className="h-6 w-6" />
                <span>{toToken.symbol}</span>
                <ChevronDown size={16} />
              </Button>
            </div>
          </div>
          
          {/* Price Info */}
           <div className="text-center text-sm text-gray-400">
               1 {fromToken.symbol} ≈ {(MOCK_RATES[`${fromToken.symbol}-${toToken.symbol}`] || 0).toFixed(4)} {toToken.symbol}
           </div>

          {/* Action Button */}
          <div className="pt-2">
            {!isWalletConnected ? (
              <Button onClick={handleConnectWallet} disabled={isSwapping} className="w-full text-lg h-12">
                {isSwapping && <Spinner size="sm" className="mr-2"/>} Connect Wallet
              </Button>
            ) : (
              <Button onClick={handleSwap} disabled={isSwapping || !fromAmount || !toAmount} className="w-full text-lg h-12">
                 {isSwapping && <Spinner size="sm" className="mr-2"/>}
                 {isSwapping ? 'Swapping...' : 'Swap'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <TokenSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectToken={handleTokenSelect}
        tokens={MOCK_TOKENS}
      />
    </>
  );
};