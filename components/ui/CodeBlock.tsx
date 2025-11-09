import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  fileName?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, fileName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden my-2 border border-gray-700">
      <div className="px-4 py-2 bg-gray-800 text-gray-400 text-sm font-mono border-b border-gray-700 flex items-center justify-between">
        <span>{fileName}</span>
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 p-1 rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-yellow-400"
            aria-label="Copy code"
        >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="relative p-4">
        <pre className="text-sm text-white overflow-x-auto">
          <code className={`language-${language}`}>{code.trim()}</code>
        </pre>
      </div>
    </div>
  );
};
