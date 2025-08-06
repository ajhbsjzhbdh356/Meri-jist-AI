
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, ArrowLeftIcon, PaperAirplaneIcon, CheckCircleIcon, LightBulbIcon, BrainCircuitIcon, ChatBubbleBottomCenterTextIcon } from './IconComponents';
import { PracticeScenario, ConversationPracticeReport } from '../types';
import { generatePracticeChatReply, analyzePracticeConversation } from '../services/geminiService';

interface ConversationPracticeModalProps {
  onClose: () => void;
}

type ModalStep = 'selection' | 'chatting' | 'analyzing' | 'results';
type ChatMessage = { role: 'user' | 'model'; parts: { text: string }[] };

const SCENARIOS = {
  [PracticeScenario.ICEBREAKER]: {
    title: 'Starting a Conversation',
    description: "Practice your opening lines with a new match.",
    persona: "You are chatting with Alex, who is friendly and works in marketing. Their profile mentions they love hiking and trying new restaurants.",
    aiFirstMessage: "Hey! Your profile looks interesting. How's your week going?"
  },
  [PracticeScenario.ASKING_OUT]: {
    title: 'Asking for a First Date',
    description: "Practice how to confidently ask someone out.",
    persona: "You've been chatting with Jess for a few days, and the conversation is going well. She seems interested and has a great sense of humor.",
    aiFirstMessage: "Haha, that's hilarious! I've really been enjoying our chats."
  },
  [PracticeScenario.RELATIONSHIP_GOALS]: {
    title: 'Discussing Relationship Goals',
    description: "Learn how to talk about the future without pressure.",
    persona: "You're on what feels like a third date with Sam. Things are going well, and you want to see if you're on the same page about what you're looking for long-term.",
    aiFirstMessage: "I had a great time tonight. It feels really easy talking to you."
  },
  [PracticeScenario.DISAGREEMENT]: {
    title: 'Handling a Disagreement',
    description: "Practice navigating a tricky conversation with empathy.",
    persona: "You and your partner, Charlie, had a plan to visit your family this weekend. Charlie just told you they have to work and can't go. You're feeling disappointed.",
    aiFirstMessage: "Hey, about this weekend... I'm so sorry, but something urgent came up at work and I don't think I can make it."
  },
};

const ScenarioCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="w-full text-left p-4 border rounded-lg transition-all duration-200 text-slate-700 bg-white hover:bg-rose-gold/10 hover:border-rose-gold/50 border-slate-300 flex items-start gap-4"
    >
        <div className="flex-shrink-0 text-rose-gold mt-1">{icon}</div>
        <div>
            <h4 className="font-bold text-lg text-deep-teal">{title}</h4>
            <p className="text-sm text-slate-600">{description}</p>
        </div>
    </button>
);


export const ConversationPracticeModal: React.FC<ConversationPracticeModalProps> = ({ onClose }) => {
    const [step, setStep] = useState<ModalStep>('selection');
    const [selectedScenario, setSelectedScenario] = useState<PracticeScenario | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<ConversationPracticeReport | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const handleScenarioSelect = (scenario: PracticeScenario) => {
        setSelectedScenario(scenario);
        const scenarioData = SCENARIOS[scenario];
        setChatHistory([{ role: 'model', parts: [{ text: scenarioData.aiFirstMessage }] }]);
        setStep('chatting');
    };
    
    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !selectedScenario) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input.trim() }] };
        const newHistory = [...chatHistory, userMessage];
        setChatHistory(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const scenarioData = SCENARIOS[selectedScenario];
            const aiReply = await generatePracticeChatReply(newHistory, selectedScenario, scenarioData.persona);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: aiReply }] }]);
        } catch (error) {
            console.error("AI reply failed", error);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "I'm not sure what to say... Let's try that again." }] }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEndPractice = async () => {
        setStep('analyzing');
        if (!selectedScenario) return; // Should not happen

        try {
            const report = await analyzePracticeConversation(chatHistory, selectedScenario);
            setAnalysisReport(report);
        } catch (error) {
            console.error("Analysis failed", error);
            setAnalysisReport({
                whatWentWell: ["There was an issue generating your report."],
                thingsToConsider: ["Please try again in a moment."],
                summary: "The AI coach is currently unavailable to review this conversation. Please check your connection or try another scenario."
            });
        }
        setStep('results');
    };
    
    const handleTryAgain = () => {
        setStep('selection');
        setSelectedScenario(null);
        setChatHistory([]);
        setAnalysisReport(null);
    }

    const renderHeader = () => (
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-3">
              <BrainCircuitIcon className="w-7 h-7 text-rose-gold"/>
              Conversation Practice
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                <CloseIcon />
            </button>
        </div>
    );
    
    const renderSelectionStep = () => (
        <>
            {renderHeader()}
            <div className="p-6 overflow-y-auto space-y-4">
                <p className="text-center text-slate-600">Choose a scenario to practice. Our AI will role-play with you to help you build confidence.</p>
                <ScenarioCard
                    icon={<ChatBubbleBottomCenterTextIcon className="w-6 h-6"/>}
                    title={SCENARIOS[PracticeScenario.ICEBREAKER].title}
                    description={SCENARIOS[PracticeScenario.ICEBREAKER].description}
                    onClick={() => handleScenarioSelect(PracticeScenario.ICEBREAKER)}
                />
                <ScenarioCard
                    icon={<SparklesIcon className="w-6 h-6"/>}
                    title={SCENARIOS[PracticeScenario.ASKING_OUT].title}
                    description={SCENARIOS[PracticeScenario.ASKING_OUT].description}
                    onClick={() => handleScenarioSelect(PracticeScenario.ASKING_OUT)}
                />
                 <ScenarioCard
                    icon={<BrainCircuitIcon className="w-6 h-6"/>}
                    title={SCENARIOS[PracticeScenario.RELATIONSHIP_GOALS].title}
                    description={SCENARIOS[PracticeScenario.RELATIONSHIP_GOALS].description}
                    onClick={() => handleScenarioSelect(PracticeScenario.RELATIONSHIP_GOALS)}
                />
                 <ScenarioCard
                    icon={<LightBulbIcon className="w-6 h-6"/>}
                    title={SCENARIOS[PracticeScenario.DISAGREEMENT].title}
                    description={SCENARIOS[PracticeScenario.DISAGREEMENT].description}
                    onClick={() => handleScenarioSelect(PracticeScenario.DISAGREEMENT)}
                />
            </div>
        </>
    );
    
    const renderChatStep = () => {
        if (!selectedScenario) return null;
        const scenarioData = SCENARIOS[selectedScenario];

        return (
            <>
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <Button variant="ghost" onClick={() => setStep('selection')} leftIcon={<ArrowLeftIcon className="w-5 h-5"/>}>Back</Button>
                    <div className="text-center">
                        <h3 className="font-bold text-deep-teal">{scenarioData.title}</h3>
                        <p className="text-sm text-slate-500">Practice with 'AI {scenarioData.persona.split(',')[0].split('with ')[1]}'</p>
                    </div>
                    <Button onClick={handleEndPractice} className="!py-2">End Practice</Button>
                </div>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-cream/20">
                    {chatHistory.map((msg, index) => (
                         <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <div className="p-1.5 bg-rose-gold/10 rounded-full flex-shrink-0 mb-1"><SparklesIcon className="w-6 h-6 text-rose-gold" /></div>}
                            <div className={`max-w-md p-3 rounded-xl ${msg.role === 'user' ? 'bg-rose-gold text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none shadow-sm'}`}>
                                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                            </div>
                         </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-end gap-2 justify-start">
                           <div className="p-1.5 bg-rose-gold/10 rounded-full flex-shrink-0 mb-1"><SparklesIcon className="w-6 h-6 text-rose-gold" /></div>
                           <div className="max-w-md p-3 rounded-xl bg-white text-slate-800 rounded-bl-none shadow-sm">
                              <div className="flex items-center gap-1.5">
                                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                              </div>
                           </div>
                        </div>
                     )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-4 border-t border-slate-200 bg-slate-50/50">
                    <fieldset disabled={isLoading} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your reply..."
                            className="flex-1 p-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                        />
                        <Button type="submit" disabled={!input.trim()} className="!p-3 !rounded-full">
                            <PaperAirplaneIcon className="w-6 h-6"/>
                        </Button>
                    </fieldset>
                </form>
            </>
        )
    };
    
    const renderAnalyzingStep = () => (
        <div className="flex flex-col items-center justify-center text-center p-8 h-full">
            <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
            <p className="mt-4 text-xl font-semibold text-deep-teal">Coach is analyzing your conversation...</p>
            <p className="text-slate-500">Your personalized feedback is on its way.</p>
        </div>
    );

    const AnalysisItem: React.FC<{icon: React.ReactNode, children: React.ReactNode}> = ({icon, children}) => (
        <li className="flex items-start gap-3 p-3">
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <span className="text-slate-700">{children}</span>
        </li>
    );

    const renderResultsStep = () => {
        if (!analysisReport) return renderAnalyzingStep();
        return (
             <>
                {renderHeader()}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="text-center p-6 bg-cream rounded-xl">
                        <h3 className="text-2xl font-bold font-serif text-rose-gold">Practice Complete!</h3>
                        <p className="mt-3 text-slate-700">{analysisReport.summary}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-deep-teal mb-3 flex items-center gap-2"><CheckCircleIcon className="w-6 h-6 text-green-500"/> What Went Well</h4>
                        <ul className="space-y-1 bg-green-50/50 border border-green-200/80 rounded-lg p-2">
                           {analysisReport.whatWentWell.map((item, i) => <AnalysisItem key={i} icon={<CheckCircleIcon className="w-5 h-5 text-green-500"/>}>{item}</AnalysisItem>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg text-deep-teal mb-3 flex items-center gap-2"><LightBulbIcon className="w-6 h-6 text-yellow-500"/> Things to Consider</h4>
                        <ul className="space-y-1 bg-yellow-50/50 border border-yellow-200/80 rounded-lg p-2">
                           {analysisReport.thingsToConsider.map((item, i) => <AnalysisItem key={i} icon={<LightBulbIcon className="w-5 h-5 text-yellow-500"/>}>{item}</AnalysisItem>)}
                        </ul>
                    </div>
                </div>
                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="secondary" onClick={handleTryAgain}>Practice Another Scenario</Button>
                    <Button variant="primary" onClick={onClose}>Done</Button>
                </div>
             </>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {step === 'selection' && renderSelectionStep()}
                {step === 'chatting' && renderChatStep()}
                {step === 'analyzing' && renderAnalyzingStep()}
                {step === 'results' && renderResultsStep()}
            </div>
        </div>
    );
};
