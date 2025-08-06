import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, HeartIcon, ExclamationTriangleIcon } from './IconComponents';
import { WhatIfScenario } from '../types';
import { continueWhatIfStory } from '../services/geminiService';

interface WhatIfModalProps {
  onClose: () => void;
  onRetry: () => void;
  isLoading: boolean;
  error: string | null;
  scenario: WhatIfScenario | null;
}

const LoadingState: React.FC = () => (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
        <div className="relative w-24 h-24">
            <HeartIcon className="w-24 h-24 text-rose-gold/20" />
            <SparklesIcon className="absolute top-0 right-0 w-8 h-8 text-rose-gold animate-pulse" />
            <SparklesIcon className="absolute bottom-2 left-2 w-6 h-6 text-rose-gold animate-pulse [animation-delay:-0.5s]" />
        </div>
        <p className="mt-4 text-xl font-semibold font-serif text-deep-teal">Imagining your story...</p>
        <p className="text-slate-500">Our AI is crafting a special moment for you.</p>
    </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
     <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
        <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mb-4" />
        <h3 className="text-xl font-bold text-deep-teal">Oops!</h3>
        <p className="text-slate-600 my-2 max-w-sm">{error}</p>
    </div>
);

const SuccessState: React.FC<{ scenario: WhatIfScenario }> = ({ scenario }) => {
    const [storyContent, setStoryContent] = useState(scenario.story);
    const [isContinuing, setIsContinuing] = useState(false);
    const storyContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // When a new scenario is passed (e.g. on retry), reset the story content
        setStoryContent(scenario.story);
    }, [scenario]);

    useEffect(() => {
        // Scroll to the bottom when new content is added
        if (storyContainerRef.current) {
            storyContainerRef.current.scrollTop = storyContainerRef.current.scrollHeight;
        }
    }, [storyContent]);

    const handleContinueStory = async () => {
        if (!scenario.vibe) return;
        setIsContinuing(true);
        try {
            const continuation = await continueWhatIfStory(storyContent, scenario.vibe);
            setStoryContent(prev => prev + continuation);
        } catch (error) {
            console.error("Failed to continue story", error);
            setStoryContent(prev => prev + "\n\n(The muse seems to have left... please try again later!)");
        } finally {
            setIsContinuing(false);
        }
    };

    return (
        <div className="p-8 flex flex-col h-full">
            <div className="flex-shrink-0 text-center">
                {scenario.vibe && (
                    <div className="inline-block bg-rose-gold/10 text-rose-gold text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                        {scenario.vibe.emoji} {scenario.vibe.name} Vibe
                    </div>
                )}
                <div className="text-6xl mb-4">{scenario.emoji}</div>
                <h3 className="text-3xl font-bold font-serif text-deep-teal mb-4">{scenario.title}</h3>
            </div>
            
            <div ref={storyContainerRef} className="overflow-y-auto flex-grow mb-4 pr-2 text-left">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{storyContent}</p>
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-slate-200 text-center">
                <Button onClick={handleContinueStory} disabled={isContinuing} leftIcon={<SparklesIcon className={isContinuing ? "animate-pulse" : ""} />}>
                    {isContinuing ? "Thinking..." : "What happens next?"}
                </Button>
            </div>
        </div>
    );
};

export const WhatIfModal: React.FC<WhatIfModalProps> = ({ onClose, onRetry, isLoading, error, scenario }) => {
  let content;
  if (isLoading) {
    content = <LoadingState />;
  } else if (error) {
    content = <ErrorState error={error} />;
  } else if (scenario) {
    content = <SuccessState scenario={scenario} />;
  } else {
    // This case should ideally not be hit if modal is opened correctly, but good to have a fallback.
    content = <LoadingState />;
  }


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-cream rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-500">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 z-10">
            <CloseIcon />
        </button>
        <div className="flex-grow overflow-hidden">
          {content}
        </div>
        <div className="p-6 mt-auto border-t border-slate-200 flex justify-between items-center flex-shrink-0">
            <Button variant="secondary" onClick={onRetry} disabled={isLoading}>
                {error ? 'Try Again' : 'Generate New Story'}
            </Button>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};
