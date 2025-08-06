import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UserProfile, PurchasableBadge, PurchasableBadgeId, RPSChoice, RPSResult, GuessTheVibeScenario, FakeProfile } from '../types';
import { BubbleShooterGame } from './BubbleShooterGame';
import { Button } from './Button';
import { SparklesIcon, TrophyIcon, LightBulbIcon, PencilIcon, CameraIcon, ChatBubbleBottomCenterTextIcon, ChatBubbleLeftRightIcon, UsersIcon, CheckCircleIcon, GemIcon, LaurelWreathIcon, ShootingStarIcon, ArrowLeftIcon, HandRockIcon, HandPaperIcon, HandScissorsIcon, BookHeartIcon, CpuChipIcon, XCircleIcon } from './IconComponents';
import { MemoryMatchGame } from './MemoryMatchGame';
import { RockPaperScissorsGame } from './RockPaperScissorsGame';
import { playRPS, generateGuessTheVibeScenario, generateFakeProfile, generateAvatar } from '../services/geminiService';
import { VibeWeaverGame } from './VibeWeaverGame';

interface GameViewProps {
    currentUser: UserProfile;
    allProfiles: UserProfile[];
    onUpdateUserPoints: (userId: number, points: number) => void;
    onRedeemPicks: () => Promise<void>;
    isRedeeming: boolean;
    unlockedAchievements: Set<string>;
    claimedAchievements: Set<string>;
    onClaimAchievement: (id: string, points: number) => void;
    onBuyBadge: (badgeId: PurchasableBadgeId, cost: number) => void;
    onEquipBadge: (badgeId: PurchasableBadgeId) => void;
    onStartChat: (profile: UserProfile) => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'PROFILE_MAKER',
        title: 'Profile Maker',
        description: 'Fill out your bio and story sections.',
        points: 50,
        icon: PencilIcon,
    },
    {
        id: 'PHOTO_FANATIC',
        title: 'Photo Fanatic',
        description: 'Upload at least 3 photos to your profile.',
        points: 50,
        icon: CameraIcon,
    },
    {
        id: 'PROMPT_PRO',
        title: 'Prompt Pro',
        description: 'Answer all 3 of your profile prompts.',
        points: 75,
        icon: ChatBubbleBottomCenterTextIcon,
    },
    {
        id: 'ICEBREAKER',
        title: 'Icebreaker',
        description: 'Start your first conversation.',
        points: 25,
        icon: ChatBubbleLeftRightIcon,
    },
    {
        id: 'SOCIAL_BUTTERFLY',
        title: 'Social Butterfly',
        description: 'Start 5 conversations.',
        points: 100,
        icon: UsersIcon,
    },
];

export const ALL_PURCHASABLE_BADGES: PurchasableBadge[] = [
    { id: 'GEM', name: 'Heart of Gold', cost: 500, icon: GemIcon },
    { id: 'LAUREL', name: 'Verified Victor', cost: 1000, icon: LaurelWreathIcon },
    { id: 'SHOOTING_STAR', name: 'Shooting Star', cost: 1500, icon: ShootingStarIcon },
];

export const getBadgeById = (id: PurchasableBadgeId): PurchasableBadge | undefined => {
    return ALL_PURCHASABLE_BADGES.find(b => b.id === id);
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
            className="p-6 bg-white rounded-2xl shadow-lg border-2 border-transparent hover:border-brand-primary hover:scale-105 transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
    const borderColor = isWinner ? 'border-green-400' : 'border-slate-300';
    return (
        <div className="flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold font-serif text-gray-800">{label}</h3>
            <div className={`w-48 h-48 rounded-full flex items-center justify-center bg-white shadow-inner border-4 ${borderColor}`}>
                {isLoading ? (
                    <SparklesIcon className="w-16 h-16 text-brand-primary animate-pulse" />
                ) : choice ? (
                    icons[choice]
                ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-200" />
                )}
            </div>
        </div>
    );
};

const RPSBattleMode: React.FC<{ onExit: () => void; onUpdatePoints: (points: number) => void }> = ({ onExit, onUpdatePoints }) => {
    const [battleState, setBattleState] = useState({
        score: { user: 0, ai: 0 },
        round: 1,
        userChoice: null as RPSChoice | null,
        aiChoice: null as RPSChoice | null,
        result: null as RPSResult | null,
        gameOver: false,
        matchResult: null as 'win' | 'lose' | 'draw' | null,
        pointsAwarded: 0,
    });
    const [isLoading, setIsLoading] = useState(false);

    const resetBattle = () => {
        setBattleState({
            score: { user: 0, ai: 0 },
            round: 1,
            userChoice: null,
            aiChoice: null,
            result: null,
            gameOver: false,
            matchResult: null,
            pointsAwarded: 0,
        });
    };

    const handlePlay = async (choice: RPSChoice) => {
        setIsLoading(true);
        setBattleState(prev => ({ ...prev, userChoice: choice, result: null, aiChoice: null }));
        
        try {
            const { aiChoice, result } = await playRPS(choice);
            
            let newScore = { ...battleState.score };
            if (result === 'win') newScore.user++;
            if (result === 'lose') newScore.ai++;

            let gameOver = false;
            let matchResult: 'win' | 'lose' | 'draw' | null = null;
            let pointsAwarded = 0;

            const isLastRound = battleState.round === 5;
            const userWins = newScore.user;
            const aiWins = newScore.ai;
            
            if (userWins === 3 || aiWins === 3 || isLastRound) {
                gameOver = true;
                if (userWins > aiWins) {
                    matchResult = 'win';
                    pointsAwarded = 100;
                } else if (aiWins > userWins) {
                    matchResult = 'lose';
                    pointsAwarded = 10;
                } else {
                    matchResult = 'draw';
                    pointsAwarded = 50;
                }
                onUpdatePoints(pointsAwarded);
            }
            
            setBattleState(prev => ({
                ...prev,
                aiChoice,
                result,
                score: newScore,
                gameOver,
                matchResult,
                pointsAwarded,
            }));

        } catch (error) {
            console.error("RPS battle error:", error);
            alert("The AI opponent is thinking too hard! Please try again.");
            setBattleState(prev => ({ ...prev, userChoice: null }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextRound = () => {
        setBattleState(prev => ({
            ...prev,
            round: prev.round + 1,
            userChoice: null,
            aiChoice: null,
            result: null,
        }));
    };

    const resultText = useMemo(() => {
        if (!battleState.result) return '...';
        switch (battleState.result) {
            case 'win': return 'You Win this Round!';
            case 'lose': return 'AI Wins this Round!';
            case 'draw': return "It's a Draw!";
        }
    }, [battleState.result]);

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-xl p-4 md:p-6 relative">
            <Button variant="ghost" onClick={onExit} leftIcon={<ArrowLeftIcon />} className="absolute top-4 left-4 !px-3">Back</Button>
            <h2 className="text-3xl font-bold font-serif text-gray-800 text-center mb-2">RPS Battle</h2>
            
            {!battleState.gameOver ? (
                <p className="text-center font-semibold text-slate-500 mb-4">
                    Round {battleState.round} / 5  <span className="mx-2">|</span>  Best of 5
                </p>
            ) : (
                <p className="text-center font-semibold text-slate-500 mb-4">Match Over!</p>
            )}

            <div className="text-center mb-6">
                <p className="text-4xl font-bold text-gray-800">
                    <span className="text-brand-primary">{battleState.score.user}</span> : <span>{battleState.score.ai}</span>
                </p>
                <p className="text-sm font-semibold text-slate-500">(You : AI)</p>
            </div>

            <div className="flex-grow flex items-center justify-around w-full px-4">
                <ChoiceDisplay label="Your Choice" choice={battleState.userChoice} isWinner={battleState.result === 'win'} />
                <ChoiceDisplay label="AI's Choice" choice={battleState.aiChoice} isWinner={battleState.result === 'lose'} isLoading={isLoading} />
            </div>

            <div className="w-full text-center min-h-[160px] flex flex-col justify-center items-center">
                {battleState.gameOver ? (
                     <div className="animate-in fade-in duration-500">
                        {battleState.matchResult === 'win' && <h2 className="text-4xl font-bold font-serif text-green-600 mb-2">You Won the Match!</h2>}
                        {battleState.matchResult === 'lose' && <h2 className="text-4xl font-bold font-serif text-red-600 mb-2">You Lost the Match!</h2>}
                        {battleState.matchResult === 'draw' && <h2 className="text-4xl font-bold font-serif text-slate-600 mb-2">It's a Draw!</h2>}
                        <p className="text-lg font-semibold text-gray-800 mb-4">You earned {battleState.pointsAwarded} points!</p>
                        <div className="flex justify-center gap-4">
                            <Button onClick={onExit} variant="secondary">Exit to Game Zone</Button>
                            <Button onClick={resetBattle}>Play Again</Button>
                        </div>
                    </div>
                ) : battleState.result ? (
                    <div className="animate-in fade-in duration-500">
                        <h2 className="text-2xl font-bold font-serif text-gray-800 mb-4">{resultText}</h2>
                        <Button onClick={handleNextRound}>Next Round</Button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold font-serif text-gray-800 mb-4">Make your move!</h2>
                        <div className="flex justify-center gap-4">
                            <ChoiceButton choice="rock" onClick={() => handlePlay('rock')} disabled={isLoading} />
                            <ChoiceButton choice="paper" onClick={() => handlePlay('paper')} disabled={isLoading} />
                            <ChoiceButton choice="scissors" onClick={() => handlePlay('scissors')} disabled={isLoading} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const GuessTheVibeGame: React.FC<{
    currentUser: UserProfile;
    allProfiles: UserProfile[];
    onUpdatePoints: (points: number) => void;
}> = ({ currentUser, allProfiles, onUpdatePoints }) => {
    const [scenario, setScenario] = useState<GuessTheVibeScenario | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userGuess, setUserGuess] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [score, setScore] = useState(0);

    const otherUsers = useMemo(() => allProfiles.filter(p => p.id !== currentUser.id), [allProfiles, currentUser.id]);
    const profilesById = useMemo(() => new Map(allProfiles.map(p => [p.id, p])), [allProfiles]);

    const handleStartRound = useCallback(async () => {
        setIsLoading(true);
        setUserGuess(null);
        setIsCorrect(null);
        setScenario(null);

        try {
            const newScenario = await generateGuessTheVibeScenario(currentUser, otherUsers);
            setScenario(newScenario);
        } catch (error) {
            console.error("Failed to generate vibe scenario:", error);
            alert("Sorry, we couldn't create a new round right now. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, otherUsers]);

    const handleGuess = (guess: string) => {
        if (!scenario) return;
        setUserGuess(guess);
        const correct = guess === scenario.correctVibe;
        setIsCorrect(correct);

        if (correct) {
            const points = 25;
            setScore(prev => prev + points);
            onUpdatePoints(points);
        }
    };

    const otherProfile = scenario ? profilesById.get(scenario.otherProfileId) : null;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full">
                <SparklesIcon className="w-16 h-16 text-brand-primary animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-gray-800">Creating a new scenario...</p>
            </div>
        );
    }
    
    if (!scenario || !otherProfile) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full">
                <h3 className="text-2xl font-bold font-serif text-gray-800">Guess the Vibe!</h3>
                <p className="mt-2 mb-6 max-w-sm text-slate-600">Read a conversation summary and guess the vibe to earn points.</p>
                <Button onClick={handleStartRound} leftIcon={<SparklesIcon />}>Start a Round</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center h-full p-4">
            <p className="font-bold text-lg text-brand-primary mb-4">Your Score: {score}</p>

            <div className="w-full max-w-lg mx-auto text-center">
                <p className="text-slate-600 mb-2">Based on their profile, what was the vibe of your first chat with...</p>
                <div className="flex items-center justify-center gap-3 mb-4">
                    <img src={otherProfile.profilePicture} alt={otherProfile.name} className="w-12 h-12 rounded-full object-cover"/>
                    <h3 className="text-2xl font-bold font-serif text-gray-800">{otherProfile.name}?</h3>
                </div>
                
                <div className="p-4 bg-white rounded-xl border border-dashed border-brand-primary/30 mb-6">
                    <p className="font-semibold text-gray-800 mb-1">Conversation Summary:</p>
                    <p className="italic text-slate-700">"{scenario.conversationSummary}"</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {scenario.vibeOptions.map(option => {
                        const isSelected = userGuess === option;
                        let buttonClass = 'bg-white hover:bg-gray-50';
                        if (userGuess) {
                            if (option === scenario.correctVibe) {
                                buttonClass = 'bg-green-200 border-green-400';
                            } else if (isSelected) {
                                buttonClass = 'bg-red-200 border-red-400';
                            } else {
                                buttonClass = 'bg-slate-200 opacity-60';
                            }
                        }

                        return (
                            <Button
                                key={option}
                                onClick={() => handleGuess(option)}
                                disabled={!!userGuess}
                                className={`!rounded-lg !text-gray-800 !font-semibold !py-4 h-full transition-all duration-300 border-2 ${buttonClass}`}
                            >
                                {option}
                            </Button>
                        );
                    })}
                </div>
                
                {isCorrect !== null && (
                    <div className="mt-6 animate-in fade-in">
                        <p className={`text-xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {isCorrect ? `Correct! You earned 25 points.` : `Not quite! The correct vibe was "${scenario.correctVibe}".`}
                        </p>
                        <Button onClick={handleStartRound} className="mt-4">Next Round</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AIOrHumanGame: React.FC<{
    currentUser: UserProfile;
    allProfiles: UserProfile[];
    onUpdatePoints: (points: number) => void;
}> = ({ currentUser, allProfiles, onUpdatePoints }) => {
    const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'result'>('idle');
    const [roundData, setRoundData] = useState<{
        profiles: (UserProfile | (FakeProfile & { id: number, profilePicture: string }))[];
        aiProfileIndex: number;
    } | null>(null);
    const [userGuess, setUserGuess] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const otherUsers = useMemo(() => allProfiles.filter(p => p.id !== currentUser.id && p.bio && p.interestTags && p.interestTags.length > 2), [allProfiles, currentUser.id]);

    const handleStartRound = useCallback(async () => {
        if (otherUsers.length < 1) {
            setError("Not enough other user profiles in the system to start a game.");
            setGameState('idle');
            return;
        }

        setGameState('loading');
        setUserGuess(null);
        setError(null);

        try {
            const realProfile = otherUsers[Math.floor(Math.random() * otherUsers.length)];
            const fakeProfileData = await generateFakeProfile(realProfile);
            const avatarBase64 = await generateAvatar(fakeProfileData.avatarPrompt);
            
            const fakeProfile: FakeProfile & { id: number, profilePicture: string } = {
                ...fakeProfileData,
                id: Math.random() * -1, // Negative ID for fake profiles
                profilePicture: `data:image/jpeg;base64,${avatarBase64}`
            };

            const profiles = [realProfile, fakeProfile];
            const aiProfileIndex = Math.round(Math.random()); // 0 or 1
            if (aiProfileIndex === 1) {
                [profiles[0], profiles[1]] = [profiles[1], profiles[0]]; // Swap
            }

            setRoundData({ profiles, aiProfileIndex });
            setGameState('playing');
        } catch (err) {
            console.error("Failed to start AI or Human round:", err);
            setError("The AI is a bit shy right now and couldn't create a profile. Please try again.");
            setGameState('idle');
        }
    }, [currentUser, otherUsers]);

    const handleGuess = (index: number) => {
        if (!roundData) return;
        setUserGuess(index);
        setGameState('result');
        if (index === roundData.aiProfileIndex) {
            const points = 50;
            setScore(prev => prev + points);
            onUpdatePoints(points);
        }
    };
    
    const GameProfileCard: React.FC<{
        profile: any;
        onGuess: () => void;
        isRevealed: boolean;
        isAI: boolean;
        wasGuessed: boolean;
    }> = ({ profile, onGuess, isRevealed, isAI, wasGuessed }) => {
        const isCorrectGuess = isAI && wasGuessed;
        const isIncorrectGuess = !isAI && wasGuessed;
    
        let borderColor = 'border-slate-300';
        if (isRevealed && isAI) borderColor = 'border-green-500';
        if (isIncorrectGuess) borderColor = 'border-red-500';
    
        return (
            <button
                onClick={onGuess}
                disabled={isRevealed}
                className={`w-full text-left bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 ease-in-out group border-4 ${borderColor}`}
            >
                <div className="relative">
                    <img className="w-full h-48 object-cover" src={profile.profilePicture} alt={profile.name} />
                    {isRevealed && (
                        <div className={`absolute top-2 right-2 px-3 py-1 text-sm font-bold text-white rounded-full ${isAI ? 'bg-green-500' : 'bg-blue-500'}`}>
                            {isAI ? 'AI' : 'Human'}
                        </div>
                    )}
                    {wasGuessed && (
                         <div className={`absolute top-2 left-2 p-1.5 rounded-full text-white ${isCorrectGuess ? 'bg-green-500' : 'bg-red-500'}`}>
                            {isCorrectGuess ? <CheckCircleIcon className="w-6 h-6"/> : <XCircleIcon className="w-6 h-6"/>}
                        </div>
                    )}
                </div>
                <div className="p-4">
                    <h3 className="text-xl font-bold font-serif">{profile.name}, {profile.age}</h3>
                    <p className="text-gray-500 text-sm mb-2 h-10 overflow-hidden">{profile.bio}</p>
                    <div className="flex flex-wrap gap-1">
                        {(profile.interestTags || []).slice(0, 3).map((tag: string) => (
                            <span key={tag} className="bg-brand-primary/10 text-brand-primary text-xs font-semibold px-2 py-1 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </button>
        );
    };

    if (gameState === 'idle') {
         return (
            <div className="flex flex-col items-center justify-center text-center h-full">
                <h3 className="text-2xl font-bold font-serif text-gray-800">AI or Human?</h3>
                <p className="mt-2 mb-6 max-w-sm text-slate-600">Can you spot the fake profile generated by AI? Test your intuition!</p>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <Button onClick={handleStartRound} leftIcon={<SparklesIcon />}>Start Game</Button>
            </div>
        );
    }
    
    if (gameState === 'loading' || !roundData) {
        return (
            <div className="flex flex-col items-center justify-center text-center h-full">
                <SparklesIcon className="w-16 h-16 text-brand-primary animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-gray-800">The AI is creating a profile...</p>
                <p className="text-slate-600">This might take a moment.</p>
            </div>
        );
    }

    return (
         <div className="flex flex-col items-center h-full p-4">
            <p className="font-bold text-lg text-brand-primary mb-4">Your Score: {score}</p>
            <h3 className="text-xl font-bold font-serif text-gray-800 text-center mb-4">Which profile is generated by AI?</h3>
            <div className="w-full flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                <GameProfileCard 
                    profile={roundData.profiles[0]}
                    onGuess={() => handleGuess(0)}
                    isRevealed={gameState === 'result'}
                    isAI={roundData.aiProfileIndex === 0}
                    wasGuessed={userGuess === 0}
                />
                <GameProfileCard 
                    profile={roundData.profiles[1]}
                    onGuess={() => handleGuess(1)}
                    isRevealed={gameState === 'result'}
                    isAI={roundData.aiProfileIndex === 1}
                    wasGuessed={userGuess === 1}
                />
            </div>
            {gameState === 'result' && (
                <div className="mt-6 text-center animate-in fade-in">
                    <p className={`text-2xl font-bold font-serif ${userGuess === roundData.aiProfileIndex ? 'text-green-600' : 'text-red-600'}`}>
                        {userGuess === roundData.aiProfileIndex ? 'Correct! You earned 50 points.' : 'Oops, that was a real person!'}
                    </p>
                    <Button onClick={handleStartRound} className="mt-4">Next Round</Button>
                </div>
            )}
        </div>
    );
};

export const GameView: React.FC<GameViewProps> = ({ currentUser, allProfiles, onUpdateUserPoints, onRedeemPicks, isRedeeming, unlockedAchievements, claimedAchievements, onClaimAchievement, onBuyBadge, onEquipBadge, onStartChat }) => {
    const [boostTimeLeft, setBoostTimeLeft] = useState(0); // in seconds
    const timerRef = useRef<number | null>(null);
    const [activeGame, setActiveGame] = useState<'bubble' | 'memory' | 'rps' | 'guessTheVibe' | 'vibeWeaver' | 'aiOrHuman'>('bubble');
    const [isRpsBattleMode, setIsRpsBattleMode] = useState(false);

    // Timer effect for the boost
    useEffect(() => {
        if (boostTimeLeft > 0) {
            timerRef.current = window.setInterval(() => {
                setBoostTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [boostTimeLeft]);
    
    const handleGameEnd = useCallback((score: number) => {
        if (score > 0) {
            alert(`Game over! You earned ${score} points.`);
            onUpdateUserPoints(currentUser.id, score);
        }
    }, [currentUser.id, onUpdateUserPoints]);
    
    const POINTS_COST = 100;
    const BOOST_COST = 200;

    const handleActivateBoost = () => {
        if (currentUser.points < BOOST_COST) {
            alert("You don't have enough points for a Profile Boost!");
            return;
        }
        if (window.confirm(`Activate Profile Boost for ${BOOST_COST} points? Your profile will be shown to more people for 60 minutes.`)) {
            onUpdateUserPoints(currentUser.id, -BOOST_COST);
            setBoostTimeLeft(3600); // 60 minutes
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const GameTabButton: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode; icon: React.ReactNode; }> = ({ onClick, isActive, children, icon }) => (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                isActive ? 'bg-brand-primary/5 text-brand-primary' : 'bg-transparent text-gray-500 hover:bg-brand-primary/5 hover:text-brand-primary'
            }`}
        >
            {icon}
            {children}
        </button>
    );
    
    if (isRpsBattleMode) {
        return (
            <div className="container mx-auto px-4 sm:px-6 py-8 h-full flex flex-col">
                <RPSBattleMode 
                    onExit={() => setIsRpsBattleMode(false)} 
                    onUpdatePoints={(points) => onUpdateUserPoints(currentUser.id, points)} 
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 h-full flex flex-col">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold font-serif text-gray-800">Game Zone</h2>
                <p className="text-slate-500 mt-2 max-w-2xl mx-auto">Play games, earn points, and unlock more matches!</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
                {/* Game Area */}
                 <div className="lg:col-span-2 flex flex-col bg-brand-primary/5 rounded-2xl">
                    <div className="flex-shrink-0 flex overflow-x-auto">
                        <GameTabButton isActive={activeGame === 'bubble'} onClick={() => setActiveGame('bubble')} icon={<SparklesIcon className="w-5 h-5"/>}>
                            Bubble Pop!
                        </GameTabButton>
                        <GameTabButton isActive={activeGame === 'memory'} onClick={() => setActiveGame('memory')} icon={<TrophyIcon className="w-5 h-5"/>}>
                            Memory Match
                        </GameTabButton>
                        <GameTabButton isActive={activeGame === 'rps'} onClick={() => setActiveGame('rps')} icon={<HandRockIcon className="w-5 h-5"/>}>
                            RPS
                        </GameTabButton>
                         <GameTabButton isActive={activeGame === 'guessTheVibe'} onClick={() => setActiveGame('guessTheVibe')} icon={<LightBulbIcon className="w-5 h-5"/>}>
                            Guess the Vibe
                        </GameTabButton>
                        <GameTabButton isActive={activeGame === 'vibeWeaver'} onClick={() => setActiveGame('vibeWeaver')} icon={<BookHeartIcon className="w-5 h-5"/>}>
                            Vibe Weaver
                        </GameTabButton>
                         <GameTabButton isActive={activeGame === 'aiOrHuman'} onClick={() => setActiveGame('aiOrHuman')} icon={<CpuChipIcon className="w-5 h-5"/>}>
                            AI or Human?
                        </GameTabButton>
                    </div>
                    <div className="flex-grow p-4">
                        {activeGame === 'bubble' && <BubbleShooterGame onGameEnd={handleGameEnd} />}
                        {activeGame === 'memory' && <MemoryMatchGame onGameEnd={handleGameEnd} />}
                        {activeGame === 'rps' && <RockPaperScissorsGame onRoundEnd={(points) => onUpdateUserPoints(currentUser.id, points)} />}
                        {activeGame === 'guessTheVibe' && <GuessTheVibeGame currentUser={currentUser} allProfiles={allProfiles} onUpdatePoints={(points) => onUpdateUserPoints(currentUser.id, points)} />}
                        {activeGame === 'vibeWeaver' && <VibeWeaverGame currentUser={currentUser} allProfiles={allProfiles} onUpdatePoints={(points) => onUpdateUserPoints(currentUser.id, points)} onStartChat={onStartChat} />}
                        {activeGame === 'aiOrHuman' && <AIOrHumanGame currentUser={currentUser} allProfiles={allProfiles} onUpdatePoints={(points) => onUpdateUserPoints(currentUser.id, points)} />}
                    </div>
                </div>

                {/* Rewards and Score Area */}
                <div className="lg:col-span-1">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-md sticky top-24 max-h-[calc(100vh-140px)] overflow-y-auto">
                         <div className="p-6">
                            <div className="text-center border-b border-brand-primary/30 pb-4">
                                <TrophyIcon className="w-12 h-12 mx-auto text-brand-primary" />
                                <h3 className="text-xl font-bold font-serif text-gray-800 mt-2">Your Points</h3>
                                <p className="text-4xl font-bold text-gray-800">{currentUser.points}</p>
                            </div>
                            <div className="mt-4 text-center">
                                <h4 className="font-semibold text-gray-800">Redeem Your Points!</h4>
                                <p className="text-sm text-slate-600 my-2">
                                    Spend <span className="font-bold text-brand-primary">{POINTS_COST} points</span> to get 3 brand new AI-powered match suggestions instantly!
                                </p>
                                <Button 
                                    onClick={onRedeemPicks}
                                    disabled={isRedeeming || currentUser.points < POINTS_COST}
                                    leftIcon={<SparklesIcon />}
                                    className="w-full mt-2"
                                >
                                    {isRedeeming ? 'Finding Matches...' : `Get New Matches (-${POINTS_COST} pts)`}
                                </Button>
                            </div>
                            {/* NEW POWER-UP SECTION */}
                            <div className="mt-4 pt-4 border-t border-brand-primary/30 text-center">
                                <h4 className="font-semibold text-gray-800">Power-Ups</h4>
                                
                                {boostTimeLeft > 0 ? (
                                    <div className="mt-2 p-4 bg-brand-primary/10 rounded-lg">
                                        <div className="flex items-center justify-center gap-2 font-bold text-brand-primary">
                                            <LightBulbIcon className="w-6 h-6 animate-pulse" />
                                            <span>Profile Boost Active!</span>
                                        </div>
                                        <p className="text-4xl font-bold font-mono text-gray-800 my-2">{formatTime(boostTimeLeft)}</p>
                                        <p className="text-sm text-slate-600">You're being shown to more people.</p>
                                    </div>
                                ) : (
                                    <div className="mt-2">
                                        <p className="text-sm text-slate-600 my-2">
                                            Get seen by more people for 60 minutes! Cost: <span className="font-bold text-brand-primary">{BOOST_COST} points</span>
                                        </p>
                                        <Button 
                                            onClick={handleActivateBoost}
                                            disabled={currentUser.points < BOOST_COST}
                                            leftIcon={<LightBulbIcon />}
                                            className="w-full mt-2"
                                        >
                                            Activate Profile Boost
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-brand-primary/30 text-center">
                                <h4 className="font-semibold text-gray-800">Challenge Mode</h4>
                                <p className="text-sm text-slate-600 my-2">
                                    Test your luck against the AI in a best-of-5 RPS Battle for big point rewards!
                                </p>
                                <Button 
                                    onClick={() => setIsRpsBattleMode(true)}
                                    leftIcon={<TrophyIcon />}
                                    className="w-full mt-2"
                                    variant="secondary"
                                >
                                    Start RPS Battle
                                </Button>
                            </div>
                             {/* Badge Shop */}
                            <div className="mt-4 pt-4 border-t border-brand-primary/30 text-center">
                                <h4 className="font-semibold text-gray-800">Badge Shop</h4>
                                <p className="text-sm text-slate-600 mt-1 mb-4">Purchase a badge to show off on your profile!</p>
                                <div className="space-y-3">
                                    {ALL_PURCHASABLE_BADGES.map(badge => {
                                        const isOwned = currentUser.ownedBadges?.includes(badge.id);
                                        const isEquipped = currentUser.equippedBadge === badge.id;
                                        const canAfford = currentUser.points >= badge.cost;
                                        const BadgeIcon = badge.icon;
                                        return (
                                            <div key={badge.id} className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg">
                                                <div className="p-2 bg-white rounded-full shadow-inner"><BadgeIcon className="w-8 h-8 text-brand-primary"/></div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-bold text-gray-800">{badge.name}</p>
                                                    {!isOwned && <p className="text-xs text-slate-500 font-semibold">{badge.cost} points</p>}
                                                </div>
                                                {isEquipped ? (
                                                     <Button onClick={() => onEquipBadge(badge.id)} variant='secondary' className='!px-3 !py-1.5 !text-xs'>Equipped</Button>
                                                ) : isOwned ? (
                                                     <Button onClick={() => onEquipBadge(badge.id)} className='!px-3 !py-1.5 !text-xs'>Equip</Button>
                                                ) : (
                                                     <Button onClick={() => onBuyBadge(badge.id, badge.cost)} disabled={!canAfford} variant='secondary' className='!px-3 !py-1.5 !text-xs'>Buy</Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        {/* Achievements Section */}
                        <div className="p-6 pt-0">
                            <h3 className="text-xl font-bold font-serif text-gray-800 mb-4 text-center border-t border-brand-primary/30 pt-6">🏆 Achievements</h3>
                            <div className="space-y-3">
                                {ALL_ACHIEVEMENTS.map(ach => {
                                    const isUnlocked = unlockedAchievements.has(ach.id);
                                    const isClaimed = claimedAchievements.has(ach.id);
                                    const Icon = ach.icon;
                                    return (
                                        <div key={ach.id} className={`p-3 rounded-lg border-2 transition-all duration-300 flex items-center gap-3 ${
                                            isClaimed 
                                                ? 'bg-green-50 border-green-300' 
                                                : isUnlocked 
                                                ? 'bg-yellow-50 border-yellow-300 shadow-md' 
                                                : 'bg-white/50 border-slate-200 opacity-70'
                                        }`}>
                                            <div className={`flex-shrink-0 p-2 rounded-full ${
                                                isClaimed 
                                                    ? 'bg-green-200 text-green-700' 
                                                    : isUnlocked
                                                    ? 'bg-yellow-200 text-yellow-700'
                                                    : 'bg-slate-200 text-slate-500'
                                            }`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-bold ${
                                                    isClaimed 
                                                        ? 'text-green-800' 
                                                        : isUnlocked
                                                        ? 'text-yellow-900'
                                                        : 'text-slate-600'
                                                }`}>{ach.title}</h4>
                                                <p className="text-sm text-slate-500">{ach.description}</p>
                                            </div>
                                            <div className="ml-auto pl-2 flex-shrink-0">
                                                {isUnlocked && !isClaimed && (
                                                    <Button 
                                                        onClick={() => onClaimAchievement(ach.id, ach.points)} 
                                                        className="!py-2 !px-4 !text-sm !bg-yellow-500 hover:!bg-yellow-600 !shadow-yellow-500/30"
                                                    >
                                                        Claim +{ach.points}
                                                    </Button>
                                                )}
                                                {isClaimed && (
                                                    <div className="text-green-600 font-semibold flex items-center gap-2 text-sm">
                                                        <CheckCircleIcon className="w-5 h-5"/>
                                                        Claimed
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};