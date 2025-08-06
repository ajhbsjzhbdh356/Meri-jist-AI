import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { RPSChoice, RPSResult } from '../types';
import { playRPS } from '../services/geminiService';
import { HandRockIcon, HandPaperIcon, HandScissorsIcon, SparklesIcon } from './IconComponents';

interface RockPaperScissorsGameProps {
    onRoundEnd: (points: number) => void;
}

const ChoiceButton: React.FC<{
    choice: RPSChoice;
    onClick: () => void;
    disabled?: boolean;
}> = ({ choice, onClick, disabled }) => {
    const icons: Record<RPSChoice, React.ReactNode> = {
        rock: <HandRockIcon className="w-12 h-12" />,
        paper: <HandPaperIcon className="w-12 h-12" />,
        scissors: <HandScissorsIcon className="w-12 h-12" />,
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="p-6 bg-white/50 rounded-2xl shadow-lg border-2 border-transparent hover:border-brand-primary hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label={`Choose ${choice}`}
        >
            {icons[choice]}
        </button>
    );
};

const ChoiceDisplay: React.FC<{
    choice?: RPSChoice | null;
    label: string;
    isWinner?: boolean;
    isLoading?: boolean;
}> = ({ choice, label, isWinner, isLoading }) => {
    const icons: Record<RPSChoice, React.ReactNode> = {
        rock: <HandRockIcon className="w-24 h-24" />,
        paper: <HandPaperIcon className="w-24 h-24" />,
        scissors: <HandScissorsIcon className="w-24 h-24" />,
    };

    const borderColor = isWinner ? 'border-brand-secondary' : 'border-gray-300';

    return (
        <div className="flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold font-serif text-gray-800">{label}</h3>
            <div className={`w-48 h-48 rounded-full flex items-center justify-center bg-white shadow-inner border-4 ${borderColor}`}>
                {isLoading ? (
                    <SparklesIcon className="w-16 h-16 text-brand-primary animate-pulse" />
                ) : choice ? (
                    icons[choice]
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200" />
                )}
            </div>
        </div>
    );
};


export const RockPaperScissorsGame: React.FC<RockPaperScissorsGameProps> = ({ onRoundEnd }) => {
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'result'>('ready');
    const [userChoice, setUserChoice] = useState<RPSChoice | null>(null);
    const [aiChoice, setAiChoice] = useState<RPSChoice | null>(null);
    const [result, setResult] = useState<RPSResult | null>(null);
    const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });
    const [isLoading, setIsLoading] = useState(false);

    const handlePlay = async (choice: RPSChoice) => {
        setGameState('playing');
        setUserChoice(choice);
        setIsLoading(true);
        setAiChoice(null);
        setResult(null);

        try {
            const { aiChoice: newAiChoice, result: newResult } = await playRPS(choice);
            setAiChoice(newAiChoice);
            setResult(newResult);

            if (newResult === 'win') {
                setScore(s => ({ ...s, wins: s.wins + 1 }));
                onRoundEnd(20); // Award 20 points for a win
            } else if (newResult === 'lose') {
                setScore(s => ({ ...s, losses: s.losses + 1 }));
            } else {
                setScore(s => ({ ...s, draws: s.draws + 1 }));
                onRoundEnd(5); // Award 5 points for a draw
            }
        } catch (error) {
            console.error("RPS game error:", error);
            alert("The AI opponent is thinking too hard! Please try again in a moment.");
            setGameState('ready');
        } finally {
            setIsLoading(false);
            if (gameState !== 'ready') {
                setGameState('result');
            }
        }
    };

    const handlePlayAgain = () => {
        setGameState('ready');
        setUserChoice(null);
        setAiChoice(null);
        setResult(null);
    };

    const resultText = useMemo(() => {
        if (!result) return 'Make your move!';
        switch (result) {
            case 'win': return 'You Win!';
            case 'lose': return 'You Lose!';
            case 'draw': return "It's a Draw!";
        }
    }, [result]);
    
     const resultColor = useMemo(() => {
        if (!result) return 'text-gray-800';
        switch (result) {
            case 'win': return 'text-brand-secondary';
            case 'lose': return 'text-brand-primary';
            case 'draw': return 'text-gray-500';
        }
    }, [result]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-between bg-gray-100 rounded-xl p-4 md:p-6">
            <div className="w-full flex justify-around font-semibold text-gray-800 text-lg">
                <span>Wins: {score.wins}</span>
                <span>Losses: {score.losses}</span>
                <span>Draws: {score.draws}</span>
            </div>

            <div className="flex-grow flex items-center justify-around w-full px-4">
                <ChoiceDisplay label="You" choice={userChoice} isWinner={result === 'win'} />
                <ChoiceDisplay label="AI" choice={aiChoice} isWinner={result === 'lose'} isLoading={isLoading} />
            </div>
            
            <div className="w-full text-center min-h-[160px] flex flex-col justify-center items-center">
                {gameState === 'ready' && (
                    <>
                        <h2 className="text-2xl font-bold font-serif text-gray-800 mb-4">Choose your weapon!</h2>
                        <div className="flex justify-center gap-4">
                            <ChoiceButton choice="rock" onClick={() => handlePlay('rock')} />
                            <ChoiceButton choice="paper" onClick={() => handlePlay('paper')} />
                            <ChoiceButton choice="scissors" onClick={() => handlePlay('scissors')} />
                        </div>
                    </>
                )}
                 {(gameState === 'playing' || gameState === 'result') && (
                    <div className="animate-in fade-in duration-500">
                        <h2 className={`text-4xl font-bold font-serif ${resultColor} mb-4`}>{isLoading ? "..." : resultText}</h2>
                        {!isLoading && <Button onClick={handlePlayAgain}>Play Again</Button>}
                    </div>
                )}
            </div>
        </div>
    );
};
