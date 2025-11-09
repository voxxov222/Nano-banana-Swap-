import React from 'react';
import { ChevronDown } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

interface CodeAccordionProps {
    title: string;
    fileName: string;
    language: string;
    code: string;
    defaultOpen?: boolean;
}

export const CodeAccordion: React.FC<CodeAccordionProps> = ({ title, fileName, language, code, defaultOpen = false }) => {
    return (
        <details className="group bg-gray-800 rounded-lg border border-gray-700" open={defaultOpen}>
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                <h4 className="text-lg font-semibold text-gray-200">{title}</h4>
                <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <div className="bg-gray-900/50">
               <CodeBlock code={code} language={language} fileName={fileName} />
            </div>
        </details>
    );
};
