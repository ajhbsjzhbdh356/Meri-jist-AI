import React, { useState, useEffect, useMemo } from 'react';
import { Conversation, UserProfile, DateBucketListItem, RelationshipCheckIn, SharedValue, CoupleQuiz, CoupleQuizQuestion, CoupleJournalPrompt, CoupleGoal, PeaceKeeperReport } from '../types';
import { suggestDateIdeasFromChat, generateDateIdeaDescription, generateDreamDateImage, generateDateItinerary, generateRelationshipCheckInPrompt, generateSharedValues, generateCoupleQuizQuestions, analyzeCoupleQuizResults, generateCoupleJournalPrompt, analyzeCoupleJournalEntries, generateOurSongLyrics, generatePeaceKeeperResponse } from '../services/geminiService';
import { Button } from './Button';
import { SparklesIcon, HeartIcon, HeartOutlineIcon, PhotographIcon, TrashIcon, ClipboardCheckIcon, UsersIcon, PuzzlePieceIcon, CheckCircleIcon, BookHeartIcon, FlagIcon, LightBulbIcon, ChatBubbleBottomCenterTextIcon } from './IconComponents';
import { CoupleGoalsTracker } from './CoupleGoalsTracker';

interface CoupleCanvasViewProps {
  conversation: Conversation;
  currentUser: UserProfile;
  otherParticipant: UserProfile;
  onUpdateConversation: (updates: Partial<Conversation>) => void;
}

const BucketListItem: React.FC<{
    item: DateBucketListItem;
    onVote: (itemId: string) => void;
    onPlan: (itemId: string, itemTitle: string) => void;
    onClearPlan: (itemId: string) => void;
    currentUserId: number;
    otherParticipantName: string;
    isPlanning: boolean;
}> = ({ item, onVote, onPlan, onClearPlan, currentUserId, otherParticipantName, isPlanning }) => {
    const hasVoted = item.votes.includes(currentUserId);
    
    let suggestedByText = 'Suggested by SoulMate AI';
    if (item.suggestedBy === currentUserId) {
        suggestedByText = 'Suggested by you';
    } else if (item.suggestedBy !== 'ai') {
        suggestedByText = `Suggested by ${otherParticipantName}`;
    }

    const formattedItinerary = item.itinerary
        ?.split('* ')
        .filter(line => line.trim() !== '')
        .map((line, index) => <li key={index}>{line.trim()}</li>);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-start gap-4">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-rose-gold mb-1">{suggestedByText}</p>
                    <h4 className="font-bold text-deep-teal">{item.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                </div>
                <div className="flex flex-col items-center">
                    <button onClick={() => onVote(item.id)} className="p-1.5 rounded-full hover:bg-rose-gold/10 transition-colors">
                        {hasVoted ? <HeartIcon className="w-6 h-6 text-rose-gold" /> : <HeartOutlineIcon className="w-6 h-6 text-slate-400" />}
                    </button>
                    <span className="text-sm font-bold text-slate-500">{item.votes.length}</span>
                </div>
            </div>
             {item.itinerary ? (
                <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                        <h5 className="font-semibold text-deep-teal flex items-center gap-2">
                            <ClipboardCheckIcon className="w-5 h-5" />
                            AI-Generated Plan:
                        </h5>
                        <Button variant="ghost" className="!text-xs !py-1 !px-2" onClick={() => onClearPlan(item.id)}>Clear Plan</Button>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                        {formattedItinerary}
                    </ul>
                </div>
            ) : (
                <div className="mt-3 text-right">
                    <Button 
                        variant="ghost" 
                        className="!text-sm"
                        leftIcon={<SparklesIcon className="w-4 h-4" />}
                        onClick={() => onPlan(item.id, item.title)}
                        disabled={isPlanning}
                    >
                        {isPlanning ? 'Planning...' : 'Plan with AI'}
                    </Button>
                </div>
            )}
        </div>
    );
};

const CanvasTabButton: React.FC<{isActive: boolean, onClick: () => void, icon: React.ReactNode, children: React.ReactNode}> = ({isActive, onClick, icon, children}) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap flex items-center gap-2 pb-3 px-3 border-b-2 font-semibold text-sm transition-colors duration-200 rounded-t-md
            ${isActive
                ? 'border-rose-gold text-rose-gold bg-white'
                : 'border-transparent text-slate-500 hover:text-deep-teal hover:border-slate-300'
            }
        `}
    >
        {icon}
        {children}
    </button>
);

const ResultCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
        <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 text-rose-gold">{icon}</div>
            <h4 className="font-semibold text-deep-teal">{title}</h4>
        </div>
        <div className="pl-9 text-slate-700">{children}</div>
    </div>
);


export const CoupleCanvasView: React.FC<CoupleCanvasViewProps> = ({ conversation, currentUser, otherParticipant, onUpdateConversation }) => {
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [newUserIdea, setNewUserIdea] = useState('');
    const [isAddingIdea, setIsAddingIdea] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [planningItemId, setPlanningItemId] = useState<string | null>(null);
    const [canvasTab, setCanvasTab] = useState<'bucketList' | 'dreamDate' | 'goals' | 'checkIn' | 'values' | 'quiz' | 'journal' | 'song' | 'peaceKeeper'>('bucketList');
    
    const canvas = conversation.coupleCanvas;

    // State for Our Song
    const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
    const [lyricsError, setLyricsError] = useState<string | null>(null);

    // State for Dream Date Illustrator
    const [promptFragment, setPromptFragment] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    const fragments = useMemo(() => canvas?.dreamDatePromptFragments || [], [canvas?.dreamDatePromptFragments]);
    const combinedPrompt = useMemo(() => fragments.map(f => f.text).join(', '), [fragments]);

    // State for Relationship Check-in
    const [isStartingCheckIn, setIsStartingCheckIn] = useState(false);
    const [checkInResponse, setCheckInResponse] = useState('');

    // State for Shared Values
    const [isDiscoveringValues, setIsDiscoveringValues] = useState(false);
    const userMessagesCount = conversation.messages.filter(m => m.senderId !== 0).length;
    const VALUES_UNLOCK_THRESHOLD = 30;
    const canDiscoverValues = userMessagesCount >= VALUES_UNLOCK_THRESHOLD;
    
    // State for Couple Quiz
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
    const QUIZ_UNLOCK_THRESHOLD = 40;
    const canStartQuiz = userMessagesCount >= QUIZ_UNLOCK_THRESHOLD;
    const latestQuiz = canvas?.quizzes && canvas.quizzes.length > 0 ? canvas.quizzes[canvas.quizzes.length - 1] : null;

    // State for Couple's Journal
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [journalEntryText, setJournalEntryText] = useState('');
    const [isAnalyzingJournal, setIsAnalyzingJournal] = useState(false);
    const latestJournalPrompt = canvas?.journalPrompts && canvas.journalPrompts.length > 0 ? canvas.journalPrompts[canvas.journalPrompts.length - 1] : null;

    // State for Peace Keeper
    const [whatHappened, setWhatHappened] = useState('');
    const [whatIWantToSay, setWhatIWantToSay] = useState('');
    const [peaceKeeperReport, setPeaceKeeperReport] = useState<PeaceKeeperReport | null>(null);
    const [isGeneratingPeaceKeeper, setIsGeneratingPeaceKeeper] = useState(false);
    const [peaceKeeperError, setPeaceKeeperError] = useState<string | null>(null);

    if (!canvas) return null;

    const handleUpdateGoals = (newGoals: CoupleGoal[]) => {
        onUpdateConversation({
            coupleCanvas: {
                ...canvas!,
                coupleGoals: newGoals,
            }
        });
    };

    const handleGetSuggestions = async () => {
        setIsLoadingSuggestions(true);
        setError(null);
        try {
            const chatHistory = conversation.messages
                .map(m => `${m.senderId === currentUser.id ? 'Me' : otherParticipant.name}: ${m.text || '(audio message)'}`)
                .join('\n');
            
            const suggestions = await suggestDateIdeasFromChat(chatHistory);

            const newItems: DateBucketListItem[] = suggestions.map(s => ({
                id: `idea-${Date.now()}-${Math.random()}`,
                title: s.title,
                description: s.description,
                suggestedBy: 'ai',
                votes: [],
            }));

            onUpdateConversation({
                coupleCanvas: {
                    ...canvas,
                    dateBucketList: [...canvas.dateBucketList, ...newItems],
                }
            });

        } catch (err) {
            console.error(err);
            setError("Sorry, the AI couldn't generate date ideas right now. Please try again.");
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleVote = (itemId: string) => {
        const updatedList = canvas.dateBucketList.map(item => {
            if (item.id === itemId) {
                const newVotes = item.votes.includes(currentUser.id)
                    ? item.votes.filter(id => id !== currentUser.id)
                    : [...item.votes, currentUser.id];
                return { ...item, votes: newVotes };
            }
            return item;
        });
        onUpdateConversation({
            coupleCanvas: { ...canvas, dateBucketList: updatedList }
        });
    };
    
    const handleAddUserIdea = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserIdea.trim() || isAddingIdea) return;
        
        const title = newUserIdea.trim();
        setIsAddingIdea(true);
        setNewUserIdea('');

        try {
            const description = await generateDateIdeaDescription(title);
            
            const newItem: DateBucketListItem = {
                id: `idea-${Date.now()}-${Math.random()}`,
                title: title,
                description: description,
                suggestedBy: currentUser.id,
                votes: [],
            };

            onUpdateConversation({
                coupleCanvas: {
                    ...canvas,
                    dateBucketList: [newItem, ...canvas.dateBucketList],
                }
            });

        } catch (err) {
            console.error("Failed to generate description, using fallback.", err);
            const newItem: DateBucketListItem = {
                id: `idea-${Date.now()}-${Math.random()}`,
                title: title,
                description: "A wonderful idea for a date!",
                suggestedBy: currentUser.id,
                votes: [],
            };
            onUpdateConversation({
                coupleCanvas: {
                    ...canvas,
                    dateBucketList: [newItem, ...canvas.dateBucketList],
                }
            });
        } finally {
            setIsAddingIdea(false);
        }
    };

    const handlePlanDate = async (itemId: string, itemTitle: string) => {
        setPlanningItemId(itemId);
        setError(null);
        try {
            const itinerary = await generateDateItinerary(itemTitle, currentUser, otherParticipant);
            const updatedList = canvas!.dateBucketList.map(item => 
                item.id === itemId ? { ...item, itinerary } : item
            );
            onUpdateConversation({
                coupleCanvas: { ...canvas!, dateBucketList: updatedList }
            });
        } catch (err) {
            console.error(err);
            setError("Sorry, the AI couldn't generate an itinerary. Please try again.");
        } finally {
            setPlanningItemId(null);
        }
    };

    const handleClearPlan = (itemId: string) => {
        const updatedList = canvas!.dateBucketList.map(item => {
            if (item.id === itemId) {
                const { itinerary, ...rest } = item;
                return rest;
            }
            return item;
        });
         onUpdateConversation({
            coupleCanvas: { ...canvas!, dateBucketList: updatedList }
        });
    };

    const handleAddFragment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptFragment.trim()) return;

        const newFragment = { userId: currentUser.id, text: promptFragment.trim() };
        onUpdateConversation({
            coupleCanvas: {
                ...canvas,
                dreamDatePromptFragments: [...fragments, newFragment],
            }
        });
        setPromptFragment('');
    };

    const handleGenerateImage = async () => {
        if (!combinedPrompt) return;
        setIsGenerating(true);
        setGenerationError(null);
        try {
            const base64Image = await generateDreamDateImage(combinedPrompt);
            onUpdateConversation({
                coupleCanvas: {
                    ...canvas,
                    dreamDateImage: base64Image,
                }
            });
        } catch (err: any) {
            console.error(err);
            setGenerationError(err.message || "Failed to generate image. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClearDreamDate = () => {
        onUpdateConversation({
            coupleCanvas: {
                ...canvas,
                dreamDatePromptFragments: [],
                dreamDateImage: undefined,
            }
        });
        setPromptFragment('');
        setGenerationError(null);
    };

    // Relationship Check-in Logic
    const latestCheckIn = canvas.checkIns && canvas.checkIns.length > 0 ? canvas.checkIns[canvas.checkIns.length - 1] : null;

    const handleStartCheckIn = async () => {
        setIsStartingCheckIn(true);
        try {
            const chatHistory = conversation.messages
                .map(m => `${m.senderId === currentUser.id ? 'Me' : otherParticipant.name}: ${m.text || ''}`)
                .slice(-10)
                .join('\n');
            
            const question = await generateRelationshipCheckInPrompt(chatHistory);
            
            const newCheckIn: RelationshipCheckIn = {
                id: `checkin-${Date.now()}`,
                question,
                state: 'pending',
                responses: {},
            };

            onUpdateConversation({
                coupleCanvas: {
                    ...canvas,
                    checkIns: [...(canvas.checkIns || []), newCheckIn],
                }
            });

        } catch (error) {
            console.error("Failed to start check-in", error);
            setError("Could not start a check-in. Please try again.");
        } finally {
            setIsStartingCheckIn(false);
        }
    };

    const handleSubmitCheckInResponse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!latestCheckIn || !checkInResponse.trim()) return;

        const newResponses = { ...latestCheckIn.responses, [currentUser.id]: checkInResponse.trim() };
        
        const isCompleted = Object.keys(newResponses).length === 2;

        const updatedCheckIn: RelationshipCheckIn = {
            ...latestCheckIn,
            responses: newResponses,
            state: isCompleted ? 'completed' : 'pending',
        };

        const updatedCheckIns = (canvas.checkIns || []).map(ci => ci.id === updatedCheckIn.id ? updatedCheckIn : ci);

        onUpdateConversation({
            coupleCanvas: {
                ...canvas,
                checkIns: updatedCheckIns,
            }
        });
        setCheckInResponse('');
    };

    // Shared Values Logic
    const handleDiscoverValues = async () => {
        setIsDiscoveringValues(true);
        setError(null);
        try {
            const values = await generateSharedValues(currentUser, otherParticipant, conversation);
            onUpdateConversation({
                coupleCanvas: {
                    ...canvas!,
                    sharedValues: values,
                }
            });
        } catch (err) {
            console.error(err);
            setError("Sorry, the AI couldn't discover your shared values right now.");
        } finally {
            setIsDiscoveringValues(false);
        }
    };
    
    // Couple Quiz Logic
    const handleStartQuiz = async () => {
        setIsLoadingQuiz(true);
        setError(null);
        try {
            const questionsData = await generateCoupleQuizQuestions(currentUser, otherParticipant, conversation);
            const newQuiz: CoupleQuiz = {
                id: `quiz-${Date.now()}`,
                state: 'answering',
                initiatorId: currentUser.id,
                questions: questionsData.map(q => ({
                    ...q,
                    id: `q-${Math.random()}`,
                    responses: {},
                })),
                scores: {},
            };
            onUpdateConversation({
                coupleCanvas: {
                    ...canvas,
                    quizzes: [...(canvas.quizzes || []), newQuiz]
                }
            });
        } catch(err) {
            console.error("Failed to start quiz", err);
            setError("Sorry, the AI couldn't create a quiz right now. Please try again.");
        } finally {
            setIsLoadingQuiz(false);
        }
    };

    const handleAnswerQuiz = async (questionId: string, answer: string) => {
        if (!latestQuiz) return;
    
        const updatedQuestions = latestQuiz.questions.map(q => {
            if (q.id === questionId) {
                return { ...q, responses: { ...q.responses, [currentUser.id]: answer } };
            }
            return q;
        });
    
        const updatedQuiz: CoupleQuiz = { ...latestQuiz, questions: updatedQuestions };
    
        const participantIds = [currentUser.id, otherParticipant.id];
        const allQuestionsAnswered = updatedQuestions.every(q => 
            participantIds.every(pId => q.responses[pId])
        );
    
        if (allQuestionsAnswered) {
            // All answers are in, time to score and get commentary
            const scores: { [userId: number]: number } = { [currentUser.id]: 0, [otherParticipant.id]: 0 };
            updatedQuiz.questions.forEach(q => {
                participantIds.forEach(pId => {
                    if (q.responses[pId] === q.correctAnswer) {
                        scores[pId]++;
                    }
                });
            });
    
            updatedQuiz.state = 'completed';
            updatedQuiz.scores = scores;

            try {
                const commentary = await analyzeCoupleQuizResults(updatedQuiz, currentUser.name, otherParticipant.name, currentUser.id, otherParticipant.id);
                updatedQuiz.aiCommentary = commentary;
            } catch (error) {
                console.error("Failed to get quiz commentary", error);
                updatedQuiz.aiCommentary = "You both did great! It's clear you're building a strong connection.";
            }
        }
    
        onUpdateConversation({
            coupleCanvas: {
                ...canvas,
                quizzes: (canvas.quizzes || []).map(q => q.id === updatedQuiz.id ? updatedQuiz : q),
            }
        });
    };

    const handleStartJournalPrompt = async () => {
        setIsGeneratingPrompt(true);
        setError(null);
        try {
            const chatHistory = conversation.messages
                .map(m => `${m.senderId === currentUser.id ? 'Me' : otherParticipant.name}: ${m.text || ''}`)
                .slice(-15) // last 15 messages
                .join('\n');
            
            const promptText = await generateCoupleJournalPrompt(chatHistory);
            
            const newPrompt: CoupleJournalPrompt = {
                id: `journal-${Date.now()}`,
                prompt: promptText,
                state: 'writing',
                entries: {},
            };
    
            onUpdateConversation({
                coupleCanvas: {
                    ...canvas,
                    journalPrompts: [...(canvas.journalPrompts || []), newPrompt],
                }
            });
    
        } catch (err) {
            console.error("Failed to generate journal prompt", err);
            setError("Sorry, the AI couldn't generate a prompt right now. Please try again.");
        } finally {
            setIsGeneratingPrompt(false);
        }
    };
    
    const handleSaveJournalEntry = (promptId: string) => {
        if (!journalEntryText.trim()) return;
    
        const updatedPrompts = (canvas.journalPrompts || []).map(p => {
            if (p.id === promptId) {
                return {
                    ...p,
                    entries: {
                        ...p.entries,
                        [currentUser.id]: journalEntryText.trim(),
                    },
                };
            }
            return p;
        });
    
        onUpdateConversation({
            coupleCanvas: {
                ...canvas,
                journalPrompts: updatedPrompts,
            }
        });
    
        setJournalEntryText('');
    };

    useEffect(() => {
        if (latestJournalPrompt && latestJournalPrompt.state === 'writing' && Object.keys(latestJournalPrompt.entries).length === 2 && !latestJournalPrompt.aiInsight) {
            const analyze = async () => {
                setIsAnalyzingJournal(true);
                try {
                    const [userId1, userId2] = Object.keys(latestJournalPrompt.entries).map(Number);
                    const insight = await analyzeCoupleJournalEntries(
                        latestJournalPrompt.prompt,
                        latestJournalPrompt.entries[userId1],
                        latestJournalPrompt.entries[userId2]
                    );
                    
                    const updatedPrompts = (canvas!.journalPrompts || []).map(p => {
                        if (p.id === latestJournalPrompt.id) {
                            return { ...p, state: 'revealed' as const, aiInsight: insight };
                        }
                        return p;
                    });
    
                    onUpdateConversation({
                        coupleCanvas: {
                            ...canvas!,
                            journalPrompts: updatedPrompts,
                        }
                    });
    
                } catch (err) {
                    console.error("Failed to analyze journal entries", err);
                } finally {
                    setIsAnalyzingJournal(false);
                }
            };
            analyze();
        }
    }, [latestJournalPrompt, canvas, onUpdateConversation]);

    const handleGenerateLyrics = async () => {
        setIsGeneratingLyrics(true);
        setLyricsError(null);
        try {
            const lyrics = await generateOurSongLyrics(currentUser, otherParticipant, conversation);
            onUpdateConversation({
                coupleCanvas: {
                    ...canvas!,
                    ourSongLyrics: lyrics,
                }
            });
        } catch (err) {
            console.error(err);
            setLyricsError("Sorry, the AI muse is unavailable right now. Please try again.");
        } finally {
            setIsGeneratingLyrics(false);
        }
    };

    const handleGeneratePeaceKeeper = async () => {
        if (!whatIWantToSay.trim()) return;
        setIsGeneratingPeaceKeeper(true);
        setPeaceKeeperError(null);
        setPeaceKeeperReport(null);
        try {
            const report = await generatePeaceKeeperResponse(whatHappened, whatIWantToSay);
            setPeaceKeeperReport(report);
        } catch (err) {
            console.error(err);
            setPeaceKeeperError("Sorry, the AI couldn't generate a response. Please try again.");
        } finally {
            setIsGeneratingPeaceKeeper(false);
        }
    };

    const resetPeaceKeeper = () => {
        setPeaceKeeperReport(null);
        setWhatHappened('');
        setWhatIWantToSay('');
        setPeaceKeeperError(null);
    };

    const sortedBucketList = [...canvas.dateBucketList].sort((a, b) => b.votes.length - a.votes.length);

    return (
        <div className="p-6 h-full overflow-y-auto bg-cream/20">
             <div className="mb-6 border-b border-slate-300">
                <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Couple Canvas Tabs">
                    <CanvasTabButton isActive={canvasTab === 'bucketList'} onClick={() => setCanvasTab('bucketList')} icon={<ClipboardCheckIcon className="w-5 h-5"/>}>Bucket List</CanvasTabButton>
                    <CanvasTabButton isActive={canvasTab === 'goals'} onClick={() => setCanvasTab('goals')} icon={<FlagIcon className="w-5 h-5"/>}>Goals</CanvasTabButton>
                    <CanvasTabButton isActive={canvasTab === 'dreamDate'} onClick={() => setCanvasTab('dreamDate')} icon={<PhotographIcon className="w-5 h-5"/>}>Dream Date</CanvasTabButton>
                    <CanvasTabButton isActive={canvasTab === 'checkIn'} onClick={() => setCanvasTab('checkIn')} icon={<UsersIcon className="w-5 h-5"/>}>Check-in</CanvasTabButton>
                    <CanvasTabButton isActive={canvasTab === 'values'} onClick={() => setCanvasTab('values')} icon={<HeartIcon className="w-5 h-5"/>}>Values</CanvasTabButton>
                    <CanvasTabButton isActive={canvasTab === 'quiz'} onClick={() => setCanvasTab('quiz')} icon={<PuzzlePieceIcon className="w-5 h-5"/>}>Quiz</CanvasTabButton>
                    <CanvasTabButton isActive={canvasTab === 'journal'} onClick={() => setCanvasTab('journal')} icon={<BookHeartIcon className="w-5 h-5"/>}>Journal</CanvasTabButton>
                    <CanvasTabButton isActive={canvasTab === 'song'} onClick={() => setCanvasTab('song')} icon={<SparklesIcon className="w-5 h-5"/>}>Our Song</CanvasTabButton>
                    <CanvasTabButton isActive={canvasTab === 'peaceKeeper'} onClick={() => setCanvasTab('peaceKeeper')} icon={<PuzzlePieceIcon className="w-5 h-5"/>}>Peace Keeper</CanvasTabButton>
                </nav>
            </div>

            {canvasTab === 'bucketList' && (
                <div>
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold font-serif text-deep-teal">Date Bucket List</h2>
                        <p className="text-slate-500 mt-1">A shared list of date ideas for you and {otherParticipant.name}.</p>
                    </div>
                    
                    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                        <h3 className="font-semibold text-deep-teal mb-3">Add your own idea</h3>
                        <form onSubmit={handleAddUserIdea} className="flex gap-2">
                            <input 
                                type="text"
                                value={newUserIdea}
                                onChange={e => setNewUserIdea(e.target.value)}
                                placeholder="e.g., Go stargazing"
                                className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent"
                                disabled={isAddingIdea}
                            />
                            <Button type="submit" disabled={!newUserIdea.trim() || isAddingIdea} className="!px-4">
                                {isAddingIdea ? 'Adding...' : 'Add'}
                            </Button>
                        </form>
                    </div>
                    
                    <div className="flex justify-center mb-6">
                        <Button 
                            variant="secondary"
                            onClick={handleGetSuggestions}
                            disabled={isLoadingSuggestions}
                            leftIcon={<SparklesIcon />}
                        >
                            {isLoadingSuggestions ? 'Thinking...' : 'Get AI Suggestions'}
                        </Button>
                    </div>
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    
                    <div className="space-y-4">
                        {sortedBucketList.length > 0 ? (
                            sortedBucketList.map(item => 
                                <BucketListItem 
                                    key={item.id} 
                                    item={item} 
                                    onVote={handleVote} 
                                    onPlan={handlePlanDate}
                                    onClearPlan={handleClearPlan}
                                    currentUserId={currentUser.id} 
                                    otherParticipantName={otherParticipant.name}
                                    isPlanning={planningItemId === item.id}
                                />
                            )
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-slate-500">Your bucket list is empty. Add an idea or get some AI suggestions to start!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {canvasTab === 'goals' && (
                <div>
                    <div className="text-center mb-6">
                       <h2 className="text-3xl font-bold font-serif text-deep-teal flex items-center justify-center gap-2">
                           <FlagIcon className="w-7 h-7" />
                           Our Shared Goals
                       </h2>
                       <p className="text-slate-500 mt-1">Work together to achieve your couple goals and celebrate your wins!</p>
                   </div>
                   <CoupleGoalsTracker
                       goals={canvas.coupleGoals || []}
                       onUpdateGoals={handleUpdateGoals}
                       currentUser={currentUser}
                       otherParticipant={otherParticipant}
                       conversation={conversation}
                   />
                </div>
            )}
            
            {canvasTab === 'dreamDate' && (
                <div>
                  <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold font-serif text-deep-teal flex items-center justify-center gap-2">
                      <PhotographIcon className="w-7 h-7" />
                      Dream Date Illustrator
                    </h2>
                    <p className="text-slate-500 mt-1">Collaboratively create an image of your perfect date.</p>
                  </div>

                  <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 space-y-4">
                    <div>
                        <h4 className="font-semibold text-deep-teal mb-2">The Prompt So Far:</h4>
                        {fragments.length > 0 ? (
                            <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                                {fragments.map((fragment, index) => (
                                    <p key={index} className="text-sm text-slate-700">
                                        <span className="font-bold">{fragment.userId === currentUser.id ? 'You' : otherParticipant.name}:</span> {fragment.text}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg">The canvas is blank! Add the first part of your dream date idea below.</p>
                        )}
                    </div>
                    
                    <form onSubmit={handleAddFragment} className="space-y-2">
                        <textarea
                            value={promptFragment}
                            onChange={e => setPromptFragment(e.target.value)}
                            placeholder="Add your idea... e.g., 'and there's a puppy!'"
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                            rows={2}
                            disabled={isGenerating}
                        />
                        <div className="text-right">
                            <Button type="submit" disabled={isGenerating || !promptFragment.trim()} className="!py-1.5 !px-3 !text-sm">Add to prompt</Button>
                        </div>
                    </form>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                        <Button variant="ghost" onClick={handleClearDreamDate} disabled={isGenerating}>Clear All</Button>
                        <Button onClick={handleGenerateImage} disabled={isGenerating || !combinedPrompt} leftIcon={<SparklesIcon />}>
                            {isGenerating ? 'Generating...' : 'Generate Image'}
                        </Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    {isGenerating ? (
                      <div className="w-full aspect-video bg-slate-200 rounded-lg animate-pulse flex flex-col items-center justify-center">
                        <SparklesIcon className="w-12 h-12 text-rose-gold/50" />
                        <p className="mt-2 text-deep-teal/60">AI is illustrating...</p>
                      </div>
                    ) : generationError ? (
                      <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg">
                        <p>{generationError}</p>
                      </div>
                    ) : canvas.dreamDateImage ? (
                      <div className="relative group">
                        <img
                          src={`data:image/jpeg;base64,${canvas.dreamDateImage}`}
                          alt="AI Generated Dream Date"
                          className="w-full aspect-video object-contain rounded-lg shadow-md bg-slate-100"
                        />
                        <button 
                            onClick={handleClearDreamDate}
                            className="absolute top-2 right-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Clear image"
                        >
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                        <p className="text-slate-500">Your generated image will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
            )}
            
            {canvasTab === 'checkIn' && (
                <div>
                  <div className="text-center mb-4">
                    <h2 className="text-3xl font-bold font-serif text-deep-teal flex items-center justify-center gap-2">
                      <UsersIcon className="w-7 h-7" />
                      Relationship Check-in
                    </h2>
                    <p className="text-slate-500 mt-1">A private space to share and connect on a deeper level.</p>
                  </div>
                  
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                    {(!latestCheckIn || latestCheckIn.state === 'completed') && (
                      <div className="text-center p-4">
                        <p className="text-slate-600 mb-4">Start a new check-in to connect with {otherParticipant.name}.</p>
                        <Button onClick={handleStartCheckIn} disabled={isStartingCheckIn} leftIcon={<SparklesIcon />}>
                          {isStartingCheckIn ? 'Generating Question...' : 'Start New Check-in'}
                        </Button>
                      </div>
                    )}

                    {latestCheckIn && latestCheckIn.state === 'pending' && (
                      <div>
                        <div className="p-4 bg-cream rounded-lg text-center mb-4">
                          <p className="font-semibold text-deep-teal text-lg">"{latestCheckIn.question}"</p>
                        </div>
                        
                        {latestCheckIn.responses[currentUser.id] ? (
                          <div className="text-center p-6 bg-slate-50 rounded-lg">
                            <p className="font-semibold text-green-700">Your answer is submitted! ✅</p>
                            <p className="text-slate-500 mt-1">Waiting for {otherParticipant.name} to respond...</p>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmitCheckInResponse}>
                            <label htmlFor="checkInResponse" className="font-semibold text-deep-teal mb-2 block">Your private answer:</label>
                            <textarea
                              id="checkInResponse"
                              value={checkInResponse}
                              onChange={e => setCheckInResponse(e.target.value)}
                              placeholder="Write your thoughts here... your answer will be revealed to both of you at the same time."
                              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                              rows={4}
                            />
                            <div className="text-right mt-2">
                              <Button type="submit" disabled={!checkInResponse.trim()}>Submit</Button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {latestCheckIn && latestCheckIn.state === 'completed' && (
                      <div>
                        <div className="p-4 bg-cream rounded-lg text-center mb-4">
                          <p className="font-semibold text-deep-teal text-lg">"{latestCheckIn.question}"</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-lg">
                            <h4 className="font-bold text-deep-teal mb-2">Your Answer</h4>
                            <p className="text-slate-700 italic">"{latestCheckIn.responses[currentUser.id]}"</p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-lg">
                            <h4 className="font-bold text-deep-teal mb-2">{otherParticipant.name}'s Answer</h4>
                            <p className="text-slate-700 italic">"{latestCheckIn.responses[otherParticipant.id]}"</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
            )}

            {canvasTab === 'values' && (
                <div>
                    <div className="text-center mb-4">
                        <h2 className="text-3xl font-bold font-serif text-deep-teal flex items-center justify-center gap-2">
                        <UsersIcon className="w-7 h-7" />
                        Our Shared Values
                        </h2>
                        <p className="text-slate-500 mt-1">Discover the core values that bring you together.</p>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                        {canvas?.sharedValues && canvas.sharedValues.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {canvas.sharedValues.map((value, index) => (
                            <div key={index} className="bg-cream/50 p-4 rounded-lg">
                                <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">{value.emoji}</span>
                                <h4 className="font-bold text-xl text-deep-teal">{value.value}</h4>
                                </div>
                                <p className="text-sm text-slate-600">{value.reasoning}</p>
                            </div>
                            ))}
                        </div>
                        ) : (
                        <div className="text-center p-6">
                            {isDiscoveringValues ? (
                                <div className="flex flex-col items-center justify-center text-center p-4">
                                    <SparklesIcon className="w-12 h-12 text-rose-gold animate-pulse" />
                                    <p className="mt-3 text-lg font-semibold text-deep-teal">Discovering values...</p>
                                </div>
                            ) : canDiscoverValues ? (
                                <>
                                    <p className="text-slate-600 mb-4">You've built a strong connection! Let our AI analyze your chat and profiles to find your shared values.</p>
                                    <Button onClick={handleDiscoverValues} disabled={isDiscoveringValues} leftIcon={<SparklesIcon />}>
                                        {isDiscoveringValues ? 'Discovering...' : 'Discover Our Values'}
                                    </Button>
                                </>
                            ) : (
                                <div>
                                    <p className="text-slate-500 mb-2">Keep chatting to unlock this feature! </p>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-xs mx-auto">
                                        <div 
                                            className="bg-rose-gold h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${(userMessagesCount / VALUES_UNLOCK_THRESHOLD) * 100}%` }}
                                        ></div>
                                    </div>
                                        <p className="text-sm text-slate-500 mt-1">({userMessagesCount}/{VALUES_UNLOCK_THRESHOLD} messages)</p>
                                </div>
                            )}
                        </div>
                        )}
                    </div>
                </div>
            )}
            {canvasTab === 'quiz' && (
                 <div>
                    <div className="text-center mb-4">
                        <h2 className="text-3xl font-bold font-serif text-deep-teal flex items-center justify-center gap-2">
                            <PuzzlePieceIcon className="w-7 h-7" />
                            Couple Quiz
                        </h2>
                        <p className="text-slate-500 mt-1">Test how well you know each other!</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 min-h-[200px] flex items-center justify-center">
                        {!canStartQuiz ? (
                            <div>
                                <p className="text-slate-500 mb-2">Keep chatting to unlock the Couple Quiz!</p>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-xs mx-auto">
                                    <div className="bg-rose-gold h-2.5 rounded-full transition-all duration-500" style={{ width: `${(userMessagesCount / QUIZ_UNLOCK_THRESHOLD) * 100}%` }}></div>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">({userMessagesCount}/{QUIZ_UNLOCK_THRESHOLD} messages)</p>
                            </div>
                        ) : isLoadingQuiz ? (
                            <div className="flex flex-col items-center justify-center text-center p-4">
                                <SparklesIcon className="w-12 h-12 text-rose-gold animate-pulse" />
                                <p className="mt-3 text-lg font-semibold text-deep-teal">AI is creating your quiz...</p>
                            </div>
                        ) : !latestQuiz || latestQuiz.state === 'completed' ? (
                            <div className="text-center">
                                {latestQuiz && <p className="text-slate-600 mb-4">You've completed a quiz! Want to try another?</p>}
                                <Button onClick={handleStartQuiz} leftIcon={<SparklesIcon />}>Start a Fun Quiz</Button>
                            </div>
                        ) : (
                        <CoupleQuizCard 
                            quiz={latestQuiz} 
                            currentUser={currentUser} 
                            otherParticipant={otherParticipant} 
                            onAnswer={handleAnswerQuiz} 
                        />
                        )}
                    </div>
                </div>
            )}
            {canvasTab === 'journal' && (
                <div>
                    <div className="text-center mb-4">
                        <h2 className="text-3xl font-bold font-serif text-deep-teal flex items-center justify-center gap-2">
                            <BookHeartIcon className="w-7 h-7" />
                            Couple's Journal
                        </h2>
                        <p className="text-slate-500 mt-1">Reflect on your connection together with shared prompts.</p>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                        {!latestJournalPrompt || latestJournalPrompt.state === 'revealed' ? (
                            <div className="text-center p-4">
                                {latestJournalPrompt && latestJournalPrompt.state === 'revealed' && (
                                    <div className="mb-6 pb-6 border-b border-slate-200">
                                        <div className="p-4 bg-cream rounded-lg text-center mb-4">
                                            <p className="font-semibold text-deep-teal text-lg">"{latestJournalPrompt.prompt}"</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-lg">
                                                <h4 className="font-bold text-deep-teal mb-2">Your Entry</h4>
                                                <p className="text-slate-700 whitespace-pre-wrap italic">"{latestJournalPrompt.entries[currentUser.id]}"</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg">
                                                <h4 className="font-bold text-deep-teal mb-2">{otherParticipant.name}'s Entry</h4>
                                                <p className="text-slate-700 whitespace-pre-wrap italic">"{latestJournalPrompt.entries[otherParticipant.id]}"</p>
                                            </div>
                                        </div>
                                        {isAnalyzingJournal ? (
                                            <div className="mt-4 flex items-center justify-center gap-2 text-deep-teal">
                                                <SparklesIcon className="w-5 h-5 animate-pulse"/>
                                                <p>AI is generating your insight...</p>
                                            </div>
                                        ) : latestJournalPrompt.aiInsight && (
                                            <div className="mt-4 p-4 bg-rose-gold/10 rounded-lg border-l-4 border-rose-gold">
                                                <h4 className="font-bold text-deep-teal mb-2 flex items-center gap-2"><SparklesIcon className="w-5 h-5"/> Connection Insight</h4>
                                                <p className="text-slate-800 italic">"{latestJournalPrompt.aiInsight}"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <Button onClick={handleStartJournalPrompt} disabled={isGeneratingPrompt} leftIcon={<SparklesIcon />}>
                                    {isGeneratingPrompt ? 'Generating Prompt...' : 'Start a New Journal Entry'}
                                </Button>
                            </div>
                        ) : ( // state is 'writing'
                            <div>
                                <div className="p-4 bg-cream rounded-lg text-center mb-4">
                                    <p className="font-semibold text-deep-teal text-lg">"{latestJournalPrompt.prompt}"</p>
                                </div>
                                
                                {latestJournalPrompt.entries[currentUser.id] ? (
                                    <div className="text-center p-6 bg-slate-50 rounded-lg">
                                        <p className="font-semibold text-green-700">Your entry is saved! ✅</p>
                                        <p className="text-slate-500 mt-1">Waiting for {otherParticipant.name} to write theirs...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => { e.preventDefault(); handleSaveJournalEntry(latestJournalPrompt!.id); }}>
                                        <label htmlFor="journalEntry" className="font-semibold text-deep-teal mb-2 block">Your private entry:</label>
                                        <textarea
                                            id="journalEntry"
                                            value={journalEntryText}
                                            onChange={e => setJournalEntryText(e.target.value)}
                                            placeholder="Write your thoughts here..."
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                            rows={5}
                                        />
                                        <div className="text-right mt-2">
                                            <Button type="submit" disabled={!journalEntryText.trim()}>Save Entry</Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {canvasTab === 'song' && (
                <div>
                    <div className="text-center mb-4">
                        <h2 className="text-3xl font-bold font-serif text-deep-teal flex items-center justify-center gap-2">
                            <BookHeartIcon className="w-7 h-7" />
                            Our Song
                        </h2>
                        <p className="text-slate-500 mt-1">Generate lyrics for your very own song based on your connection.</p>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                        {canvas?.ourSongLyrics ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-cream rounded-lg overflow-y-auto">
                                    <h3 className="text-xl font-bold font-serif text-deep-teal text-center mb-4">"Our Song"</h3>
                                    <p className="text-slate-700 whitespace-pre-wrap font-mono text-sm leading-relaxed">{canvas.ourSongLyrics}</p>
                                </div>
                                <div className="text-center">
                                    <Button onClick={handleGenerateLyrics} disabled={isGeneratingLyrics} leftIcon={<SparklesIcon />}>
                                        {isGeneratingLyrics ? 'Regenerating...' : 'Regenerate Lyrics'}
                                    </Button>
                                </div>
                            </div>
                        ) : isGeneratingLyrics ? (
                            <div className="flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
                                <SparklesIcon className="w-12 h-12 text-rose-gold animate-pulse" />
                                <p className="mt-4 text-lg font-semibold text-deep-teal">The AI is writing your song...</p>
                            </div>
                        ) : lyricsError ? (
                            <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                                <p>{lyricsError}</p>
                                <Button onClick={handleGenerateLyrics} variant="secondary" className="mt-4">Try Again</Button>
                            </div>
                        ) : (
                            <div className="text-center p-8">
                                <p className="text-slate-600 mb-4">Let our AI songwriter create a unique song just for you, inspired by your conversations and memories.</p>
                                <Button onClick={handleGenerateLyrics} leftIcon={<SparklesIcon />}>
                                    Generate Our Song Lyrics
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {canvasTab === 'peaceKeeper' && (
                <div>
                    <div className="text-center mb-4">
                        <h2 className="text-3xl font-bold font-serif text-deep-teal flex items-center justify-center gap-2">
                            <PuzzlePieceIcon className="w-7 h-7" />
                            Peace Keeper
                        </h2>
                        <p className="text-slate-500 mt-1">Navigate disagreements constructively with AI's help.</p>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                        {isGeneratingPeaceKeeper ? (
                            <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
                                <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                                <p className="mt-4 text-xl font-semibold text-deep-teal">Finding the right words...</p>
                            </div>
                        ) : peaceKeeperError ? (
                            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">
                                <p className="font-bold">An Error Occurred</p>
                                <p>{peaceKeeperError}</p>
                                <Button variant="secondary" onClick={resetPeaceKeeper} className="mt-4">Try Again</Button>
                            </div>
                        ) : peaceKeeperReport ? (
                            <div className="space-y-5">
                                <ResultCard icon={<ChatBubbleBottomCenterTextIcon className="w-6 h-6" />} title="A Gentler Way to Say It">
                                    <p className="italic font-semibold">"{peaceKeeperReport.reframedMessage}"</p>
                                </ResultCard>
                                <ResultCard icon={<LightBulbIcon className="w-6 h-6" />} title="Talking Points">
                                    <ul className="list-disc list-inside space-y-1">
                                        {peaceKeeperReport.talkingPoints.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </ResultCard>
                                <ResultCard icon={<UsersIcon className="w-6 h-6" />} title="Your Partner's Perspective">
                                    <p>{peaceKeeperReport.partnerPerspective}</p>
                                </ResultCard>
                                <div className="text-center pt-4">
                                    <Button variant="secondary" onClick={resetPeaceKeeper}>Start Over</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-slate-600">Feeling misunderstood or in the middle of a disagreement? Describe the situation, and let our AI help you find a calmer, more constructive way to communicate.</p>
                                <div>
                                    <label htmlFor="whatHappened" className="block text-sm font-semibold text-slate-700 mb-1">What happened? (Optional)</label>
                                    <textarea
                                        id="whatHappened"
                                        value={whatHappened}
                                        onChange={(e) => setWhatHappened(e.target.value)}
                                        placeholder="e.g., My partner said they would do the dishes but didn't."
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="whatIWantToSay" className="block text-sm font-semibold text-slate-700 mb-1">What do you want to say?</label>
                                    <textarea
                                        id="whatIWantToSay"
                                        value={whatIWantToSay}
                                        onChange={(e) => setWhatIWantToSay(e.target.value)}
                                        placeholder="e.g., You never help around the house and it's so frustrating!"
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                        rows={4}
                                    />
                                </div>
                                <div className="text-right">
                                    <Button onClick={handleGeneratePeaceKeeper} disabled={!whatIWantToSay.trim()} leftIcon={<SparklesIcon />}>
                                        Get AI Advice
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    )
};

const CoupleQuizCard: React.FC<{
    quiz: CoupleQuiz;
    currentUser: UserProfile;
    otherParticipant: UserProfile;
    onAnswer: (questionId: string, answer: string) => void;
}> = ({ quiz, currentUser, otherParticipant, onAnswer }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const question = quiz.questions[currentQuestionIndex];
    const myAnswer = question.responses[currentUser.id];
    const theirAnswer = question.responses[otherParticipant.id];
    
    // Shuffle options once per question
    const shuffledOptions = useMemo(() => 
        [...question.options].sort(() => Math.random() - 0.5), 
        [question.id]
    );

    const handleNextQuestion = () => {
        if(currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };
    
    if (quiz.state === 'completed') {
        const myScore = quiz.scores[currentUser.id];
        const theirScore = quiz.scores[otherParticipant.id];
        const total = quiz.questions.length;
        
        return (
            <div className="w-full text-center">
                <h3 className="text-xl font-bold font-serif text-deep-teal">Quiz Complete!</h3>
                <div className="flex justify-around items-center my-4">
                    <div className="p-4 rounded-lg bg-cream">
                        <p className="font-semibold">{currentUser.name}</p>
                        <p className="text-2xl font-bold text-rose-gold">{myScore}/{total}</p>
                    </div>
                     <div className="p-4 rounded-lg bg-cream">
                        <p className="font-semibold">{otherParticipant.name}</p>
                        <p className="text-2xl font-bold text-rose-gold">{theirScore}/{total}</p>
                    </div>
                </div>
                {quiz.aiCommentary && <p className="text-slate-700 italic">🤖 {quiz.aiCommentary}</p>}
            </div>
        );
    }
    
    return (
        <div className="w-full">
            <p className="text-center text-sm font-semibold text-slate-500 mb-2">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
            <h4 className="font-semibold text-lg text-deep-teal text-center mb-4">{question.question}</h4>

            {myAnswer ? (
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="font-semibold text-green-700">Your answer is in! ✅</p>
                    {!theirAnswer && <p className="text-slate-500 mt-1">Waiting for {otherParticipant.name}...</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-2">
                    {shuffledOptions.map(option => (
                        <Button key={option} variant="secondary" onClick={() => onAnswer(question.id, option)} className="w-full justify-start !rounded-lg !font-normal">
                            {option}
                        </Button>
                    ))}
                </div>
            )}
            
            {myAnswer && theirAnswer && currentQuestionIndex < quiz.questions.length - 1 && (
                 <div className="mt-4 text-center">
                    <Button onClick={handleNextQuestion}>Next Question</Button>
                </div>
            )}
        </div>
    );
};
