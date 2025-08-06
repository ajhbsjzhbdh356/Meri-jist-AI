
import React, { useState, useEffect } from 'react';
import { Conversation, ChatAnalysis } from '../types';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, BrainCircuitIcon, ChatBubbleLeftRightIcon, LightBulbIcon, UsersIcon } from './IconComponents';
import { analyzeConversation } from '../services/geminiService';

interface ChatAnalysisModalProps {
  conversation: Conversation;
  onClose: () => void;
}

const AnalysisSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; }> = ({ title, children, icon }) => (
    <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
        <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0">{icon}</div>
            <h4 className="text-xl font-bold font-serif text-deep-teal">{title}</h4>
        </div>
        <div className="pl-9 text-slate-700">{children}</div>
    </div>
);


export const ChatAnalysisModal: React.FC<ChatAnalysisModalProps> = ({ conversation, onClose }) => {
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await analyzeConversation(conversation.messages);
        if (result) {
            setAnalysis(result);
        } else {
             setAnalysis({
                vibe: "Just Started",
                vibeEmoji: "👋",
                keyTopics: [],
                coachSuggestion: "It's still early days! Try asking an open-ended question to get the conversation rolling.",
                communicationStyles: {
                    user1Style: "N/A",
                    user2Style: "N/A",
                    analysis: "Not enough messages to analyze communication styles yet."
                }
            });
        }
      } catch (e) {
          setError("An unexpected error occurred while analyzing the conversation.");
          console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [conversation]);


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
            <BrainCircuitIcon className="w-6 h-6 text-rose-gold" />
            Conversation Deep Dive
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[300px]">
                <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-deep-teal">AI is analyzing your chat...</p>
                <p className="text-slate-500">This will just take a moment.</p>
            </div>
          ) : error ? (
             <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                <h3 className="font-bold text-lg">Analysis Failed</h3>
                <p>{error}</p>
             </div>
          ) : analysis ? (
            <div className="space-y-5">
                <AnalysisSection 
                    title="Conversation Vibe" 
                    icon={<span className="text-2xl">{analysis.vibeEmoji}</span>}
                >
                    <p className="font-semibold text-lg">{analysis.vibe}</p>
                </AnalysisSection>

                <AnalysisSection 
                    title="Communication Styles"
                    icon={<UsersIcon className="w-6 h-6 text-deep-teal/70" />}
                >
                    <div className="space-y-2">
                        <p><span className="font-semibold">You:</span> {analysis.communicationStyles.user1Style}</p>
                        <p><span className="font-semibold">Them:</span> {analysis.communicationStyles.user2Style}</p>
                        <p className="pt-2 border-t border-dusty-rose mt-2 italic">{analysis.communicationStyles.analysis}</p>
                    </div>
                </AnalysisSection>

                <AnalysisSection 
                    title="What You've Talked About"
                    icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-deep-teal/70"/>}
                >
                    {analysis.keyTopics.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                            {analysis.keyTopics.map((topic, i) => <li key={i}>{topic}</li>)}
                        </ul>
                    ) : (
                        <p>No specific topics have emerged yet. Keep the conversation going!</p>
                    )}
                </AnalysisSection>

                <AnalysisSection
                    title="Coach's Suggestion"
                    icon={<LightBulbIcon className="w-6 h-6 text-deep-teal/70"/>}
                >
                    <p className="font-semibold">{analysis.coachSuggestion}</p>
                </AnalysisSection>
            </div>
          ) : null}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
          <Button variant="primary" onClick={onClose}>Got it!</Button>
        </div>
      </div>
    </div>
  );
};
