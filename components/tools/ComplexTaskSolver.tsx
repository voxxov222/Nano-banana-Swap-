import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { solveComplexTask } from '../../services/geminiService';

export const ComplexTaskSolver: React.FC = () => {
    const [prompt, setPrompt] = useState('Create a detailed tokenomics model for a new decentralized AI project on BSC. Include sections on token distribution, utility, staking rewards, and a governance framework. The total supply is 1 billion tokens.');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await solveComplexTask(prompt);
            setResult(response);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Complex Task Solver</CardTitle>
                <CardDescription>Utilize Gemini 2.5 Pro with maximum Thinking Budget for your most complex queries.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter a complex prompt here..."
                            rows={8}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading || !prompt} className="w-full">
                        {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                        {isLoading ? 'Thinking...' : 'Solve with Gemini Pro'}
                    </Button>
                </form>

                {(isLoading || error || result) && (
                    <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-2 min-h-[200px]">
                        <h3 className="font-semibold text-yellow-300">Result</h3>
                        {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {result && <div className="text-gray-300 whitespace-pre-wrap text-sm">{result}</div>}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
