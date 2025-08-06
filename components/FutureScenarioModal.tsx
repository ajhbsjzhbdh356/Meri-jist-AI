
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, ArrowLeftIcon, PaperAirplaneIcon, CheckCircleIcon, LightBulbIcon, FlagIcon } from './IconComponents';
import { FutureScenario, FutureScenarioReport, FutureScenarioCategory } from '../types';
import { analyzeFutureScenario, generatePracticeChatReply } from '../services/geminiService';

interface FutureScenarioModalProps {
  onClose: () => void;
}

type ModalStep = 'selection' | 'chatting' | 'analyzing' | 'results';
type ChatMessage = { role: 'user' | 'model'; parts: { text: string }[] };

const SCENARIOS: Record<string, FutureScenario> = {
  PLAN_VACATION: {
    title: 'Plan a First Vacation',
    category: FutureScenarioCategory.PLANNING,
    description: "Practice compromising and planning a fun trip together.",
    persona: "You are a thoughtful and slightly adventurous partner. You value both relaxation and new experiences. You want to make sure your partner feels heard.",
    initialPrompt: "Okay, so we're finally planning our first weekend trip together! I'm so excited. I was thinking maybe a cozy cabin in the mountains, but I'm totally open to ideas. What's on your mind?"
  },
  DREAM_HOME: {
    title: 'Dreaming Up a Home',
    category: FutureScenarioCategory.DREAMING,
    description: "Explore your shared values and aspirations by imagining a future home.",
    persona: "You are an optimistic and creative partner. You're less concerned with specifics and more with the feeling of a home. You're a good listener.",
    initialPrompt: "This is just for fun, but... if we were to design our dream home, what's one 'must-have' feature you'd want? No budget, no limits!"
  },
  NAVIGATE_STRESS: {
    title: 'Navigating a Stressful Week',
    category: FutureScenarioCategory.CHALLENGES,
    description: "Practice supporting your partner during a tough time.",
    persona: "You are a supportive and empathetic partner. You can tell the user has had a stressful week. Your goal is to offer comfort and support, not to solve their problems for them.",
    initialPrompt: "Hey, you seem a bit distant this evening. I get the sense it's been a tough week. Do you want to talk about it? No pressure at all if not."
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


export const FutureScenarioModal: React.FC<FutureScenarioModalProps> = ({ onClose }) => {
    const [step, setStep] = useState<ModalStep>('selection');
    const [selectedScenario, setSelectedScenario] = useState<FutureScenario | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<FutureScenarioReport | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const handleScenarioSelect = (scenario: FutureScenario) => {
        setSelectedScenario(scenario);
        setChatHistory([{ role: 'model', parts: [{ text: scenario.initialPrompt }] }]);
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
            // Using a simplified call similar to practice chat
            const aiReply = await generatePracticeChatReply(newHistory, selectedScenario.title as any, selectedScenario.persona);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: aiReply }] }]);
        } catch (error) {
            console.error("AI reply failed", error);
            setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "I'm not sure what to say... Let's try that again." }] }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEndPractice = async () => {
        if (!selectedScenario) return;
        setStep('analyzing');

        try {
            const report = await analyzeFutureScenario(chatHistory, selectedScenario);
            setAnalysisReport(report);
        } catch (error) {
            console.error("Analysis failed", error);
            setAnalysisReport({
                keyTakeaways: ["There was an issue generating your report."],
                communicationStyle: "N/A",
                collaborativeSpirit: "N/A",
                summary: "The AI coach is currently unavailable to review this scenario. Please check your connection or try another one."
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
              <FlagIcon className="w-7 h-7 text-rose-gold"/>
              Future Scenarios
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
                <p className="text-center text-slate-600">Practice navigating important relationship conversations with an AI partner. Choose a scenario to begin.</p>
                {Object.values(SCENARIOS).map(scenario => (
                     <ScenarioCard
                        key={scenario.title}
                        icon={<SparklesIcon className="w-6 h-6"/>}
                        title={scenario.title}
                        description={scenario.description}
                        onClick={() => handleScenarioSelect(scenario)}
                    />
                ))}
            </div>
        </>
    );
    
    const renderChatStep = () => {
        if (!selectedScenario) return null;

        return (
            <>
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                    <Button variant="ghost" onClick={() => setStep('selection')} leftIcon={<ArrowLeftIcon className="w-5 h-5"/>}>Back</Button>
                    <div className="text-center">
                        <h3 className="font-bold text-deep-teal">{selectedScenario.title}</h3>
                        <p className="text-sm text-slate-500">Role-playing with AI</p>
                    </div>
                    <Button onClick={handleEndPractice} className="!py-2">End Scenario</Button>
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
        if (!analysisReport || !selectedScenario) return renderAnalyzingStep();
        return (
             <>
                {renderHeader()}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="text-center p-6 bg-cream rounded-xl">
                        <h3 className="text-2xl font-bold font-serif text-rose-gold">Scenario Complete!</h3>
                        <p className="mt-2 text-slate-700">{analysisReport.summary}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-deep-teal mb-3 flex items-center gap-2"><CheckCircleIcon className="w-6 h-6 text-green-500"/> Key Takeaways</h4>
                        <ul className="space-y-1 bg-green-50/50 border border-green-200/80 rounded-lg p-2">
                           {analysisReport.keyTakeaways.map((item, i) => <AnalysisItem key={i} icon={<CheckCircleIcon className="w-5 h-5 text-green-500"/>}>{item}</AnalysisItem>)}
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-lg text-deep-teal mb-3 flex items-center gap-2"><LightBulbIcon className="w-6 h-6 text-yellow-500"/> Communication & Collaboration</h4>
                        <div className="space-y-2 bg-yellow-50/50 border border-yellow-200/80 rounded-lg p-3">
                           <p><span className="font-semibold">Your Style:</span> {analysisReport.communicationStyle}</p>
                           <p><span className="font-semibold">Collaboration:</span> {analysisReport.collaborativeSpirit}</p>
                        </div>
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
