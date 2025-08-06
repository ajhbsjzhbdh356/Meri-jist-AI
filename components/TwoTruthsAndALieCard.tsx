
import React, { useMemo } from 'react';
import { TwoTruthsGame, UserProfile } from '../types';
import { Button } from './Button';

interface TwoTruthsAndALieCardProps {
    game: TwoTruthsGame;
    currentUser: UserProfile;
    otherParticipant: UserProfile;
    onGuess: (guessIndex: number) => void;
    onEndGame: () => void;
}

export const TwoTruthsAndALieCard: React.FC<TwoTruthsAndALieCardProps> = ({ game, currentUser, otherParticipant, onGuess, onEndGame }) => {
    const isInitiator = currentUser.id === game.initiatorId;
    const isGuesser = currentUser.id === game.guesserId;

    // Memoize shuffled statements to prevent re-shuffling on every render
    const shuffledStatements = useMemo(() => {
        // Only shuffle for the guesser when the game is in the guessing state
        if (isGuesser && game.state === 'guessing') {
            // Create a copy of the statements array and pair with original index
            const statementsWithIndices = game.statements.map((stmt, index) => ({ stmt, index }));
            // Shuffle the copied array
            statementsWithIndices.sort(() => Math.random() - 0.5);
            // We only need the statement text for display, the original index is handled in `handleGuess`
            return statementsWithIndices.map(item => item.stmt);
        }
        // For the initiator or in completed state, show in original order
        return game.statements;
    }, [game.id]); // Re-shuffle only when a new game starts

    const handleGuess = (statement: string) => {
        // Find the original index of the statement to send back
        const originalIndex = game.statements.indexOf(statement);
        onGuess(originalIndex);
    };

    const getStatementStyle = (statement: string) => {
        if (game.state !== 'completed' || game.guess === null) {
            return 'border-slate-400';
        }
        
        const originalIndex = game.statements.indexOf(statement);
        const isLie = originalIndex === game.lieIndex;
        const wasCorrectGuess = game.guess === game.lieIndex;

        if (isLie) {
            return 'border-rose-gold bg-rose-gold/10 text-white font-bold'; // The Lie
        }
        
        if (originalIndex === game.guess && !wasCorrectGuess) {
            return 'border-amber-500 bg-amber-500/10 text-white opacity-70'; // Incorrect Guess
        }
        
        return 'border-green-500 bg-green-500/10 text-white opacity-70'; // A Truth
    };
    
    const renderGuessingView = () => (
        <>
            <p className="text-center font-semibold text-white/90">
                {isGuesser ? `Your turn! Which one is the lie?` : `Waiting for ${otherParticipant.name} to guess...`}
            </p>
            <div className="space-y-3 mt-4">
                {shuffledStatements.map((statement, index) => (
                    <button
                        key={index}
                        onClick={() => handleGuess(statement)}
                        disabled={!isGuesser}
                        className={`w-full text-left p-3 rounded-lg transition-colors bg-white/10 border-2 ${isGuesser ? 'cursor-pointer hover:bg-white/20' : 'cursor-default'} border-slate-400`}
                    >
                        {statement}
                    </button>
                ))}
            </div>
        </>
    );
    
    const renderCompletedView = () => {
        const wasCorrect = game.guess === game.lieIndex;
        return (
            <>
                <div className="text-center">
                    <p className="font-semibold text-white/90">
                        {isGuesser ? (wasCorrect ? "You got it!" : "Not quite!") : (wasCorrect ? `${otherParticipant.name} is a great detective!` : `You fooled ${otherParticipant.name}!`)}
                    </p>
                    <p className="mt-1 text-sm text-white/80">The lie was:</p>
                    <p className="mt-2 text-xl font-bold text-rose-gold">"{game.statements[game.lieIndex]}"</p>
                </div>
                <div className="space-y-3 mt-4">
                    {game.statements.map((statement) => (
                         <div key={statement} className={`p-3 rounded-lg border-2 text-white ${getStatementStyle(statement)}`}>
                            {statement}
                        </div>
                    ))}
                </div>
                {game.aiCommentary && (
                    <div className="mt-4 p-3 bg-white/20 rounded-lg text-center italic">
                        <p>🤖 {game.aiCommentary}</p>
                    </div>
                )}
                 <div className="mt-4 text-center">
                    <Button onClick={onEndGame} variant="secondary" className="!bg-white/90 hover:!bg-white">Close Game</Button>
                </div>
            </>
        );
    };

    return (
        <div className="text-center my-4">
            <div className="inline-block p-6 bg-deep-teal text-white rounded-2xl max-w-lg mx-auto shadow-xl text-left space-y-4">
                 <div className="text-center">
                    <h3 className="text-2xl font-bold font-serif">Two Truths & a Lie</h3>
                    <p className="text-white/80 text-sm">{game.state === 'guessing' ? `${isInitiator ? 'You' : otherParticipant.name} started a game.` : 'Game Over!'}</p>
                </div>
                
                {game.state === 'guessing' ? renderGuessingView() : renderCompletedView()}
            </div>
        </div>
    );
};
