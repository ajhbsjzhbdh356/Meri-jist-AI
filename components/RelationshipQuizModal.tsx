

import React, { useState } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon } from './IconComponents';
import { QuizResult } from '../types';
import { generateQuizAnalysis } from '../services/geminiService';

interface RelationshipQuizModalProps {
  onClose: () => void;
}

const QUIZ_QUESTIONS = [
  {
    question: "When you think about an ideal relationship, what's your primary focus?",
    options: ["Deep emotional connection and shared values.", "Excitement, passion, and adventure.", "A supportive partnership, like being on the same team.", "Companionship and someone to share daily life with."],
  },
  {
    question: "How do you typically approach disagreements with a partner?",
    options: ["I prefer to talk it through calmly and find a solution together.", "I need some time to cool off and process before I can talk.", "I tend to avoid conflict and hope it goes away.", "I express my feelings openly and passionately in the moment."],
  },
  {
    question: "What role does your career currently play in your life?",
    options: ["It's a major focus, and I'm very ambitious.", "It's important, but I prioritize a healthy work-life balance.", "It's just a job; my personal life comes first.", "I'm still exploring my career path."],
  },
  {
    question: "How do you feel about personal growth within a relationship?",
    options: ["I want a partner who will grow with me and challenge me.", "I'm focused on my own growth, and a partner should support that.", "I'm content with who I am and want a partner who is too.", "Relationships are about comfort, not constant change."],
  },
  {
    question: "A perfect weekend with a partner looks like:",
    options: ["A spontaneous road trip to somewhere new.", "Cozying up at home with a movie and takeout.", "A mix of social time with friends and some quiet one-on-one time.", "Working on a shared project or hobby together."],
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


export const RelationshipQuizModal: React.FC<RelationshipQuizModalProps> = ({ onClose }) => {
    const [step, setStep] = useState(0); // 0 = quiz, 1 = loading, 2 = results
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [result, setResult] = useState<QuizResult | null>(null);

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
            const analysisResult = await generateQuizAnalysis(formattedAnswers);
            setResult(analysisResult);
        } catch (error) {
            console.error("Failed to generate quiz analysis", error);
            setResult({
                profileTitle: "Analysis Error",
                analysis: "I'm having a little trouble analyzing your results right now. Please try again in a moment.",
                tips: ["Check your connection and try again.", "If the problem persists, the AI service might be temporarily unavailable.", "You can still browse profiles while you wait!"]
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
                        <h2 className="text-2xl font-bold font-serif text-deep-teal">Relationship Readiness Quiz</h2>
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
                            Get My Results
                        </Button>
                    )}
                </div>
            </>
        )
    };
    
    const renderLoading = () => (
        <div className="flex flex-col items-center justify-center text-center p-8 h-full">
            <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
            <p className="mt-4 text-xl font-semibold text-deep-teal">Analyzing your answers...</p>
            <p className="text-slate-500">Our AI Coach is preparing your personalized feedback.</p>
        </div>
    );
    
    const renderResults = () => {
        if (!result) return renderLoading();
        return (
             <>
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal text-center">Your Readiness Profile</h2>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="text-center p-6 bg-cream rounded-xl">
                        <h3 className="text-3xl font-bold font-serif text-rose-gold">{result.profileTitle}</h3>
                        <p className="mt-3 text-slate-700">{result.analysis}</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-deep-teal mb-3">Your Personalized Tips:</h4>
                        <ul className="space-y-3">
                            {result.tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <SparklesIcon className="w-5 h-5 text-rose-gold mt-1 flex-shrink-0"/>
                                    <span className="text-slate-700">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
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
