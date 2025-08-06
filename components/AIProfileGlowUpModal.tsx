import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, CheckCircleIcon } from './IconComponents';
import { UserProfile, ProfileGlowUpSuggestion } from '../types';
import { generateProfileGlowUpSuggestions } from '../services/geminiService';

interface AIProfileGlowUpModalProps {
  profile: UserProfile;
  onClose: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  onUpdatePrompt: (question: string, newAnswer: string) => void;
}

const SuggestionCard: React.FC<{
    suggestion: ProfileGlowUpSuggestion;
    onApply: () => void;
}> = ({ suggestion, onApply }) => {
    const [isApplied, setIsApplied] = useState(false);

    const handleApply = () => {
        onApply();
        setIsApplied(true);
    };

    return (
        <div className={`p-4 rounded-lg border transition-all duration-300 ${isApplied ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
            <h4 className="font-bold text-deep-teal mb-2">{suggestion.type === 'PROMPT' ? `Prompt: "${suggestion.promptQuestion}"` : `Your ${suggestion.type}`}</h4>
            <p className="text-sm text-slate-500 mb-3 italic">{suggestion.reason}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <p className="text-xs font-semibold text-slate-400 mb-1">BEFORE</p>
                    <p className="text-sm text-slate-600 p-2 bg-slate-100 rounded h-full">{suggestion.originalText}</p>
                </div>
                 <div>
                    <p className="text-xs font-semibold text-green-600 mb-1">AFTER</p>
                    <p className="text-sm text-green-800 p-2 bg-green-100 rounded h-full">{suggestion.suggestedText}</p>
                </div>
            </div>
            <div className="mt-3 text-right">
                {isApplied ? (
                    <div className="flex items-center justify-end gap-2 text-green-600 font-semibold">
                        <CheckCircleIcon className="w-5 h-5"/>
                        Applied!
                    </div>
                ) : (
                     <Button onClick={handleApply} className="!py-1.5 !px-3 !text-sm">Apply Suggestion</Button>
                )}
            </div>
        </div>
    );
};

export const AIProfileGlowUpModal: React.FC<AIProfileGlowUpModalProps> = ({ profile, onClose, onUpdateProfile, onUpdatePrompt }) => {
  const [suggestions, setSuggestions] = useState<ProfileGlowUpSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await generateProfileGlowUpSuggestions(profile);
        setSuggestions(result);
      } catch (e) {
        setError("Sorry, the AI couldn't generate suggestions right now. Please try again later.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, [profile]);

  const handleApply = (suggestion: ProfileGlowUpSuggestion) => {
    switch(suggestion.type) {
        case 'BIO':
            onUpdateProfile({ bio: suggestion.suggestedText });
            break;
        case 'STORY':
             onUpdateProfile({ story: suggestion.suggestedText });
            break;
        case 'PROMPT':
            if (suggestion.promptQuestion) {
                onUpdatePrompt(suggestion.promptQuestion, suggestion.suggestedText);
            }
            break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-rose-gold" />
            AI Profile Glow-Up
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50/50 flex-grow">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
                <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-deep-teal">Finding ways to make your profile shine...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                <h3 className="font-bold text-lg">Analysis Failed</h3>
                <p>{error}</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-4">
                {suggestions.map((s, i) => <SuggestionCard key={i} suggestion={s} onApply={() => handleApply(s)} />)}
            </div>
          ) : (
             <div className="text-center p-8 bg-green-50 text-green-800 rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                <CheckCircleIcon className="w-12 h-12 text-green-600 mb-4"/>
                <h3 className="font-bold text-lg">Your Profile Looks Great!</h3>
                <p>Our AI coach reviewed your profile and couldn't find any immediate suggestions for improvement. Keep up the great work!</p>
            </div>
          )}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
          <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};
