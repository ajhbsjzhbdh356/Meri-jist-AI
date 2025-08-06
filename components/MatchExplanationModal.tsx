
import React, { useState, useEffect } from 'react';
import { UserProfile, MatchExplanation } from '../types';
import { Button } from './Button';
import { SparklesIcon, CloseIcon } from './IconComponents';
import { explainMatch } from '../services/geminiService';

interface MatchExplanationModalProps {
  currentUser: UserProfile;
  otherProfile: UserProfile;
  onClose: () => void;
}

export const MatchExplanationModal: React.FC<MatchExplanationModalProps> = ({ currentUser, otherProfile, onClose }) => {
  const [explanation, setExplanation] = useState<MatchExplanation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExplanation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await explainMatch(currentUser, otherProfile);
        setExplanation(result);
      } catch (e) {
          setError("An unexpected error occurred while analyzing this match.");
          console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExplanation();
  }, [currentUser, otherProfile]);


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-rose-gold" />
            Why We Picked {otherProfile.name}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[250px]">
                <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-deep-teal">AI is analyzing your connection...</p>
                <p className="text-slate-500">This will just take a moment.</p>
            </div>
          ) : error ? (
             <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                <h3 className="font-bold text-lg">Analysis Failed</h3>
                <p>{error}</p>
             </div>
          ) : explanation ? (
            <div className="space-y-4">
                <div className="text-center p-6 bg-cream rounded-xl border border-dashed border-rose-gold">
                    <h3 className="text-2xl font-bold font-serif text-rose-gold">"{explanation.headline}"</h3>
                </div>
                <div>
                    <h4 className="font-bold text-lg text-deep-teal mb-2">Our Detailed Analysis:</h4>
                    <p className="text-slate-700 leading-relaxed">{explanation.detailedReasoning}</p>
                </div>
            </div>
          ) : null}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
          <Button variant="primary" onClick={onClose}>Sounds interesting!</Button>
        </div>
      </div>
    </div>
  );
};
