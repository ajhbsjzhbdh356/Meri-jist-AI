import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserProfile, VibeWeaverStorySegment, VibeWeaverReport, VibeWeaverChoice } from '../types';
import { generateVibeWeaverScenario, analyzeVibeWeaverResults } from '../services/geminiService';
import { Button } from './Button';
import { SparklesIcon, ArrowPathIcon, PaperAirplaneIcon } from './IconComponents';

interface VibeWeaverGameProps {
    currentUser: UserProfile;
    allProfiles: UserProfile[];
    onUpdatePoints: (points: number) => void;
    onStartChat: (profile: UserProfile) => void;
}

type GameStep = 'match_select' | 'playing' | 'analyzing' | 'results';
type StoryTurn = { story: string; user1Choice: VibeWeaverChoice; user2Choice: VibeWeaverChoice; };

const TRAIT_KEYWORDS: Record<VibeWeaverChoice['trait'], string[]> = {
    Adventurous: ['adventure', 'travel', 'spontaneous', 'outdoors', 'hiking', 'new', 'explore', 'trip'],
    Cautious: ['plan', 'safe', 'think', 'careful', 'sure', 'relax', 'home', 'quiet'],
    Romantic: ['love', 'date', 'stars', 'sunset', 'feelings', 'cozy', 'heart', 'deep conversations', 'poetry', 'art'],
    Pragmatic: ['practical', 'logical', 'efficient', 'simple', 'makes sense', 'work', 'goal'],
    Humorous: ['laugh', 'joke', 'funny', 'silly', 'lighthearted', 'humor', 'witty'],
    Serious: ['deep', 'conversation', 'values', 'future', 'meaningful', 'family', 'learn'],
};

// Simulate the other user's choice based on their profile
const getSimulatedChoice = (profile: UserProfile, choices: [VibeWeaverChoice, VibeWeaverChoice]): VibeWeaverChoice => {
    const profileText = `${profile.bio.toLowerCase()} ${profile.interestTags?.join(' ').toLowerCase()}`;
    
    const getScore = (choice: VibeWeaverChoice) => {
        let score = 0;
        const keywords = TRAIT_KEYWORDS[choice.trait];
        for (const keyword of keywords) {
            if (profileText.includes(keyword)) {
                score++;
            }
        }
        return score;
    };

    const score1 = getScore(choices[0]);
    const score2 = getScore(choices[1]);

    if (score1 === score2) {
        // If no keywords match or scores are tied, pick randomly
        return Math.random() > 0.5 ? choices[0] : choices[1];
    }
    return score1 > score2 ? choices[0] : choices[1];
};


export const VibeWeaverGame: React.FC<VibeWeaverGameProps> = ({ currentUser, allProfiles, onUpdatePoints, onStartChat }) => {
    const [step, setStep] = useState<GameStep>('match_select');
    const [currentMatch, setCurrentMatch] = useState<UserProfile | null>(null);
    const [storyHistory, setStoryHistory] = useState<StoryTurn[]>([]);
    const [currentSegment, setCurrentSegment] = useState<VibeWeaverStorySegment | null>(null);
    const [finalReport, setFinalReport] = useState<VibeWeaverReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const otherUsers = useMemo(() => allProfiles.filter(p => p.id !== currentUser.id), [allProfiles, currentUser.id]);

    const selectRandomMatch = useCallback(() => {
        if (otherUsers.length > 0) {
            const randomIndex = Math.floor(Math.random() * otherUsers.length);
            setCurrentMatch(otherUsers[randomIndex]);
        }
    }, [otherUsers]);

    useEffect(() => {
        selectRandomMatch();
    }, [selectRandomMatch]);

    const handleStartGame = async () => {
        if (!currentMatch) return;
        setIsLoading(true);
        setError(null);
        setStep('playing');
        try {
            const segment = await generateVibeWeaverScenario(currentUser, currentMatch, []);
            setCurrentSegment(segment);
        } catch (err) {
            setError("Sorry, the AI couldn't start a story. Please try again.");
            setStep('match_select');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChoice = async (userChoice: VibeWeaverChoice) => {
        if (!currentMatch || !currentSegment) return;

        setIsLoading(true);
        
        const matchChoice = getSimulatedChoice(currentMatch, currentSegment.choices);
        const newTurn: StoryTurn = {
            story: currentSegment.storyText,
            user1Choice: userChoice,
            user2Choice: matchChoice
        };
        const newHistory = [...storyHistory, newTurn];
        setStoryHistory(newHistory);
        setCurrentSegment(null);

        const storyHistoryForAPI = newHistory.map(turn => ({
            user1Choice: turn.user1Choice.text,
            user2Choice: turn.user2Choice.text,
            story: turn.story,
        }));

        if (newHistory.length < 3) {
            // Continue playing
            try {
                const segment = await generateVibeWeaverScenario(currentUser, currentMatch, storyHistoryForAPI as any);
                setCurrentSegment(segment);
            } catch (err) {
                 setError("Sorry, the AI had trouble continuing the story. Ending game.");
                 setStep('match_select'); // Fail gracefully
            } finally {
                setIsLoading(false);
            }
        } else {
            // End of game, analyze results
            setStep('analyzing');
            try {
                const choicesForReport = newHistory.map(t => ({ user1Trait: t.user1Choice.trait, user2Trait: t.user2Choice.trait }));
                const report = await analyzeVibeWeaverResults(currentUser, currentMatch, choicesForReport);
                setFinalReport(report);
                onUpdatePoints(50); // Award points for completing
                setStep('results');
            } catch (err) {
                setError("Sorry, the AI couldn't analyze your results.");
                setStep('match_select'); // Fail gracefully
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handlePlayAgain = () => {
        setStoryHistory([]);
        setCurrentSegment(null);
        setFinalReport(null);
        setError(null);
        selectRandomMatch();
        setStep('match_select');
    };

    const renderMatchSelect = () => {
        if (!currentMatch) {
            return <div className="text-center p-8"><p className="text-slate-600">No available profiles to play with.</p></div>
        }
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <h3 className="text-2xl font-bold font-serif text-gray-800">Weave a Story With...</h3>
                <img src={currentMatch.profilePicture} alt={currentMatch.name} className="w-32 h-32 rounded-full object-cover my-4 shadow-lg border-4 border-white"/>
                <p className="text-xl font-semibold text-gray-800">{currentMatch.name}, {currentMatch.age}</p>
                <p className="text-slate-500 mb-6">{currentMatch.profession}</p>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={selectRandomMatch} leftIcon={<ArrowPathIcon className="w-5 h-5"/>}>Find Another Match</Button>
                    <Button onClick={handleStartGame}>Start Story</Button>
                </div>
            </div>
        );
    };

    const renderPlaying = () => {
        if (!currentMatch) return null;
        return (
            <div className="flex flex-col h-full p-6">
                <div className="text-center mb-4">
                    <p className="font-semibold text-slate-500">Round {storyHistory.length + 1} of 3 with {currentMatch.name}</p>
                </div>
                <div className="flex-grow overflow-y-auto p-4 bg-white rounded-lg border border-dashed border-brand-primary/30">
                    {storyHistory.map((turn, index) => (
                        <div key={index} className="mb-4 pb-2 border-b border-brand-primary/20">
                             <p className="text-slate-700 italic mb-2">"{turn.story}"</p>
                             <p className="text-xs text-slate-500"><span className="font-bold text-brand-primary">You chose:</span> {turn.user1Choice.text}</p>
                             <p className="text-xs text-slate-500"><span className="font-bold text-brand-secondary">{currentMatch.name} chose:</span> {turn.user2Choice.text}</p>
                        </div>
                    ))}
                    {isLoading && !currentSegment && <p className="text-slate-600 animate-pulse">AI is writing the next chapter...</p>}
                    {currentSegment && <p className="text-slate-800 font-semibold text-lg">{currentSegment.storyText}</p>}
                </div>
                 <div className="mt-4">
                    {currentSegment && !isLoading && (
                        <div className="space-y-3 animate-in fade-in">
                            <h4 className="font-bold text-gray-800 text-center">What do you do?</h4>
                             {currentSegment.choices.map((choice, index) => (
                                <Button key={index} onClick={() => handleChoice(choice)} className="w-full !justify-start !text-left !font-normal" variant="secondary">
                                    {choice.text}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAnalyzing = () => (
        <div className="flex flex-col items-center justify-center text-center h-full p-8">
            <SparklesIcon className="w-16 h-16 text-brand-primary animate-pulse" />
            <p className="mt-4 text-xl font-semibold text-gray-800">Weaving your Vibe Tapestry...</p>
        </div>
    );

    const renderResults = () => {
        if (!finalReport || !currentMatch) return null;
        return (
            <div className="flex flex-col h-full p-6 items-center text-center">
                 <h3 className="text-2xl font-bold font-serif text-gray-800">Your Vibe Tapestry</h3>
                 <p className="text-slate-500 mb-4">with {currentMatch.name}</p>

                 <div className="w-full flex-grow p-6 bg-white rounded-xl shadow-inner space-y-4">
                    <h4 className="text-3xl font-bold font-serif text-brand-primary">{finalReport.title}</h4>
                    <p className="text-slate-700">{finalReport.analysis}</p>
                     <div className="pt-4 border-t border-brand-primary/20">
                        <p className="font-semibold text-gray-800">Try this conversation starter:</p>
                        <p className="italic text-slate-800 mt-1">"{finalReport.conversationStarter}"</p>
                    </div>
                 </div>
                 <div className="mt-6 flex flex-wrap justify-center gap-4">
                     <Button variant="secondary" onClick={handlePlayAgain}>Play Again</Button>
                     <Button onClick={() => onStartChat(currentMatch)} leftIcon={<PaperAirplaneIcon/>}>Chat with {currentMatch.name.split(' ')[0]}</Button>
                 </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col bg-transparent rounded-xl">
             {error && <div className="p-2 bg-red-200 text-red-800 text-center text-sm">{error}</div>}
             {step === 'match_select' && renderMatchSelect()}
             {step === 'playing' && renderPlaying()}
             {step === 'analyzing' && renderAnalyzing()}
             {step === 'results' && renderResults()}
        </div>
    );
};
