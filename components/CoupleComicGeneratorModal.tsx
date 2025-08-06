import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, BookHeartIcon, PaperAirplaneIcon } from './IconComponents';
import { generateCoupleComic } from '../services/geminiService';
import { UserProfile, Conversation } from '../types';

interface CoupleComicGeneratorModalProps {
  onClose: () => void;
  currentUser: UserProfile;
  conversations: Conversation[];
  allProfiles: UserProfile[];
  onShare: (otherUserId: number, imageBase64: string) => void;
  preselectedProfile?: UserProfile;
}

const ImageSkeleton: React.FC = () => (
    <div className="w-full aspect-[9/16] bg-slate-200 rounded-lg animate-pulse flex flex-col items-center justify-center">
        <SparklesIcon className="w-16 h-16 text-rose-gold/50" />
        <p className="mt-4 text-lg font-semibold text-deep-teal/60">AI is drawing your comic strip...</p>
    </div>
);

export const CoupleComicGeneratorModal: React.FC<CoupleComicGeneratorModalProps> = ({ onClose, currentUser, conversations, allProfiles, onShare, preselectedProfile }) => {
    const [selectedMatchId, setSelectedMatchId] = useState<string>(preselectedProfile ? String(preselectedProfile.id) : '');
    const [scenario, setScenario] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const matchesWithConversations = useMemo(() => {
        return conversations
            .map(c => {
                const otherId = c.participantIds.find(id => id !== currentUser.id);
                const profile = allProfiles.find(p => p.id === otherId);
                return profile ? { profile } : null;
            })
            .filter((match): match is { profile: UserProfile } => !!match);
    }, [conversations, allProfiles, currentUser.id]);

    const handleGenerate = async () => {
        const otherProfile = allProfiles.find(p => p.id === parseInt(selectedMatchId));
        if (!scenario.trim() || !otherProfile) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const base64Bytes = await generateCoupleComic(currentUser, otherProfile, scenario);
            setGeneratedImage(base64Bytes);
        } catch (err: any) {
            setError(err.message || "An error occurred while generating your comic. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = () => {
        if (generatedImage && selectedMatchId) {
            onShare(parseInt(selectedMatchId), generatedImage);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
                        <BookHeartIcon />
                        Couple's Comic Generator
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                    <div className="space-y-4 flex flex-col">
                        {preselectedProfile ? (
                             <>
                                <p className="text-slate-600">Create a cute comic strip of you and <span className="font-bold">{preselectedProfile.name}</span>!</p>
                                <div>
                                    <label htmlFor="scenario" className="block text-sm font-semibold text-slate-700 mb-1">Describe a Scenario</label>
                                    <textarea
                                        id="scenario"
                                        value={scenario}
                                        onChange={(e) => setScenario(e.target.value)}
                                        placeholder="e.g., Our first coffee date where we both spill our drinks."
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                        rows={4}
                                    />
                                </div>
                                <div className="mt-auto pt-4 text-center">
                                    <Button onClick={handleGenerate} disabled={isLoading || !scenario.trim()} leftIcon={<SparklesIcon className="w-5 h-5"/>}>
                                        {isLoading ? 'Generating...' : 'Generate Comic'}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-slate-600">Create a cute comic strip of you and one of your matches!</p>
                                {matchesWithConversations.length > 0 ? (
                                    <>
                                        <div>
                                            <label htmlFor="match-select" className="block text-sm font-semibold text-slate-700 mb-1">1. Choose a Match</label>
                                            <select
                                                id="match-select"
                                                value={selectedMatchId}
                                                onChange={(e) => setSelectedMatchId(e.target.value)}
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition bg-white"
                                            >
                                                <option value="" disabled>Select a match...</option>
                                                {matchesWithConversations.map(match => (
                                                    <option key={match.profile.id} value={match.profile.id}>{match.profile.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="scenario" className="block text-sm font-semibold text-slate-700 mb-1">2. Describe a Scenario</label>
                                            <textarea
                                                id="scenario"
                                                value={scenario}
                                                onChange={(e) => setScenario(e.target.value)}
                                                placeholder="e.g., Our first coffee date where we both spill our drinks."
                                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                                rows={4}
                                            />
                                        </div>
                                        <div className="mt-auto pt-4 text-center">
                                            <Button onClick={handleGenerate} disabled={isLoading || !scenario.trim() || !selectedMatchId} leftIcon={<SparklesIcon className="w-5 h-5"/>}>
                                                {isLoading ? 'Generating...' : 'Generate Comic'}
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-grow flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                                        <BookHeartIcon className="w-12 h-12 text-slate-400 mb-3" />
                                        <h4 className="font-bold text-deep-teal">Start a Conversation!</h4>
                                        <p className="text-slate-600 text-sm">You need to have some conversations with your matches to generate a comic.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div>
                        {isLoading ? (
                            <ImageSkeleton />
                        ) : error ? (
                            <div className="w-full aspect-[9/16] bg-red-50 border border-red-200 text-red-700 rounded-lg flex flex-col items-center justify-center p-4">
                                <h4 className="font-bold">Generation Failed</h4>
                                <p className="text-sm text-center mt-2">{error}</p>
                            </div>
                        ) : generatedImage ? (
                            <img
                                src={`data:image/jpeg;base64,${generatedImage}`}
                                alt="AI Generated comic strip"
                                className="w-full aspect-[9/16] object-contain rounded-lg shadow-md bg-slate-100"
                            />
                        ) : (
                            <div className="w-full aspect-[9/16] bg-slate-50 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-4">
                                <p className="text-slate-500">Your generated comic will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    {generatedImage && (
                        <Button onClick={handleShare} leftIcon={<PaperAirplaneIcon />}>
                            Share in Chat
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};
