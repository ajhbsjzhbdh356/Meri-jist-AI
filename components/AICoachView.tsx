import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Button } from './Button';
import { PaperAirplaneIcon, SparklesIcon, LinkIcon, LightBulbIcon, ArrowPathIcon, ClipboardCheckIcon, PencilIcon, ShieldCheckIcon, ChatBubbleBottomCenterTextIcon, BrainCircuitIcon, CalendarDaysIcon, PaintBrushIcon, FlagIcon, ChatBubbleLeftRightIcon, CompassIcon, ChartBarIcon, GiftIcon, BuildingStorefrontIcon, MapPinIcon, CloseIcon, PhotographIcon, DocumentTextIcon, BookHeartIcon, PuzzlePieceIcon } from './IconComponents';
import { CoachMessage, UserProfile, WebSource, Conversation, DatePlan, CoachQuickReply } from '../types';
import { ConversationTopicsModal } from './ConversationTopicsModal';
import { RelationshipQuizModal } from './RelationshipQuizModal';
import { DatingSafetyModal } from './DatingSafetyModal';
import { PostDateDebriefModal } from './PostDateDebriefModal';
import { ConversationPracticeModal } from './ConversationPracticeModal';
import { DatePlannerModal } from './DatePlannerModal';
import { DreamDateGeneratorModal } from './DreamDateGeneratorModal';
import { FirstMessageAuditorModal } from './FirstMessageAuditorModal';
import { FutureScenarioModal } from './FutureScenarioModal';
import { RelationshipNorthStarModal } from './RelationshipNorthStarModal';
import { DatingPatternAnalyzerModal } from './DatingPatternAnalyzerModal';
import { AIGiftSuggesterModal } from './AIGiftSuggesterModal';
import { planDateWithConcierge } from '../services/geminiService';
import { AIPhotoAnalyzerModal } from './AIPhotoAnalyzerModal';
import { DesignBriefIllustratorModal } from './DesignBriefIllustratorModal';
import { PeaceKeeperModal } from './PeaceKeeperModal';
import { CoupleComicGeneratorModal } from './CoupleComicGeneratorModal';

interface AICoachViewProps {
    currentUser: UserProfile;
    onOpenNudgeModal: () => void;
    likedProfiles: UserProfile[];
    conversations: Conversation[];
    allProfiles: UserProfile[];
    onShareComic: (otherUserId: number, imageBase64: string) => void;
}

const InputLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1">{children}</label>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition" />
);


const DateNightConciergeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [idea, setIdea] = useState('a romantic dinner');
    const [location, setLocation] = useState('Mumbai');
    const [time, setTime] = useState('this Saturday evening');
    const [plan, setPlan] = useState<DatePlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleGenerate = async () => {
        if (!idea.trim() || !location.trim() || !time.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setPlan(null);
        setHasSearched(true);

        try {
            const result = await planDateWithConcierge(idea, location, time);
            setPlan(result);
        } catch (err: any) {
            setError(err.message || "I couldn't come up with any suggestions right now. Please try again!");
            console.error(err);
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
                        <BuildingStorefrontIcon className="w-6 h-6 text-rose-gold" />
                        Date Night Concierge
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4 md:border-r md:pr-6 border-slate-200">
                        <p className="text-sm text-slate-600">Let AI find real, local places for your next date using Google Search.</p>
                        <div>
                            <InputLabel htmlFor="concierge-idea">Date Idea</InputLabel>
                            <TextInput id="concierge-idea" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="e.g., romantic dinner" />
                        </div>
                        <div>
                            <InputLabel htmlFor="concierge-location">Location</InputLabel>
                            <TextInput id="concierge-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Mumbai" />
                        </div>
                        <div>
                            <InputLabel htmlFor="concierge-time">When?</InputLabel>
                            <TextInput id="concierge-time" value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g., This Saturday evening" />
                        </div>
                        <div className="pt-4">
                            <Button variant="primary" onClick={handleGenerate} disabled={isLoading || !idea || !location || !time} leftIcon={<SparklesIcon className="w-5 h-5"/>} className="w-full">
                                {isLoading ? 'Searching...' : 'Find Venues'}
                            </Button>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[300px] h-full">
                                <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                                <p className="mt-4 text-xl font-semibold text-deep-teal">Searching for the perfect spots...</p>
                            </div>
                        ) : !hasSearched ? (
                             <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-lg h-full border-2 border-dashed border-slate-300">
                                <p className="text-slate-500">Your personalized venue suggestions will appear here.</p>
                            </div>
                        ) : error ? (
                             <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                                <h3 className="font-bold text-lg">Oops!</h3>
                                <p>{error}</p>
                            </div>
                        ) : plan && plan.venues.length > 0 ? (
                            <div className="space-y-4">
                                {plan.venues.map((venue, index) => (
                                    <div key={index} className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
                                        <h4 className="font-bold text-lg text-deep-teal flex items-center gap-2"><BuildingStorefrontIcon className="w-5 h-5"/> {venue.name}</h4>
                                        <p className="text-slate-600 text-sm my-2">{venue.description}</p>
                                        <p className="text-sm text-slate-500 font-semibold flex items-center gap-2"><MapPinIcon className="w-4 h-4"/> {venue.address}</p>
                                    </div>
                                ))}
                                {plan.sources && plan.sources.length > 0 && (
                                     <div className="mt-4 pt-3 border-t border-slate-300/50">
                                        <h4 className="text-sm font-semibold mb-2 text-slate-600">Sources:</h4>
                                        <ul className="space-y-2">
                                            {plan.sources.map((source, index) => (
                                                <li key={index}>
                                                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-rose-gold hover:underline">
                                                        <LinkIcon className="w-4 h-4 flex-shrink-0" />
                                                        <span className="truncate">{source.title || source.uri}</span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="text-center p-8 bg-slate-50 text-slate-600 rounded-lg">
                                <h3 className="font-bold text-lg">No Venues Found</h3>
                                <p>Try broadening your search criteria.</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

const CoachChatMessage: React.FC<{ message: CoachMessage; user: UserProfile; onQuickReplyClick: (reply: CoachQuickReply) => void; }> = ({ message, user, onQuickReplyClick }) => {
    const isUser = message.sender === 'user';
    const bubbleClasses = isUser ? 'bg-rose-gold text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none';
    const containerClasses = `flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`;

    // A simple blinking cursor for loading state
    const LoadingIndicator = () => <div className="inline-block ml-1 w-0.5 h-4 bg-slate-500 animate-pulse"></div>;

    return (
        <div className={containerClasses}>
            {!isUser && <div className="p-1.5 bg-rose-gold/10 rounded-full flex-shrink-0 mt-1"><SparklesIcon className="w-6 h-6 text-rose-gold" /></div>}
            <div className={`max-w-2xl p-4 rounded-xl shadow-sm ${bubbleClasses}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{message.text}{message.isLoading && <LoadingIndicator />}</p>
                {message.sources && message.sources.length > 0 && !message.isLoading && (
                    <div className="mt-4 pt-3 border-t border-slate-300/50">
                        <h4 className="text-sm font-semibold mb-2">Sources:</h4>
                        <ul className="space-y-2">
                            {message.sources.map((source, index) => (
                                <li key={index}>
                                    <a 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="inline-flex items-center gap-2 text-sm text-rose-gold hover:underline"
                                    >
                                        <LinkIcon className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{source.title || source.uri}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {message.quickReplies && !message.isLoading && (
                    <div className="mt-4 pt-3 border-t border-slate-300/50 flex flex-wrap gap-2">
                        {message.quickReplies.map((reply, index) => (
                            <button
                                key={index}
                                onClick={() => onQuickReplyClick(reply)}
                                className="px-3 py-1.5 text-sm bg-white/80 text-deep-teal rounded-full hover:bg-white transition-colors shadow-sm border border-slate-300/50"
                            >
                                {reply.text}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {isUser && <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-full object-cover"/>}
        </div>
    )
}

const ToolCard: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    text: string;
    description: string;
    disabled?: boolean;
}> = ({ onClick, icon, text, description, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors duration-200 hover:bg-rose-gold/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        title={disabled ? "Feature coming soon or requires more data" : ""}
    >
        <div className="flex-shrink-0 text-rose-gold p-1.5 bg-rose-gold/10 rounded-full">{icon}</div>
        <div>
            <h6 className="font-semibold text-deep-teal text-sm">{text}</h6>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
    </button>
);

const ToolkitCategory: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white/50 rounded-lg border border-rose-gold/20">
        <h5 className="flex items-center gap-3 p-3 font-semibold text-deep-teal text-base border-b border-rose-gold/20">
            {icon}
            {title}
        </h5>
        <div className="p-3 space-y-2">
            {children}
        </div>
    </div>
);


export const AICoachView: React.FC<AICoachViewProps> = ({ currentUser, onOpenNudgeModal, likedProfiles, conversations, allProfiles, onShareComic }) => {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  const model = 'gemini-2.5-flash';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = useCallback(async (messageToSend?: string) => {
    const userInput = messageToSend || input.trim();
    if (!userInput || !chatRef.current) return;
    
    if (!messageToSend) {
        setInput('');
    }
    
    const userMessage: CoachMessage = { sender: 'user', text: userInput };
    const loadingMessage: CoachMessage = { sender: 'ai', text: '', isLoading: true };
    setMessages(prev => [...prev, userMessage, loadingMessage]);

    try {
        const responseStream = await chatRef.current.sendMessageStream({ message: userInput });
        
        let fullResponse = '';
        setMessages(prev => prev.slice(0, -1).concat({ sender: 'ai', text: '', isLoading: true }));
        
        for await (const chunk of responseStream) {
            fullResponse += chunk.text;
            setMessages(prev => prev.slice(0, -1).concat({ sender: 'ai', text: fullResponse, isLoading: true }));
        }

        const finalAIMessage: CoachMessage = { sender: 'ai', text: fullResponse };
        setMessages(prev => prev.slice(0, -1).concat(finalAIMessage));
    } catch (error) {
        console.error("AI Coach chat error:", error);
        const errorMessage: CoachMessage = { sender: 'ai', text: "Sorry, I'm having a little trouble thinking right now. Please try again in a moment." };
        setMessages(prev => prev.slice(0, -1).concat(errorMessage));
    }
  }, [input, chatRef]);

  const handleQuickReplyClick = (reply: CoachQuickReply) => {
      setMessages(prev => prev.map(msg => {
          const { quickReplies, ...rest } = msg;
          return rest;
      }));

      if (reply.action === 'open_modal') {
          setActiveModal(reply.payload);
      } else if (reply.action === 'send_message') {
          handleSendMessage(reply.payload);
      }
  };

  const initializeChat = useCallback(() => {
    const newChat = ai.chats.create({
        model,
        config: {
            systemInstruction: `You are a friendly and encouraging AI dating coach for the SoulMate AI app. The user's name is ${currentUser.name}. Keep your responses concise, helpful, and focused on providing actionable advice. When asked for advice, use your knowledge of dating and relationships. You can also answer general knowledge questions. Never reveal that you are a language model.`,
        },
    });
    chatRef.current = newChat;

    const initialQuickReplies: CoachQuickReply[] = [
        { text: "Analyze my photos", action: 'open_modal', payload: 'photoAnalyzer' },
        { text: "Help me write a first message", action: 'open_modal', payload: 'auditor' },
        { text: "Suggest date ideas", action: 'open_modal', payload: 'planner' },
        { text: "Give me a dating tip", action: 'send_message', payload: "Give me a random dating tip." }
    ];

    setMessages([
      { sender: 'ai', text: `Hi ${currentUser.name}! I'm your personal AI dating coach. How can I help you today? You can ask me for advice, or use one of the tools below.`, quickReplies: initialQuickReplies }
    ]);
  }, [currentUser.name]);

  useEffect(() => {
    if (!chatRef.current) {
      initializeChat();
    }
  }, [initializeChat]);
  
  const suggestions = useMemo(() => [
    {
      id: 'photoAnalyzer',
      title: 'Polish Your Photos',
      description: "Get AI feedback on your photos to make sure you're putting your best foot forward.",
      icon: PhotographIcon,
      action: () => setActiveModal('photoAnalyzer'),
      cta: 'Analyze Photos',
    },
    {
      id: 'firstMessage',
      title: 'Nail the First Impression',
      description: "Stuck on an opening line? Let our AI audit your first message before you send it.",
      icon: ShieldCheckIcon,
      action: () => setActiveModal('auditor'),
      cta: 'Audit Message',
    },
    {
      id: 'datePlanner',
      title: 'Plan the Perfect Date',
      description: "Don't know where to go? Get personalized date ideas based on interests, budget, and location.",
      icon: CalendarDaysIcon,
      action: () => setActiveModal('planner'),
      cta: 'Plan a Date',
    },
    {
      id: 'practice',
      title: 'Practice Makes Perfect',
      description: "Feeling nervous? Role-play tough conversations with our AI to build your confidence.",
      icon: BrainCircuitIcon,
      action: () => setActiveModal('practice'),
      cta: 'Start Practicing',
    },
    {
      id: 'northStar',
      title: 'Discover Your "Why"',
      description: "Take our 'North Star' quiz to get clarity on what you're truly looking for in a relationship.",
      icon: CompassIcon,
      action: () => setActiveModal('northStar'),
      cta: 'Find My North Star',
    }
  ], []);

  const [suggestion, setSuggestion] = useState<(typeof suggestions)[0] | null>(null);

  useEffect(() => {
      setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
  }, [suggestions]);

  const SuggestionCard: React.FC<{ suggestion: (typeof suggestions)[0] }> = ({ suggestion }) => {
      const Icon = suggestion.icon;
      return (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-lg mb-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0 p-4 bg-white/20 rounded-full">
                      <Icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold font-serif">{suggestion.title}</h3>
                      <p className="mt-1 text-white/90">{suggestion.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                      <Button onClick={suggestion.action} className="!bg-white !text-brand-primary !font-bold">
                          {suggestion.cta}
                      </Button>
                  </div>
              </div>
          </div>
      )
  };

  const allTools = useMemo(() => ({
    'photoAnalyzer': { text: "Photo Analyzer", description: "Get AI feedback on which photos to use.", icon: <PhotographIcon className="w-5 h-5"/>, action: () => setActiveModal('photoAnalyzer') },
    'topics': { text: "Topic Ideas", description: "Get personalized conversation starters.", icon: <LightBulbIcon className="w-5 h-5"/>, action: () => setActiveModal('topics') },
    'auditor': { text: "First Message Auditor", description: "Review your opening line before you send it.", icon: <ShieldCheckIcon className="w-5 h-5"/>, action: () => setActiveModal('auditor') },
    'practice': { text: "Conversation Practice", description: "Role-play tough conversations with AI.", icon: <BrainCircuitIcon className="w-5 h-5"/>, action: () => setActiveModal('practice') },
    'nudges': { text: "Connection Nudges", description: "Get ideas to revive stalled chats.", icon: <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>, action: onOpenNudgeModal },
    'planner': { text: "Personalized Date Ideas", description: "Get date ideas based on interests and budget.", icon: <CalendarDaysIcon className="w-5 h-5"/>, action: () => setActiveModal('planner') },
    'concierge': { text: "Date Night Concierge", description: "Find real, local venues for your date.", icon: <BuildingStorefrontIcon className="w-5 h-5"/>, action: () => setActiveModal('concierge') },
    'debrief': { text: "Post-Date Debrief", description: "Reflect on your date with AI insights.", icon: <DocumentTextIcon className="w-5 h-5"/>, action: () => setActiveModal('debrief') },
    'gift': { text: "Gift Suggester", description: "Find the perfect gift for your match.", icon: <GiftIcon className="w-5 h-5"/>, action: () => setActiveModal('gift') },
    'quiz': { text: "Relationship Quiz", description: "Understand your relationship style better.", icon: <ChartBarIcon className="w-5 h-5"/>, action: () => setActiveModal('quiz') },
    'northStar': { text: "Find Your North Star", description: "Get clarity on what you're truly looking for.", icon: <CompassIcon className="w-5 h-5"/>, action: () => setActiveModal('northStar') },
    'pattern': { text: "Analyze Dating Patterns", description: "Uncover insights from your activity.", icon: <ChartBarIcon className="w-5 h-5"/>, action: () => setActiveModal('pattern') },
    'futureScenario': { text: "Future Scenarios", description: "Role-play important relationship talks.", icon: <FlagIcon className="w-5 h-5"/>, action: () => setActiveModal('futureScenario') },
    'dreamDate': { text: "Dream Date Illustrator", description: "Create an image of your perfect date.", icon: <PaintBrushIcon className="w-5 h-5"/>, action: () => setActiveModal('dreamDate') },
    'designBrief': { text: "Design Brief Illustrator", description: "Generate an image from a detailed brief.", icon: <DocumentTextIcon className="w-5 h-5"/>, action: () => setActiveModal('designBrief') },
    'coupleComic': { text: "Couple's Comic Generator", description: "Create a cute comic strip with your match.", icon: <BookHeartIcon className="w-5 h-5"/>, action: () => setActiveModal('coupleComic') },
    'peaceKeeper': { text: "Peace Keeper", description: "Get help de-escalating a disagreement.", icon: <PuzzlePieceIcon className="w-5 h-5"/>, action: () => setActiveModal('peaceKeeper') },
    'safety': { text: "Dating Safety Tips", description: "Get AI-powered safety advice.", icon: <ShieldCheckIcon className="w-5 h-5"/>, action: () => setActiveModal('safety') },
  }), [onOpenNudgeModal]);

  const TOOL_CATEGORIES = useMemo(() => [
      { title: "Profile & Photos", icon: <PencilIcon className="w-5 h-5"/>, tools: [allTools.photoAnalyzer] },
      { title: "Conversation Skills", icon: <ChatBubbleLeftRightIcon className="w-5 h-5"/>, tools: [allTools.topics, allTools.auditor, allTools.practice, allTools.nudges] },
      { title: "Date Planning", icon: <CalendarDaysIcon className="w-5 h-5"/>, tools: [allTools.planner, allTools.concierge, allTools.debrief, allTools.gift] },
      { title: "Self-Discovery & Vision", icon: <CompassIcon className="w-5 h-5"/>, tools: [allTools.quiz, allTools.northStar, allTools.pattern, allTools.futureScenario] },
      { title: "Creative Tools", icon: <PaintBrushIcon className="w-5 h-5"/>, tools: [allTools.dreamDate, allTools.designBrief, allTools.coupleComic] },
      { title: "Relationship Tools", icon: <PuzzlePieceIcon className="w-5 h-5"/>, tools: [allTools.peaceKeeper] },
      { title: "Safety & Support", icon: <ShieldCheckIcon className="w-5 h-5"/>, tools: [allTools.safety] },
  ], [allTools]);


  const renderModals = () => (
    <>
        {activeModal === 'topics' && <ConversationTopicsModal currentUser={currentUser} onClose={() => setActiveModal(null)} />}
        {activeModal === 'quiz' && <RelationshipQuizModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'safety' && <DatingSafetyModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'debrief' && <PostDateDebriefModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'practice' && <ConversationPracticeModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'planner' && <DatePlannerModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'concierge' && <DateNightConciergeModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'dreamDate' && <DreamDateGeneratorModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'auditor' && <FirstMessageAuditorModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'futureScenario' && <FutureScenarioModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'northStar' && <RelationshipNorthStarModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'pattern' && <DatingPatternAnalyzerModal currentUser={currentUser} likedProfiles={likedProfiles} conversations={conversations} onClose={() => setActiveModal(null)} />}
        {activeModal === 'gift' && <AIGiftSuggesterModal currentUser={currentUser} conversations={conversations} allProfiles={allProfiles} onClose={() => setActiveModal(null)} />}
        {activeModal === 'photoAnalyzer' && <AIPhotoAnalyzerModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'designBrief' && <DesignBriefIllustratorModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'peaceKeeper' && <PeaceKeeperModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'coupleComic' && <CoupleComicGeneratorModal onClose={() => setActiveModal(null)} currentUser={currentUser} conversations={conversations} allProfiles={allProfiles} onShare={onShareComic} />}
    </>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 h-full flex flex-col">
        {renderModals()}
        <div className="text-center mb-8">
            <h2 className="text-4xl font-bold font-serif text-deep-teal">AI Coach</h2>
            <p className="text-slate-500 mt-2 max-w-2xl mx-auto">Your personal AI assistant to help you navigate your dating journey.</p>
        </div>
        
        {suggestion && <SuggestionCard suggestion={suggestion} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow min-h-0">
            <div className="lg:col-span-1 space-y-4 max-h-full overflow-y-auto">
                {TOOL_CATEGORIES.map(category => (
                    <ToolkitCategory key={category.title} title={category.title} icon={category.icon}>
                        {category.tools.map(tool => (
                            <ToolCard
                                key={tool.text}
                                onClick={tool.action}
                                icon={tool.icon}
                                text={tool.text}
                                description={tool.description}
                                disabled={(tool as any).disabled}
                            />
                        ))}
                    </ToolkitCategory>
                ))}
            </div>

            <div className="lg:col-span-2 bg-white/50 rounded-2xl shadow-lg flex flex-col max-h-full">
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <CoachChatMessage key={index} message={msg} user={currentUser} onQuickReplyClick={handleQuickReplyClick} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                    }}
                    className="p-4 border-t border-slate-200 bg-white/70 rounded-b-2xl"
                >
                    <fieldset disabled={isLoading} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask the AI Coach for advice..."
                            className="flex-1 p-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                        />
                        <Button type="submit" disabled={!input.trim()} className="!p-3 !rounded-full">
                            <PaperAirplaneIcon className="w-6 h-6" />
                        </Button>
                    </fieldset>
                </form>
            </div>
        </div>
    </div>
  );
};