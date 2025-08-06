
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, HeartCircleIcon, ChatBubbleLeftRightIcon, LightBulbIcon } from './IconComponents';
import { DatingPatternReport, UserProfile, Conversation } from '../types';
import { analyzeDatingPatterns } from '../services/geminiService';

interface DatingPatternAnalyzerModalProps {
  currentUser: UserProfile;
  likedProfiles: UserProfile[];
  conversations: Conversation[];
  onClose: () => void;
}

const ResultCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
        <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 text-rose-gold">{icon}</div>
            <h4 className="font-semibold text-deep-teal">{title}</h4>
        </div>
        <div className="pl-9 text-slate-700">
            <p>{children}</p>
        </div>
    </div>
);

export const DatingPatternAnalyzerModal: React.FC<DatingPatternAnalyzerModalProps> = ({ currentUser, likedProfiles, conversations, onClose }) => {
    const [report, setReport] = useState<DatingPatternReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            // A minimum amount of data is needed for a useful analysis.
            if (likedProfiles.length < 3 && conversations.length < 1) {
                setError("There isn't enough activity on your profile yet for a meaningful analysis. Keep liking and chatting!");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const result = await analyzeDatingPatterns(currentUser, likedProfiles, conversations);
                setReport(result);
            } catch (err) {
                console.error("Failed to analyze dating patterns", err);
                setError("Sorry, the AI couldn't complete the analysis right now. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalysis();
    }, [currentUser, likedProfiles, conversations]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
                    <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                    <p className="mt-4 text-xl font-semibold text-deep-teal">Analyzing your dating journey...</p>
                    <p className="text-slate-500">Our AI is uncovering your unique patterns.</p>
                </div>
            );
        }

        if (error) {
             return (
                <div className="text-center p-8 bg-yellow-50 text-yellow-800 rounded-lg min-h-[400px] flex flex-col justify-center items-center">
                    <h3 className="font-bold text-lg">Not Enough Data Yet</h3>
                    <p>{error}</p>
                </div>
            );
        }

        if (report) {
            return (
                <div className="space-y-5">
                    <p className="text-slate-600 text-center">Here are some insights our AI coach found based on your recent activity.</p>
                    <ResultCard icon={<HeartCircleIcon className="w-6 h-6" />} title="Your Attraction Blueprint">
                        {report.attractionBlueprint}
                    </ResultCard>
                    <ResultCard icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />} title="Your Conversation Flow">
                        {report.conversationFlow}
                    </ResultCard>
                    <ResultCard icon={<LightBulbIcon className="w-6 h-6" />} title="The Unseen Pattern">
                        {report.unseenPattern}
                    </ResultCard>
                    <ResultCard icon={<SparklesIcon className="w-6 h-6" />} title="Coach's Recommendation">
                        {report.coachRecommendation}
                    </ResultCard>
                </div>
            );
        }
        
        return null;
    };


    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">AI Dating Pattern Analysis</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {renderContent()}
                </div>

                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
                    <Button variant="primary" onClick={onClose}>Got it</Button>
                </div>
            </div>
        </div>
    );
};
