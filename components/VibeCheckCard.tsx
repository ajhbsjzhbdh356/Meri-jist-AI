
import React, { useState } from 'react';
import { VibeCheck, UserProfile } from '../types';
import { Button } from './Button';
import { CircularProgress, PaperAirplaneIcon, SparklesIcon } from './IconComponents';

interface VibeCheckCardProps {
    vibeCheck: VibeCheck;
    currentUser: UserProfile;
    otherParticipant: UserProfile;
    onSubmitAnswer: (answer: string) => void;
    onSendIcebreaker: (text: string) => void;
    isAnalyzing: boolean;
}

export const VibeCheckCard: React.FC<VibeCheckCardProps> = ({ vibeCheck, currentUser, otherParticipant, onSubmitAnswer, onSendIcebreaker, isAnalyzing }) => {
    const [answer, setAnswer] = useState('');
    const currentUserAnswer = vibeCheck.responses[currentUser.id];
    const otherParticipantAnswer = vibeCheck.responses[otherParticipant.id];

    const hasAnswered = !!currentUserAnswer;

    if (vibeCheck.state === 'completed' && vibeCheck.report) {
        // Render results view
        return (
            <div className="text-center my-4">
                <div className="inline-block p-6 bg-cream border-2 border-rose-gold rounded-2xl text-deep-teal max-w-lg mx-auto shadow-xl text-left space-y-5">
                    <div className="text-center border-b border-dusty-rose/50 pb-5">
                        <h3 className="text-2xl font-bold font-serif text-deep-teal">Vibe Check Complete!</h3>
                        <p className="text-slate-600 text-sm">Here's how your answers aligned.</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <CircularProgress className="w-28 h-28" progress={vibeCheck.report.harmonyScore} viewBoxSize={120} strokeWidth={10}>
                            <div>
                                <span className="text-3xl font-bold text-deep-teal">{vibeCheck.report.harmonyScore}</span>
                                <span className="text-lg font-semibold text-deep-teal/80">%</span>
                            </div>
                        </CircularProgress>
                        <p className="mt-2 text-lg font-bold text-deep-teal">Vibe Harmony</p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-deep-teal mb-2">AI Analysis:</h4>
                        <p className="text-slate-700 italic">"{vibeCheck.report.analysis}"</p>
                    </div>

                    <div className="pt-5 border-t border-dusty-rose/50">
                        <h4 className="font-semibold text-deep-teal mb-2">Suggested Topic:</h4>
                        <p className="text-slate-800 p-3 bg-white/70 rounded-lg">"{vibeCheck.report.nextIcebreaker}"</p>
                        <Button
                            onClick={() => onSendIcebreaker(vibeCheck.report!.nextIcebreaker)}
                            leftIcon={<PaperAirplaneIcon className="w-5 h-5"/>}
                            className="w-full mt-3"
                        >
                            Discuss this
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Render asking view
    return (
        <div className="text-center my-4">
            <div className="inline-block p-6 bg-deep-teal text-white rounded-2xl max-w-lg mx-auto shadow-xl text-left space-y-4">
                <div className="text-center">
                    <h3 className="text-2xl font-bold font-serif">Vibe Check!</h3>
                    <p className="text-white/80 text-sm">An AI-generated question to explore your connection.</p>
                </div>

                <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-center text-lg font-semibold">"{vibeCheck.question}"</p>
                </div>
                
                {isAnalyzing ? (
                    <div className="text-center py-4">
                        <SparklesIcon className="w-8 h-8 mx-auto animate-pulse text-rose-gold" />
                        <p className="mt-2 font-semibold">Analyzing your vibes...</p>
                    </div>
                ) : hasAnswered ? (
                    <div className="text-center py-4">
                        <p className="font-semibold">Your answer is submitted! ✅</p>
                        <p className="text-white/80 text-sm">{otherParticipantAnswer ? 'Here are the results!' : `Waiting for ${otherParticipant.name} to answer...`}</p>
                    </div>
                ) : (
                    <form onSubmit={(e) => { e.preventDefault(); onSubmitAnswer(answer); }} className="space-y-3">
                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Your answer here (it's private!)"
                            className="w-full p-3 border border-slate-400 bg-slate-100 text-deep-teal rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                            rows={3}
                        />
                        <Button type="submit" disabled={!answer.trim()} className="w-full !bg-rose-gold !text-white">
                            Submit My Answer
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};
