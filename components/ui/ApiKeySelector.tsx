import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './Card';
import { ExternalLink } from 'lucide-react';

// FIX: To resolve a global type declaration conflict, declare `AIStudio`
// as a global interface. This prevents module-scoping issues when augmenting
// the global `Window` object from different files.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

interface ApiKeySelectorProps {
  onKeySelected: () => void;
  featureName: string;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected, featureName }) => {
  const [hasKey, setHasKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkApiKey = useCallback(async () => {
    setIsLoading(true);
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const keyStatus = await window.aistudio.hasSelectedApiKey();
      setHasKey(keyStatus);
      if (keyStatus) {
        onKeySelected();
      }
    } else {
        // Fallback for environments where aistudio is not available
        console.warn("aistudio not available. Assuming key is present.");
        setHasKey(true);
        onKeySelected();
    }
    setIsLoading(false);
  }, [onKeySelected]);

  useEffect(() => {
    checkApiKey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // To mitigate race condition, assume key selection is successful and proceed.
      // The API call failure will handle cases where it wasn't.
      setHasKey(true);
      onKeySelected();
    } else {
        alert("API Key selection is not available in this environment.");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p>Verifying API Key status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!hasKey) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>API Key Required</CardTitle>
          <CardDescription>
            To use the {featureName} feature, you must select an API key. This is a mandatory step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-300">
            Video generation is a computationally intensive task. Please be aware of the associated costs.
          </p>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-yellow-400 hover:text-yellow-300"
          >
            Learn more about billing
            <ExternalLink className="ml-1.5 h-4 w-4" />
          </a>
          <Button onClick={handleSelectKey} className="w-full">
            Select API Key
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null; // Don't render anything if the key is selected, the parent will render its content.
};
