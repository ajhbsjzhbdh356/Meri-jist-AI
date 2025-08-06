
import React, { useState } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, CompassIcon, StarIcon, GiftIcon, EyeIcon } from './IconComponents';
import { RelationshipNorthStarReport } from '../types';
import { generateRelationshipNorthStar } from '../services/geminiService';

interface RelationshipNorthStarModalProps {
  onClose: () => void;
}

const QUIZ_QUESTIONS = [
  {
    question: "A fulfilling life is primarily about...",
    options: ["Personal achievement and growth", "Strong relationships and community", "Experiencing joy and adventure", "Creating stability and comfort"],
  },
  {
    question: "When faced with a major life decision, you rely most on...",
    options: ["Logical analysis and data", "Your intuition and gut feeling", "Advice from trusted friends and family", "Your core values and principles"],
  },
  {
    question: "You feel most loved and appreciated when a partner...",
    options: ["Offers words of affirmation and encouragement", "Spends quality, uninterrupted time with you", "Does helpful things for you without being asked", "Gives you hugs and physical reassurance"],
  },
  {
    question: "What is your ideal approach to conflict in a relationship?",
    options: ["Address it directly and logically to find a solution.", "Take space to process, then discuss feelings and find a compromise.", "Use humor and lightheartedness to diffuse tension.", "Prioritize harmony and avoid confrontation if possible."],
  },
  {
    question: "In ten years, you most want your relationship to feel...",
    options: ["Exciting and full of new experiences.", "Deeply bonded and emotionally secure.", "A powerhouse partnership achieving shared goals.", "Peaceful, comfortable, and supportive."],
  },
];

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
            className="bg-rose-gold h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);


export const RelationshipNorthStarModal: React.FC<RelationshipNorthStarModalProps> = ({ onClose }) => {
    const [step, setStep] = useState(0); // 0 = quiz, 1 = loading, 2 = results
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [result, setResult] = useState<RelationshipNorthStarReport | null>(null);

    const handleAnswer = (answer: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestion]: answer }));
        if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };
    
    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = async () => {
        setStep(1); // Show loading screen
        const formattedAnswers: Record<string, string> = {};
        QUIZ_QUESTIONS.forEach((q, index) => {
            formattedAnswers[q.question] = answers[index];
        });
        
        try {
            const analysisResult = await generateRelationshipNorthStar(formattedAnswers);
            setResult(analysisResult);
        } catch (error) {
            console.error("Failed to generate north star analysis", error);
            setResult({
                title: "Analysis Error",
                coreDesire: "I'm having a little trouble with my compass right now. Please try again in a moment.",
                guidingValues: ["Retry", "Patience"],
                whatYouOffer: "The AI service might be temporarily unavailable.",
                whatYouSeek: "Please check your connection and try again."
            });
        }
        setStep(2); // Show results screen
    };

    const progressPercentage = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;
    const isLastQuestion = currentQuestion === QUIZ_QUESTIONS.length - 1;
    const allQuestionsAnswered = Object.keys(answers).length === QUIZ_QUESTIONS.length;
    
    const renderQuiz = () => {
        const q = QUIZ_QUESTIONS[currentQuestion];
        return (
            <>
                <div className="p-6 border-b border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-2xl font-bold font-serif text-deep-teal">Find Your North Star</h2>
                        <span className="font-semibold text-slate-500">{currentQuestion + 1} / {QUIZ_QUESTIONS.length}</span>
                    </div>
                    <ProgressBar progress={progressPercentage} />
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <h3 className="text-xl font-semibold text-center text-slate-800">{q.question}</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {q.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(option)}
                                className={`w-full text-left p-4 border rounded-lg transition-all duration-200 text-slate-700
                                    ${answers[currentQuestion] === option
                                        ? 'bg-rose-gold/20 border-rose-gold ring-2 ring-rose-gold'
                                        : 'bg-white hover:bg-rose-gold/10 hover:border-rose-gold/50 border-slate-300'
                                    }
                                `}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="p-6 mt-auto border-t border-slate-200 flex justify-between items-center">
                    <Button variant="ghost" onClick={handleBack} disabled={currentQuestion === 0}>
                        Back
                    </Button>
                    {isLastQuestion && (
                        <Button onClick={handleSubmit} disabled={!allQuestionsAnswered}>
                            Discover My North Star
                        </Button>
                    )}
                </div>
            </>
        )
    };
    
    const renderLoading = () => (
        <div className="flex flex-col items-center justify-center text-center p-8 h-full">
            <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
            <p className="mt-4 text-xl font-semibold text-deep-teal">Consulting the stars...</p>
            <p className="text-slate-500">Our AI Coach is charting your relationship map.</p>
        </div>
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

    const renderResults = () => {
        if (!result) return renderLoading();
        return (
             <>
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal text-center">Your Relationship North Star</h2>
                </div>
                <div className="p-6 overflow-y-auto space-y-5">
                    <div className="text-center p-6 bg-cream rounded-xl">
                        <CompassIcon className="w-12 h-12 mx-auto text-rose-gold" />
                        <h3 className="text-3xl font-bold font-serif text-deep-teal mt-3">{result.title}</h3>
                        <p className="mt-3 text-slate-700 font-semibold italic">"{result.coreDesire}"</p>
                    </div>
                    
                    <ResultCard icon={<StarIcon className="w-5 h-5"/>} title="Your Guiding Values">
                        <div className="flex flex-wrap gap-2">
                            {result.guidingValues.map((value, index) => (
                                <span key={index} className="bg-rose-gold/20 text-rose-gold-darker font-semibold text-sm px-3 py-1 rounded-full">{value}</span>
                            ))}
                        </div>
                    </ResultCard>

                    <ResultCard icon={<GiftIcon className="w-5 h-5"/>} title="What You Offer">
                        <p>{result.whatYouOffer}</p>
                    </ResultCard>
                    
                    <ResultCard icon={<EyeIcon className="w-5 h-5"/>} title="What You Seek">
                        <p>{result.whatYouSeek}</p>
                    </ResultCard>
                </div>
                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="primary" onClick={onClose}>Done</Button>
                </div>
             </>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
                {step === 0 && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 z-10">
                        <CloseIcon />
                    </button>
                )}
                {step === 0 && renderQuiz()}
                {step === 1 && renderLoading()}
                {step === 2 && renderResults()}
            </div>
        </div>
    );
};
