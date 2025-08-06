import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from './Button';
import { HeartIcon, SparklesIcon, GemIcon, GiftIcon, BookOpenIcon, CameraIcon, CompassIcon, PaintBrushIcon } from './IconComponents';

interface MemoryMatchGameProps {
  onGameEnd: (score: number) => void;
}

const ICONS = [
    HeartIcon, SparklesIcon, GemIcon, GiftIcon,
    BookOpenIcon, CameraIcon, CompassIcon, PaintBrushIcon
];

interface Card {
    id: number;
    icon: React.ComponentType<{ className?: string }>;
    isFlipped: boolean;
    isMatched: boolean;
}

const generateCards = (): Card[] => {
    const icons = [...ICONS, ...ICONS];
    const shuffledIcons = icons.sort(() => Math.random() - 0.5);
    return shuffledIcons.map((Icon, index) => ({
        id: index,
        icon: Icon,
        isFlipped: false,
        isMatched: false,
    }));
};

const CardComponent: React.FC<{ card: Card; onClick: () => void }> = ({ card, onClick }) => {
    const CardIcon = card.icon;
    return (
        <div className="w-full h-full perspective-1000" onClick={onClick}>
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}>
                {/* Card Back */}
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center bg-brand-primary rounded-lg shadow-md cursor-pointer">
                    <SparklesIcon className="w-1/2 h-1/2 text-white/50"/>
                </div>
                {/* Card Front */}
                <div className={`absolute w-full h-full backface-hidden flex items-center justify-center rounded-lg shadow-lg rotate-y-180 ${card.isMatched ? 'bg-brand-secondary/20' : 'bg-white'}`}>
                    <CardIcon className={`w-2/3 h-2/3 ${card.isMatched ? 'text-brand-secondary' : 'text-brand-secondary'}`}/>
                </div>
            </div>
        </div>
    );
};

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onGameEnd }) => {
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver'>('ready');
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval: number | null = null;
        if (gameState === 'playing') {
            interval = window.setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState]);

    const startGame = () => {
        setCards(generateCards());
        setFlippedIndices([]);
        setMoves(0);
        setTimer(0);
        setGameState('playing');
    };

    const handleCardClick = (index: number) => {
        if (flippedIndices.length === 2 || cards[index].isFlipped || cards[index].isMatched) {
            return;
        }

        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);
        setFlippedIndices([...flippedIndices, index]);
    };

    const checkMatch = useCallback(() => {
        if (flippedIndices.length !== 2) return;

        setMoves(prev => prev + 1);
        const [firstIndex, secondIndex] = flippedIndices;
        const firstCard = cards[firstIndex];
        const secondCard = cards[secondIndex];

        if (firstCard.icon === secondCard.icon) {
            // Match
            const newCards = cards.map(card =>
                card.id === firstCard.id || card.id === secondCard.id ? { ...card, isMatched: true } : card
            );
            setCards(newCards);
            setFlippedIndices([]);
        } else {
            // No match
            setTimeout(() => {
                const newCards = cards.map(card =>
                    card.id === firstCard.id || card.id === secondCard.id ? { ...card, isFlipped: false } : card
                );
                setCards(newCards);
                setFlippedIndices([]);
            }, 1000);
        }
    }, [flippedIndices, cards]);

    useEffect(() => {
        checkMatch();
    }, [checkMatch]);

    useEffect(() => {
        if (cards.length > 0 && cards.every(card => card.isMatched)) {
            setGameState('gameOver');
            const timeBonus = Math.max(0, 60 - timer);
            const moveBonus = Math.max(0, 20 - moves) * 5;
            onGameEnd(100 + timeBonus + moveBonus);
        }
    }, [cards, timer, moves, onGameEnd]);
    
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-transparent rounded-xl p-2 md:p-4">
            <style>
                {`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; }
                `}
            </style>
             <div className="flex justify-between items-center w-full max-w-lg mb-2 text-gray-700 font-bold px-2">
                <span>Moves: {moves}</span>
                <span>Time: {formatTime(timer)}</span>
            </div>
            <div className="relative w-full max-w-lg aspect-square">
                {gameState !== 'playing' ? (
                     <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center text-gray-800 text-center p-4 z-10">
                        {gameState === 'ready' && (
                             <>
                                <h3 className="text-3xl font-bold font-serif mb-4">Memory Match</h3>
                                <p className="mb-6 max-w-xs">Find all the matching pairs as quickly as you can!</p>
                                <Button onClick={startGame}>Start Game</Button>
                            </>
                        )}
                         {gameState === 'gameOver' && (
                            <>
                                <h3 className="text-3xl font-bold font-serif mb-4">You Win!</h3>
                                <p className="text-xl mb-6">Moves: {moves}, Time: {formatTime(timer)}</p>
                                <Button onClick={startGame}>Play Again</Button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-4 grid-rows-4 gap-2 md:gap-4 w-full h-full">
                        {cards.map((card, index) => (
                            <CardComponent key={card.id} card={card} onClick={() => handleCardClick(index)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};