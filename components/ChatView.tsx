import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Conversation, UserProfile, Message, LiveCoachingTip, ProactiveDateSuggestion, BlindDateRevealReport, VibeCheck, TwoTruthsGame, ConnectionCrest, ConversationVibe as ConversationVibeType } from '../types';
import { Button } from './Button';
import { ArrowLeftIcon, PaperAirplaneIcon, SparklesIcon, ChatBubbleLeftRightIcon, PencilIcon, CloseIcon, LightBulbIcon, MicrophoneIcon, StopIcon, TrashIcon, BrainCircuitIcon, ExclamationTriangleIcon, CalendarDaysIcon, QuestionMarkCircleIcon, PuzzlePieceIcon, TrophyIcon, PaintBrushIcon, VideoCameraIcon } from './IconComponents';
import { generateChatReply, rewriteMessage, generateReplyFromAudio, analyzeMessageForSafety, getLiveChatCoachingTip, getProactiveDateSuggestion, generateBlindDateRevealReport, getTwoTruthsAICommentary, generateConnectionCrest, analyzeConversationVibe } from '../services/geminiService';
import { DateIdeaModal } from './DateIdeaModal';
import { ChatAnalysisModal } from './ChatAnalysisModal';
import { ToggleSwitch } from './ToggleSwitch';
import VoiceVisualizer from './VoiceVisualizer';
import { BlindDateRevealCard } from './BlindDateRevealCard';
import { VibeCheckCard } from './VibeCheckCard';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useVibeCheck } from '../hooks/useVibeCheck';
import { StartTwoTruthsModal } from './StartTwoTruthsModal';
import { TwoTruthsAndALieCard } from './TwoTruthsAndALieCard';
import { ConnectionCrestComponent } from './ConnectionCrest';
import { SharedMemoriesModal } from './SharedMemoriesModal';
import { ConversationVibe } from './ConversationVibe';
import { CoupleCanvasView } from './CoupleCanvasView';
import { VideoCallReportCard } from './VideoCallReportCard';

interface ChatViewProps {
    conversations: Conversation[];
    currentUser: UserProfile;
    allProfiles: UserProfile[];
    activeConversationId: string | null;
    onSelectConversation: (id: string | null) => void;
    onSendMessage: (conversationId: string, message: Omit<Message, 'timestamp'>) => void;
    onUpdateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
    onStartCall: (conversation: Conversation) => void;
}

const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ConversationListItem: React.FC<{
    conversation: Conversation;
    otherParticipant: UserProfile;
    isActive: boolean;
    hasUnread: boolean;
    onClick: () => void;
}> = ({ conversation, otherParticipant, isActive, hasUnread, onClick }) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const itemClasses = `w-full flex items-center p-3 space-x-3 rounded-lg cursor-pointer transition-colors duration-200 ${isActive ? 'bg-rose-gold/10' : 'hover:bg-slate-100'}`;
    
    const isBlindDateActive = conversation.isBlindDate && conversation.blindDateState === 'active';
    const displayName = isBlindDateActive ? "Mystery Match" : otherParticipant.name;
    const displayPicture = isBlindDateActive ? 'https://i.imgur.com/8soO3a2.png' : otherParticipant.profilePicture;

    let lastMessageText = lastMessage?.text || '...';
    if (lastMessage?.audioUrl) lastMessageText = '🎤 Audio Message';
    if (lastMessage?.imageUrl) lastMessageText = '🎨 Shared a comic!';


    return (
        <div onClick={onClick} className={itemClasses} role="button" aria-pressed={isActive}>
            <img src={displayPicture} alt={displayName} className={`w-12 h-12 rounded-full object-cover ${isBlindDateActive ? 'filter blur-sm' : ''}`} />
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-deep-teal truncate">{displayName}</h3>
                    <div className="flex items-center gap-2">
                        {hasUnread && <div className="w-2.5 h-2.5 bg-rose-gold rounded-full flex-shrink-0"></div>}
                        {lastMessage && <p className="text-xs text-slate-400">{formatTime(lastMessage.timestamp)}</p>}
                    </div>
                </div>
                {lastMessage && <p className="text-sm text-slate-500 truncate">{lastMessageText}</p>}
            </div>
        </div>
    );
}

const ChatMessage: React.FC<{ message: Message; isCurrentUser: boolean; isSafeMode: boolean; onSendIcebreaker: (text: string) => void; }> = ({ message, isCurrentUser, isSafeMode, onSendIcebreaker }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    const shouldHide = isSafeMode && message.isFlagged && !isVisible && !isCurrentUser;

    if (message.senderId === 0) { // AI-sent message styling
      if (message.revealReport) {
        return <BlindDateRevealCard report={message.revealReport} onSendIcebreaker={onSendIcebreaker} />
      }
      return (
        <div className="text-center my-4">
            <div className="inline-block p-3 bg-cream border border-dusty-rose/50 text-deep-teal rounded-lg text-sm max-w-md mx-auto shadow-sm">
                <p>🤖 <span className="font-bold">From SoulMate AI:</span> {message.text}</p>
            </div>
        </div>
      )
    }

    const bubbleClasses = isCurrentUser ? 'bg-rose-gold text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none';
    const containerClasses = `flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`;

    if (shouldHide) {
        return (
            <div className={containerClasses}>
                <div className="max-w-md p-4 rounded-xl bg-yellow-100 border border-yellow-300 text-yellow-800">
                    <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold">Potentially Unsafe Message</h4>
                            <p className="text-sm mt-1">{message.flaggedReason}</p>
                            <button onClick={() => setIsVisible(true)} className="mt-2 text-sm font-semibold text-yellow-900 hover:underline focus:outline-none">
                                Show message anyway
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const bubbleContent = (
        <div className={`max-w-md rounded-xl ${bubbleClasses} ${message.imageUrl ? 'p-1' : 'p-3'}`}>
            {message.imageUrl && (
                <img src={message.imageUrl} alt="Shared content" className="rounded-lg max-w-xs md:max-w-sm" />
            )}
            {message.text && <p className={`whitespace-pre-wrap ${message.imageUrl ? 'pt-2 px-2' : ''}`}>{message.text}</p>}
            {message.audioUrl && (
                <audio controls src={message.audioUrl} className="w-full max-w-xs h-10 p-2"></audio>
            )}
        </div>
    );

    const timeStampContent = <span className="text-xs text-slate-400 mb-1 flex-shrink-0">{formatTime(message.timestamp)}</span>;

    return (
        <div className={containerClasses}>
            {bubbleContent}
            {timeStampContent}
        </div>
    );
}

type ChatInputActionState =
  | { name: 'idle' }
  | { name: 'loadingSuggestions' }
  | { name: 'rewriting' }
  | { name: 'generatingFromAudio' };

type PopoverState =
  | { name: 'closed' }
  | { name: 'magicMenu' }
  | { name: 'ghostwriter' }
  | { name: 'liveCoachTip' };

const ChatWindow: React.FC<{
    conversation: Conversation;
    currentUser: UserProfile;
    otherParticipant: UserProfile;
    onSendMessage: (message: Omit<Message, 'timestamp'>) => void;
    onUpdateConversation: (updates: Partial<Conversation>) => void;
    onBack: () => void;
    onStartCall: (conversation: Conversation) => void;
}> = ({ conversation, currentUser, otherParticipant, onSendMessage, onUpdateConversation, onBack, onStartCall }) => {
    const [newMessage, setNewMessage] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isDateIdeaModalOpen, setIsDateIdeaModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [isMemoriesModalOpen, setIsMemoriesModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Refactored state for input actions
    const [inputActionState, setInputActionState] = useState<ChatInputActionState>({ name: 'idle' });

    // Proactive Date Suggestion state
    const [dateSuggestion, setDateSuggestion] = useState<ProactiveDateSuggestion | null>(null);
    const [isSuggestionDismissed, setIsSuggestionDismissed] = useState(false);
    const [isCheckingSuggestion, setIsCheckingSuggestion] = useState(false);

    // Live Coach State
    const [coachingTip, setCoachingTip] = useState<LiveCoachingTip | null>(null);
    const [isFetchingTip, setIsFetchingTip] = useState(false);
    const [hasNewTip, setHasNewTip] = useState(false);
    const [lastTipMessageCount, setLastTipMessageCount] = useState(0);

    // Advanced Ghostwriter State
    const [rewriteTone, setRewriteTone] = useState('');
    
    // Popover State (Refactored)
    const [activePopover, setActivePopover] = useState<PopoverState>({ name: 'closed' });
    
    // Voice Memo State (using hook)
    const {
        isRecording,
        mediaStream,
        recordedAudioUrl,
        recordedAudioBlob,
        startRecording,
        stopRecording,
        deleteRecording: handleDeleteRecording,
    } = useAudioRecorder();

    // Blind Date Reveal State
    const [isRevealing, setIsRevealing] = useState(false);
    const [isGeneratingCrest, setIsGeneratingCrest] = useState(false);

    // 2 Truths & a Lie Game State
    const [isTwoTruthsModalOpen, setIsTwoTruthsModalOpen] = useState(false);

    // Conversation Vibe State
    const [vibe, setVibe] = useState<ConversationVibeType | null>(null);
    const [isFetchingVibe, setIsFetchingVibe] = useState(false);
    const vibeFetchTimer = useRef<number | null>(null);

    // Couple's Canvas state
    const [activeTab, setActiveTab] = useState<'chat' | 'canvas'>('chat');
    const UNLOCK_THRESHOLD = 20;


    // Refs for popovers
    const magicMenuRef = useRef<HTMLDivElement>(null);
    const magicButtonRef = useRef<HTMLButtonElement>(null);
    const tipPopoverRef = useRef<HTMLDivElement>(null);
    const tipButtonRef = useRef<HTMLButtonElement>(null);
    const ghostwriterRef = useRef<HTMLDivElement>(null);

    const isBlindDateActive = conversation.isBlindDate && conversation.blindDateState === 'active';
    
    const handleSendSystemMessage = (messageContent: { text: string; revealReport?: BlindDateRevealReport; }) => {
        const message: Omit<Message, 'timestamp'> = {
            ...messageContent,
            senderId: 0 // AI/System sender
        };
        onSendMessage(message);
    };

    // Vibe Check hook
    const {
        isVibeCheckLoading,
        isVibeCheckAnalyzing,
        initiateVibeCheck,
        submitVibeCheckAnswer,
    } = useVibeCheck({
        conversation,
        currentUser,
        onUpdateConversation,
        onSendSystemMessage: (msg) => handleSendSystemMessage({ text: msg.text }),
    });


    const handleSendUserMessage = async (messageContent: { text?: string; audioUrl?: string; imageUrl?: string }) => {
        const message: Omit<Message, 'timestamp'> = {
            ...messageContent,
            senderId: currentUser.id
        };
    
        if (conversation.isSafeModeEnabled && message.text) {
            try {
                const safetyReport = await analyzeMessageForSafety(message.text);
                if (!safetyReport.isSafe) {
                    message.isFlagged = true;
                    message.flaggedReason = safetyReport.reason;
                }
            } catch (error) {
                console.error("Safety analysis failed, sending message as safe by default.", error);
            }
        }
    
        onSendMessage(message);
    
        // Reset UI for user messages
        setNewMessage('');
        setSuggestions([]);
        setActivePopover({ name: 'closed' });
        handleDeleteRecording();
    };


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation.messages, conversation.twoTruthsGame, conversation.connectionCrest, activeTab, conversation.lastVideoCallReport]);

    // Couple's Canvas Unlock Effect
    useEffect(() => {
        const userMessagesCount = conversation.messages.filter(m => m.senderId !== 0).length;
        const isUnlocked = conversation.coupleCanvas && conversation.coupleCanvas.unlocked;

        if (userMessagesCount >= UNLOCK_THRESHOLD && !isUnlocked) {
            onSendMessage({
                senderId: 0,
                text: "You've built a great connection! You've unlocked the Couple's Canvas, a shared space to plan your future adventures together. Check it out in the new tab!"
            });
            onUpdateConversation({
                coupleCanvas: { 
                    ...(conversation.coupleCanvas || {}),
                    unlocked: true, 
                    dateBucketList: conversation.coupleCanvas?.dateBucketList || [] 
                }
            });
        }
    }, [conversation.messages, conversation.coupleCanvas, onUpdateConversation, onSendMessage]);
    
    // Connection Crest Generation
    useEffect(() => {
        const shouldGenerateCrest = conversation.messages.length > 20 && !conversation.connectionCrest && !isGeneratingCrest && !isBlindDateActive;

        if (shouldGenerateCrest) {
            const generateCrest = async () => {
                setIsGeneratingCrest(true);
                try {
                    const crest = await generateConnectionCrest(currentUser, otherParticipant, conversation);
                    onUpdateConversation({ connectionCrest: crest });
                } catch (error) {
                    console.error("Failed to generate Connection Crest:", error);
                    // Silently fail, don't show an error to the user
                } finally {
                    setIsGeneratingCrest(false);
                }
            };
            generateCrest();
        }
    }, [conversation, currentUser, otherParticipant, isGeneratingCrest, onUpdateConversation, isBlindDateActive]);


    // Live Coach Tip Fetching Effect
    useEffect(() => {
        const messageCount = conversation.messages.length;
        if (isFetchingTip) return;

        const shouldFetchTip = messageCount >= 3 && messageCount % 3 === 0 && messageCount !== lastTipMessageCount;

        if (shouldFetchTip) {
            const fetchTip = async () => {
                setIsFetchingTip(true);
                setLastTipMessageCount(messageCount);
                try {
                    const tip = await getLiveChatCoachingTip(conversation.messages);
                    setCoachingTip(tip);
                    setHasNewTip(true);
                } catch (error) {
                    console.error("Failed to fetch live coach tip", error);
                } finally {
                    setIsFetchingTip(false);
                }
            };
            fetchTip();
        }
    }, [conversation.messages, isFetchingTip, lastTipMessageCount]);
    
    // Proactive Date Suggestion Effect
    useEffect(() => {
        const messageCount = conversation.messages.length;
        if (messageCount === 0) return;
        const lastMessage = conversation.messages[messageCount - 1];

        const shouldCheck =
            messageCount >= 6 &&
            lastMessage?.senderId === otherParticipant.id &&
            !isSuggestionDismissed &&
            !isCheckingSuggestion &&
            !dateSuggestion;

        if (shouldCheck) {
            const checkSuggestion = async () => {
                setIsCheckingSuggestion(true);
                try {
                    const suggestion = await getProactiveDateSuggestion(conversation.messages, currentUser, otherParticipant);
                    if (suggestion.shouldSuggest) {
                        setDateSuggestion(suggestion);
                    }
                } catch (error) {
                    console.error("Failed to check for proactive date suggestion", error);
                } finally {
                    setIsCheckingSuggestion(false);
                }
            };

            const timer = setTimeout(checkSuggestion, 2000);
            return () => clearTimeout(timer);
        }
    }, [conversation.messages, currentUser, otherParticipant, isSuggestionDismissed, isCheckingSuggestion, dateSuggestion]);


    // Effect for closing popovers on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
    
            if (activePopover.name === 'magicMenu' && magicMenuRef.current && !magicMenuRef.current.contains(target) && magicButtonRef.current && !magicButtonRef.current.contains(target)) {
                setActivePopover({ name: 'closed' });
            }
            if (activePopover.name === 'ghostwriter' && ghostwriterRef.current && !ghostwriterRef.current.contains(target) && magicButtonRef.current && !magicButtonRef.current.contains(target)) {
                setActivePopover({ name: 'closed' });
            }
            if (activePopover.name === 'liveCoachTip' && tipPopoverRef.current && !tipPopoverRef.current.contains(target) && tipButtonRef.current && !tipButtonRef.current.contains(target)) {
                setActivePopover({ name: 'closed' });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activePopover.name]);

    // Effect for conversation vibe analysis
    useEffect(() => {
        const fetchVibe = async () => {
            if (isFetchingVibe) return;
            setIsFetchingVibe(true);
            try {
                const newVibe = await analyzeConversationVibe(conversation.messages);
                setVibe(newVibe);
            } catch (error) {
                console.error("Failed to fetch conversation vibe:", error);
            } finally {
                setIsFetchingVibe(false);
            }
        };

        if (isBlindDateActive && conversation.messages.length >= 2) {
            // Debounce the call to avoid spamming the API on rapid messages
            if (vibeFetchTimer.current) {
                clearTimeout(vibeFetchTimer.current);
            }
            vibeFetchTimer.current = window.setTimeout(fetchVibe, 3000);
        } else {
            setVibe(null); // Clear vibe if not a blind date
        }

        return () => {
            if (vibeFetchTimer.current) {
                clearTimeout(vibeFetchTimer.current);
            }
        };
    }, [conversation.messages, isBlindDateActive, isFetchingVibe]);

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string)?.split(',')[1];
                if(base64) {
                    resolve(base64);
                } else {
                    reject(new Error("Failed to convert blob to base64"));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            handleSendUserMessage({ text: newMessage.trim() });
        }
    }
    
    const handleStartRecording = () => {
        setNewMessage(''); // Clear text input
        startRecording();
    };

    const handleSendAudio = () => {
        if (recordedAudioUrl) {
            handleSendUserMessage({ audioUrl: recordedAudioUrl });
        }
    };

    const handleGetSuggestions = async () => {
        setInputActionState({ name: 'loadingSuggestions' });
        setActivePopover({ name: 'closed' });
        try {
          const result = await generateChatReply(conversation.messages);
          setSuggestions(result.split('\n').filter(s => s.trim()));
        } catch (error) {
          console.error("Failed to generate chat reply suggestions", error);
          setSuggestions(["Couldn't get suggestions right now."]);
        } finally {
          setInputActionState({ name: 'idle' });
        }
    }
    
    const useSuggestion = (suggestion: string) => {
        handleSendUserMessage({ text: suggestion });
    }

    const handleRewrite = async (toneOverride?: string) => {
        const toneToUse = toneOverride || rewriteTone;
        if (!newMessage.trim() || !toneToUse.trim() || inputActionState.name !== 'idle') return;
        
        setInputActionState({ name: 'rewriting' });
        setActivePopover({ name: 'closed' });
        setSuggestions([]);
        const originalMessage = newMessage.trim();
        
        // Show visual feedback in the input
        setNewMessage('AI is rewriting...');
        
        try {
            const result = await rewriteMessage(conversation.messages, originalMessage, toneToUse);
            setNewMessage(result);
        } catch (error) {
            console.error("Rewrite failed:", error);
            setNewMessage(originalMessage); // Restore original on error
        } finally {
            setInputActionState({ name: 'idle' });
            setRewriteTone('');
        }
    };

    const handleSuggestDate = (suggestionText: string) => {
        setNewMessage(suggestionText);
        setIsDateIdeaModalOpen(false);
    };

    const handleGenerateFromAudio = async () => {
        if (!recordedAudioBlob || inputActionState.name !== 'idle') return;
    
        setInputActionState({ name: 'generatingFromAudio' });
        setSuggestions([]);
    
        try {
            const audioBase64 = await blobToBase64(recordedAudioBlob);
            const result = await generateReplyFromAudio(conversation.messages, audioBase64, recordedAudioBlob.type);
            setSuggestions(result.split('\n').filter(s => s.trim()));
            handleDeleteRecording(); // Clean up UI after getting suggestions
        } catch (error) {
            console.error("Audio reply generation failed", error);
            setSuggestions(["Sorry, I couldn't generate replies from that audio."]);
            handleDeleteRecording();
        } finally {
            setInputActionState({ name: 'idle' });
        }
    };

    const handleToggleSafeMode = (enabled: boolean) => {
        onUpdateConversation({ isSafeModeEnabled: enabled });
    };

    const toggleTipPopover = () => {
        if (coachingTip) {
            setActivePopover(popover => popover.name === 'liveCoachTip' ? { name: 'closed' } : { name: 'liveCoachTip' });
            setHasNewTip(false);
        }
    };

    const handleReveal = async () => {
      if (!otherParticipant) return;
      setIsRevealing(true);
      try {
        const report = await generateBlindDateRevealReport(conversation, currentUser, otherParticipant);
        handleSendSystemMessage({
          text: "The grand reveal! Here's a little summary of your connection.",
          revealReport: report,
        });
        onUpdateConversation({ blindDateState: 'revealed' });
      } catch (error) {
        console.error("Failed to generate reveal report", error);
        // Fallback to simple reveal
        onUpdateConversation({ blindDateState: 'revealed' });
        handleSendSystemMessage({
          text: "The grand reveal! You can now see each other's profiles.",
        });
      } finally {
        setIsRevealing(false);
      }
    };

    const handleStartGame = (statements: string[], lieIndex: number) => {
        if (!otherParticipant) return;
        const newGame: TwoTruthsGame = {
            id: `2t1l-${Date.now()}`,
            state: 'guessing',
            initiatorId: currentUser.id,
            guesserId: otherParticipant.id,
            statements,
            lieIndex,
            guess: null,
        };
        onUpdateConversation({ twoTruthsGame: newGame });
        setIsTwoTruthsModalOpen(false);
    };

    const handleEndGame = () => {
        onUpdateConversation({ twoTruthsGame: undefined });
    };

    const handleGuess = async (guessIndex: number) => {
        if (!conversation.twoTruthsGame) return;
        
        const game = conversation.twoTruthsGame;
        const wasCorrect = guessIndex === game.lieIndex;

        // Optimistically update the UI with the guess
        const updatedGameWithGuess: TwoTruthsGame = {
            ...game,
            state: 'completed',
            guess: guessIndex,
        };
        onUpdateConversation({ twoTruthsGame: updatedGameWithGuess });

        // Then get AI commentary in the background
        try {
            const commentary = await getTwoTruthsAICommentary(
                game.statements,
                game.statements[game.lieIndex],
                game.statements[guessIndex],
                wasCorrect
            );
            
            const finalGame: TwoTruthsGame = {
                ...updatedGameWithGuess,
                aiCommentary: commentary,
            };
            onUpdateConversation({ twoTruthsGame: finalGame });
        } catch (e) {
            console.error("Failed to generate game commentary:", e);
            // Silently fail, the game is still functional without commentary.
        }
    };

    const LiveCoachPopover = () => (
        <div ref={tipPopoverRef} className="absolute top-full right-4 mt-2 w-full max-w-xs bg-white rounded-xl shadow-2xl p-4 z-20 border border-rose-gold/20">
            <div className="flex items-start gap-3">
                <div className="p-1.5 bg-rose-gold/10 rounded-full mt-1">
                    <LightBulbIcon className="w-6 h-6 text-rose-gold" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-deep-teal">Live Coach Tip</h4>
                    <p className="text-sm text-slate-600 mt-1">{coachingTip?.tip}</p>
                </div>
                <button onClick={() => setActivePopover({ name: 'closed' })} className="text-slate-400 hover:text-slate-700">
                    <CloseIcon className="w-5 h-5"/>
                </button>
            </div>
        </div>
    );
    
    const BlindDateHeader = () => {
      const messagesToReveal = 5;
      // The first message is from the AI, so we don't count it for user interaction progress
      const messagesExchanged = Math.max(0, conversation.messages.filter(m => m.senderId !== 0).length);
      const progress = Math.min((messagesExchanged / messagesToReveal) * 100, 100);

      return (
          <div className="p-4 bg-deep-teal text-white text-center border-b border-rose-gold/20">
              <h3 className="font-bold text-lg">Blind Date in Progress!</h3>
              {progress < 100 ? (
                  <>
                      <p className="text-sm opacity-80 mt-1">Exchange {messagesToReveal - messagesExchanged} more message{messagesToReveal - messagesExchanged === 1 ? '' : 's'} to reveal your match.</p>
                      <div className="w-full bg-white/20 rounded-full h-2.5 mt-2">
                          <div className="bg-rose-gold h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                  </>
              ) : (
                  <>
                      <p className="text-sm opacity-80 mt-1">You've unlocked the reveal!</p>
                      <Button onClick={handleReveal} className="mt-2 !bg-rose-gold !text-white !py-2 !px-4 !text-sm" disabled={isRevealing}>
                          {isRevealing ? 'Revealing...' : 'Reveal Profile'}
                      </Button>
                  </>
              )}
          </div>
      );
    };

    const CallRequestBanner: React.FC<{
        conversation: Conversation;
        currentUser: UserProfile;
        otherParticipant: UserProfile;
        onAccept: () => void;
        onDecline: () => void;
    }> = ({ conversation, currentUser, otherParticipant, onAccept, onDecline }) => {
        const initiatorId = conversation.videoCallState?.initiatorId;
        const initiator = initiatorId === currentUser.id ? currentUser : otherParticipant;
        const isRecipient = currentUser.id !== initiatorId;
    
        if (!isRecipient) {
            return (
                <div className="p-3 bg-slate-100 text-center text-sm text-slate-600 font-semibold border-t border-slate-200">
                    Waiting for {otherParticipant.name} to respond to your video call request...
                </div>
            )
        }
    
        return (
            <div className="p-3 bg-rose-gold/10 text-center border-t border-rose-gold/20">
                <p className="font-semibold text-deep-teal mb-2">{initiator.name} would like to start a video call.</p>
                <div className="flex justify-center gap-3">
                    <Button onClick={onDecline} variant="secondary" className="!bg-red-100 !border-red-300 !text-red-700">Decline</Button>
                    <Button onClick={onAccept} className="!bg-green-500 hover:!bg-green-600">Accept</Button>
                </div>
            </div>
        );
    };

    const participantForHeader = isBlindDateActive ? {
      name: "Mystery Match",
      profilePicture: "https://i.imgur.com/8soO3a2.png",
    } : otherParticipant;

    const isGeneratingSuggestions = inputActionState.name === 'loadingSuggestions' || inputActionState.name === 'generatingFromAudio';
    const canvasUnlocked = conversation.coupleCanvas?.unlocked;

    return (
        <div className="flex flex-col h-full bg-white shadow-lg md:rounded-r-2xl">
            {isDateIdeaModalOpen && (
                <DateIdeaModal
                    currentUser={currentUser}
                    otherProfile={otherParticipant}
                    onClose={() => setIsDateIdeaModalOpen(false)}
                    onSuggest={handleSuggestDate}
                />
            )}
            {isAnalysisModalOpen && (
                <ChatAnalysisModal
                    conversation={conversation}
                    onClose={() => setIsAnalysisModalOpen(false)}
                />
            )}
             {isMemoriesModalOpen && (
                <SharedMemoriesModal
                    conversation={conversation}
                    currentUser={currentUser}
                    otherParticipant={otherParticipant}
                    onClose={() => setIsMemoriesModalOpen(false)}
                    onUpdateConversation={onUpdateConversation}
                />
            )}
            {isTwoTruthsModalOpen && (
                <StartTwoTruthsModal 
                    onClose={() => setIsTwoTruthsModalOpen(false)}
                    onStartGame={handleStartGame}
                />
            )}
            {/* Header */}
            <div className="flex items-center p-4 border-b border-slate-200">
                <button onClick={onBack} className="md:hidden p-2 mr-2 text-slate-500 hover:text-deep-teal">
                    <ArrowLeftIcon />
                </button>
                <img src={participantForHeader.profilePicture} alt={participantForHeader.name} className={`w-10 h-10 rounded-full object-cover ${isBlindDateActive ? 'filter blur-sm' : ''}`} />
                <h2 className="ml-3 text-lg font-bold text-deep-teal">{participantForHeader.name}</h2>
                <div className="ml-auto flex items-center gap-1 md:gap-2">
                     <button
                        onClick={() => onUpdateConversation({ videoCallState: { status: 'requesting', initiatorId: currentUser.id }})}
                        className="p-2 text-rose-gold hover:bg-rose-gold/10 rounded-full"
                        aria-label="Start video call"
                        disabled={isBlindDateActive || conversation.videoCallState?.status === 'requesting'}
                    >
                        <VideoCameraIcon className="w-6 h-6" />
                    </button>
                     <button
                        onClick={() => setIsMemoriesModalOpen(true)}
                        className="p-2 text-rose-gold hover:bg-rose-gold/10 rounded-full"
                        aria-label="View Shared Memories"
                        disabled={isBlindDateActive}
                     >
                        <TrophyIcon className="w-6 h-6"/>
                     </button>
                     <button
                        onClick={() => setIsTwoTruthsModalOpen(true)}
                        className="p-2 text-rose-gold hover:bg-rose-gold/10 rounded-full"
                        aria-label="Play a game"
                        disabled={isBlindDateActive || !!conversation.twoTruthsGame}
                     >
                        <PuzzlePieceIcon className="w-6 h-6"/>
                     </button>
                     <button
                        onClick={initiateVibeCheck}
                        className="p-2 text-rose-gold hover:bg-rose-gold/10 rounded-full"
                        aria-label="Start AI Vibe Check"
                        disabled={isVibeCheckLoading || (conversation.vibeCheck && conversation.vibeCheck.state === 'asking') || isBlindDateActive}
                    >
                        <QuestionMarkCircleIcon className={`w-6 h-6 ${isVibeCheckLoading ? 'animate-pulse' : ''}`} />
                    </button>
                    <div className="relative">
                        <button 
                            ref={tipButtonRef}
                            onClick={toggleTipPopover}
                            className="p-2 text-rose-gold hover:bg-rose-gold/10 rounded-full"
                            aria-label="Get Live Coach Tip"
                            disabled={(!coachingTip && !isFetchingTip) || isBlindDateActive}
                        >
                            <LightBulbIcon className={`w-6 h-6 ${isFetchingTip ? 'animate-pulse' : ''}`} />
                        </button>
                        {hasNewTip && (
                             <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-gold opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-gold"></span>
                            </span>
                        )}
                         {activePopover.name === 'liveCoachTip' && coachingTip && <LiveCoachPopover />}
                    </div>
                     <button 
                        onClick={() => setIsAnalysisModalOpen(true)}
                        className="p-2 text-rose-gold hover:bg-rose-gold/10 rounded-full"
                        aria-label="Analyze Chat with AI"
                        disabled={isBlindDateActive}
                    >
                        <BrainCircuitIcon className="w-6 h-6"/>
                    </button>
                    <ToggleSwitch 
                        label="Safe Mode" 
                        enabled={conversation.isSafeModeEnabled ?? false} 
                        onChange={handleToggleSafeMode} 
                    />
                </div>
            </div>
            
             {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 font-semibold text-center transition-colors duration-200 ${activeTab === 'chat' ? 'text-rose-gold border-b-2 border-rose-gold' : 'text-slate-500 hover:text-deep-teal'}`}
                >
                    Chat
                </button>
                <button
                    onClick={() => canvasUnlocked && setActiveTab('canvas')}
                    className={`flex-1 py-3 font-semibold text-center transition-colors duration-200 flex items-center justify-center gap-2 ${activeTab === 'canvas' ? 'text-rose-gold border-b-2 border-rose-gold' : 'text-slate-500'} ${canvasUnlocked ? 'hover:text-deep-teal' : 'cursor-not-allowed opacity-50'}`}
                    disabled={!canvasUnlocked}
                    title={!canvasUnlocked ? `Unlocks after ${UNLOCK_THRESHOLD} messages` : "View your shared canvas"}
                >
                    <PaintBrushIcon className="w-5 h-5" />
                    Couple's Canvas
                </button>
            </div>
            
            {isBlindDateActive && activeTab === 'chat' && <BlindDateHeader />}
            {isBlindDateActive && activeTab === 'chat' && <ConversationVibe vibe={vibe} />}

            {/* Conditional Content */}
            {activeTab === 'chat' ? (
                <>
                    {/* Messages */}
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-cream/20">
                        {conversation.connectionCrest && (
                            <ConnectionCrestComponent crest={conversation.connectionCrest} />
                        )}
                        {conversation.twoTruthsGame && (
                            <TwoTruthsAndALieCard 
                                game={conversation.twoTruthsGame}
                                currentUser={currentUser}
                                otherParticipant={otherParticipant}
                                onGuess={handleGuess}
                                onEndGame={handleEndGame}
                            />
                        )}
                        {conversation.vibeCheck && (
                            <VibeCheckCard
                                vibeCheck={conversation.vibeCheck}
                                currentUser={currentUser}
                                otherParticipant={otherParticipant}
                                onSubmitAnswer={submitVibeCheckAnswer}
                                onSendIcebreaker={(text) => handleSendUserMessage({ text })}
                                isAnalyzing={isVibeCheckAnalyzing}
                            />
                        )}
                        {conversation.lastVideoCallReport && (
                            <VideoCallReportCard report={conversation.lastVideoCallReport} />
                        )}
                        {conversation.messages.map((msg, index) => (
                            <ChatMessage 
                                key={`${msg.timestamp}-${index}`} 
                                message={msg} 
                                isCurrentUser={msg.senderId === currentUser.id} 
                                isSafeMode={conversation.isSafeModeEnabled ?? false}
                                onSendIcebreaker={(text) => handleSendUserMessage({ text })}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Call Request Banner */}
                    {conversation.videoCallState?.status === 'requesting' && (
                        <CallRequestBanner
                            conversation={conversation}
                            currentUser={currentUser}
                            otherParticipant={otherParticipant}
                            onAccept={() => onStartCall(conversation)}
                            onDecline={() => onUpdateConversation({ videoCallState: { status: 'none' } })}
                        />
                    )}

                    {/* Input Area */}
                    <div className="mt-auto border-t border-slate-200 bg-white relative">
                        {dateSuggestion && !isSuggestionDismissed && !isBlindDateActive && (
                            <div className="p-3 bg-rose-gold/10 border-b border-rose-gold/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-rose-gold/20 rounded-full">
                                        <CalendarDaysIcon className="w-6 h-6 text-rose-gold" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-deep-teal">Make a Move!</h4>
                                        <p className="text-sm text-slate-600">{dateSuggestion.suggestionText}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button className="!py-2 !px-4 !text-sm" onClick={() => setIsDateIdeaModalOpen(true)}>Plan a Date</Button>
                                        <button
                                            onClick={() => setIsSuggestionDismissed(true)}
                                            className="p-2 text-slate-500 hover:text-slate-800 rounded-full"
                                            aria-label="Dismiss suggestion"
                                        >
                                            <CloseIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activePopover.name === 'ghostwriter' && (
                        <div ref={ghostwriterRef} className="absolute bottom-full mb-2 left-4 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-20 p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-deep-teal">AI Ghostwriter</h4>
                                    <button onClick={() => setActivePopover({ name: 'closed' })} className="text-slate-500 hover:text-slate-800">
                                        <CloseIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    <label htmlFor="rewrite-tone" className="text-sm text-slate-600">How should we rewrite your message?</label>
                                    <input
                                        id="rewrite-tone"
                                        type="text"
                                        value={rewriteTone}
                                        onChange={(e) => setRewriteTone(e.target.value)}
                                        placeholder="e.g., More playful, confident..."
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => handleRewrite('Charming and warm')} disabled={inputActionState.name !== 'idle' || !newMessage.trim()}>Charming ✨</Button>
                                        <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => handleRewrite('Witty and humorous')} disabled={inputActionState.name !== 'idle' || !newMessage.trim()}>Witty 😎</Button>
                                        <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => handleRewrite('More direct and concise')} disabled={inputActionState.name !== 'idle' || !newMessage.trim()}>Direct 🎯</Button>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={() => handleRewrite()}
                                        disabled={inputActionState.name !== 'idle' || !newMessage.trim() || !rewriteTone.trim()}
                                        className="w-full mt-3"
                                    >
                                        {inputActionState.name === 'rewriting' ? 'Rewriting...' : 'Rewrite Message'}
                                    </Button>
                                </div>
                        </div>
                        )}
                        
                        {(isGeneratingSuggestions || suggestions.length > 0) && (
                            <div className="p-4 border-b border-slate-200">
                                {isGeneratingSuggestions ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <SparklesIcon className="w-5 h-5 animate-pulse" />
                                        <span>AI is thinking...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {suggestions.map((s, i) => (
                                            <button key={i} onClick={() => useSuggestion(s)} className="block text-left w-full p-2 hover:bg-rose-gold/10 rounded-md transition-colors text-slate-700 text-sm">
                                                "{s}"
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activePopover.name === 'magicMenu' && (
                            <div ref={magicMenuRef} className="absolute bottom-full mb-2 left-4 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-20">
                                <ul className="p-2">
                                    <li>
                                        <button 
                                            onClick={() => { handleGetSuggestions(); }}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!!newMessage.trim()}
                                        >
                                            <LightBulbIcon className="w-5 h-5 text-rose-gold" />
                                            <span>Suggest Replies</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button 
                                            onClick={() => setActivePopover({ name: 'ghostwriter' })}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!newMessage.trim()}
                                        >
                                            <PencilIcon className="w-5 h-5 text-rose-gold" />
                                            <span>Rewrite Message</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => { setIsDateIdeaModalOpen(true); setActivePopover({ name: 'closed' }); }}
                                            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                                            disabled={isBlindDateActive}
                                        >
                                            <CalendarDaysIcon className="w-5 h-5 text-rose-gold"/>
                                            <span>Suggest a Date</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-4">
                            <fieldset disabled={inputActionState.name !== 'idle' || isRecording} className="flex items-center space-x-2">
                                {isRecording ? (
                                    <div className="flex-1">
                                        <VoiceVisualizer mediaStream={mediaStream} isRecording={isRecording} />
                                    </div>
                                ) : recordedAudioUrl ? (
                                    <div className="flex-1 p-2 bg-slate-100 rounded-full flex items-center gap-2">
                                        <audio controls src={recordedAudioUrl} className="flex-1 h-9"></audio>
                                        <button type="button" onClick={handleGenerateFromAudio} className="p-2 text-rose-gold hover:bg-rose-gold/10 rounded-full" title="Generate replies from this audio">
                                            <SparklesIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative flex-grow">
                                            <button
                                                ref={magicButtonRef}
                                                type="button"
                                                onClick={() => setActivePopover(popover => popover.name === 'magicMenu' ? { name: 'closed' } : { name: 'magicMenu' })}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-rose-gold hover:bg-rose-gold/10 rounded-full transition-colors"
                                            >
                                                <SparklesIcon className="w-5 h-5" />
                                            </button>
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type your message..."
                                                className="w-full p-3 pl-12 pr-4 border border-slate-300 rounded-full focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                            />
                                        </div>
                                        <Button type="submit" disabled={!newMessage.trim()} className="!p-3 !rounded-full">
                                            <PaperAirplaneIcon className="w-6 h-6"/>
                                        </Button>
                                    </>
                                )}
                                
                                {isRecording ? (
                                     <button type="button" onClick={stopRecording} className="p-3 bg-red-500 text-white rounded-full">
                                        <StopIcon className="w-6 h-6" />
                                    </button>
                                ) : recordedAudioUrl ? (
                                    <>
                                         <Button type="button" onClick={handleSendAudio} className="!p-3 !rounded-full">
                                            <PaperAirplaneIcon className="w-6 h-6"/>
                                        </Button>
                                        <button type="button" onClick={handleDeleteRecording} className="p-3 text-slate-500 hover:text-red-500 rounded-full">
                                            <TrashIcon className="w-6 h-6" />
                                        </button>
                                    </>
                                ) : (
                                     <button type="button" onClick={handleStartRecording} className="p-3 text-rose-gold hover:bg-rose-gold/10 rounded-full">
                                        <MicrophoneIcon className="w-6 h-6" />
                                    </button>
                                )}

                            </fieldset>
                        </form>
                    </div>
                </>
            ) : (
                <CoupleCanvasView
                    conversation={conversation}
                    currentUser={currentUser}
                    otherParticipant={otherParticipant}
                    onUpdateConversation={onUpdateConversation}
                />
            )}
        </div>
    );
}

export const ChatView: React.FC<ChatViewProps> = ({ conversations, currentUser, allProfiles, activeConversationId, onSelectConversation, onSendMessage, onUpdateConversation, onStartCall }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const activeConversation = conversations.find(c => c.id === activeConversationId);

    const filteredConversations = conversations.filter(c => {
        const otherParticipantId = c.participantIds.find(id => id !== currentUser.id);
        const otherParticipant = allProfiles.find(p => p.id === otherParticipantId);
        return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const unreadCount = (conv: Conversation) => conv.messages.filter(m => !m.isRead && m.senderId !== currentUser.id).length > 0;

    // Sort conversations: unread first, then by most recent message
    const sortedConversations = [...filteredConversations].sort((a, b) => {
        const aUnread = unreadCount(a);
        const bUnread = unreadCount(b);

        if (aUnread && !bUnread) return -1;
        if (!aUnread && bUnread) return 1;

        const lastMessageA = a.messages[a.messages.length - 1]?.timestamp || '0';
        const lastMessageB = b.messages[b.messages.length - 1]?.timestamp || '0';
        
        return new Date(lastMessageB).getTime() - new Date(lastMessageA).getTime();
    });
    
    const otherParticipant = activeConversation ? allProfiles.find(p => p.id === activeConversation.participantIds.find(id => id !== currentUser.id)) : null;

    return (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 h-full max-h-[calc(100vh-140px)]">
            {/* Conversation List */}
            <div className={`flex flex-col border-r border-slate-200 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">Chats</h2>
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full mt-3 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                    />
                </div>
                <div className="overflow-y-auto flex-1">
                    {sortedConversations.map(c => {
                         const otherP = allProfiles.find(p => p.id === c.participantIds.find(id => id !== currentUser.id));
                         if (!otherP) return null;
                         return (
                            <ConversationListItem
                                key={c.id}
                                conversation={c}
                                otherParticipant={otherP}
                                isActive={c.id === activeConversationId}
                                hasUnread={c.messages.some(m => !m.isRead && m.senderId !== currentUser.id)}
                                onClick={() => onSelectConversation(c.id)}
                            />
                         );
                    })}
                </div>
            </div>
            
            {/* Chat Window */}
            <div className={`md:col-span-2 ${activeConversationId ? 'flex' : 'hidden md:flex'}`}>
                {activeConversation && otherParticipant ? (
                    <ChatWindow
                        conversation={activeConversation}
                        currentUser={currentUser}
                        otherParticipant={otherParticipant}
                        onSendMessage={(message) => onSendMessage(activeConversationId!, message)}
                        onUpdateConversation={(updates) => onUpdateConversation(activeConversationId!, updates)}
                        onBack={() => onSelectConversation(null)}
                        onStartCall={onStartCall}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-cream/20">
                        <ChatBubbleLeftRightIcon className="w-16 h-16 text-slate-300" />
                        <h3 className="mt-4 text-2xl font-bold font-serif text-deep-teal">Select a conversation</h3>
                        <p className="text-slate-500">Choose a chat from the left to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
