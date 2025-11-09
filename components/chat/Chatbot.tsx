import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { createChat, generateGroundedResponse } from '../../services/geminiService';
import { ChatMessage, GroundingSource } from '../../types';
import { Chat } from '@google/genai';
import { Send, Search, Globe } from 'lucide-react';

export const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useGrounding, setUseGrounding] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatRef.current = createChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            let botResponseText = '';
            let sources: GroundingSource[] = [];

            if (useGrounding) {
                const response = await generateGroundedResponse(input);
                botResponseText = response.text;
                const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                if (groundingChunks) {
                    sources = groundingChunks
                        .map((chunk: any) => ({
                            title: chunk.web?.title || chunk.web?.uri,
                            uri: chunk.web?.uri,
                        }))
                        .filter((source: GroundingSource) => source.uri);
                }
            } else {
                if (!chatRef.current) throw new Error("Chat not initialized");
                const response = await chatRef.current.sendMessage({ message: input });
                botResponseText = response.text;
            }
            
            const botMessage: ChatMessage = { sender: 'bot', text: botResponseText, sources };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { sender: 'bot', text: 'Sorry, I encountered an error. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl mx-auto flex flex-col" style={{height: '80vh'}}>
            <CardHeader>
                <CardTitle>Gemini Chatbot</CardTitle>
                <CardDescription>Ask questions and get answers from Gemini.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-0">
                <div className="flex-grow p-4 overflow-y-auto bg-gray-800/50">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                {msg.sender === 'bot' && <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold">AI</div>}
                                <div className={`p-3 rounded-lg max-w-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 border-t border-gray-600 pt-2">
                                            <h4 className="text-xs font-semibold text-gray-400 mb-1 flex items-center"><Globe className="w-3 h-3 mr-1.5"/> Sources:</h4>
                                            <ul className="space-y-1">
                                                {msg.sources.map((source, i) => (
                                                    <li key={i}>
                                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-yellow-400 hover:underline truncate block">
                                                           {source.title || source.uri}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                         {isLoading && (
                            <div className="flex items-start gap-3">
                               <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 font-bold">AI</div>
                                <div className="p-3 rounded-lg bg-gray-700 flex items-center">
                                    <Spinner size="sm" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !input.trim()} className="p-2 h-auto">
                            <Send className="h-5 w-5" />
                        </Button>
                    </form>
                    <div className="mt-2 flex items-center justify-end">
                        <label htmlFor="grounding-toggle" className="flex items-center cursor-pointer text-sm text-gray-400">
                            <input
                                id="grounding-toggle"
                                type="checkbox"
                                checked={useGrounding}
                                onChange={(e) => setUseGrounding(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ease-in-out ${useGrounding ? 'bg-yellow-400' : 'bg-gray-600'}`}>
                                <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform duration-300 ease-in-out ${useGrounding ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <Search className="ml-2 h-4 w-4" />
                            <span className="ml-1">Enable Search Grounding</span>
                        </label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
