
import React, { useState } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, CheckCircleIcon, LightBulbIcon } from './IconComponents';
import { auditFirstMessage } from '../services/geminiService';
import { FirstMessageAuditReport } from '../types';

interface FirstMessageAuditorModalProps {
  onClose: () => void;
}

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const getScoreColor = () => {
        if (score >= 8) return 'text-green-500';
        if (score >= 5) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="relative w-24 h-24">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                    className="text-slate-200"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <path
                    className={getScoreColor()}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${score * 10}, 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                />
            </svg>
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${getScoreColor()}`}>
                <span className="text-3xl font-bold">{score}</span>
                <span className="text-xs font-semibold">/ 10</span>
            </div>
        </div>
    );
};

export const FirstMessageAuditorModal: React.FC<FirstMessageAuditorModalProps> = ({ onClose }) => {
    const [matchContext, setMatchContext] = useState('');
    const [userMessage, setUserMessage] = useState('');
    const [report, setReport] = useState<FirstMessageAuditReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAudit = async () => {
        if (!userMessage.trim()) return;
        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            const result = await auditFirstMessage(matchContext, userMessage);
            setReport(result);
        } catch (err) {
            setError("Sorry, the AI couldn't provide feedback right now. Please try again later.");
            console.error(err);
        }
        setIsLoading(false);
    };

    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Maybe show a small "Copied!" notification
    };
    
    const resetForm = () => {
        setMatchContext('');
        setUserMessage('');
        setReport(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">AI First Message Auditor</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {!report && !isLoading && (
                        <div className="space-y-4">
                            <p className="text-slate-600">Get an AI-powered review of your opening message to make the best first impression.</p>
                             <div>
                                <label htmlFor="matchContext" className="block text-sm font-semibold text-slate-700 mb-1">Match's Bio/Interests (Optional)</label>
                                <textarea
                                    id="matchContext"
                                    value={matchContext}
                                    onChange={(e) => setMatchContext(e.target.value)}
                                    placeholder="Paste their bio here for better feedback..."
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label htmlFor="userMessage" className="block text-sm font-semibold text-slate-700 mb-1">Your First Message Draft</label>
                                <textarea
                                    id="userMessage"
                                    value={userMessage}
                                    onChange={(e) => setUserMessage(e.target.value)}
                                    placeholder="e.g., Hey, I saw you like hiking too! What's your favorite trail?"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}
                    
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
                            <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                            <p className="mt-4 text-xl font-semibold text-deep-teal">Auditing your message...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">
                            <p className="font-bold">An Error Occurred</p>
                            <p>{error}</p>
                            <Button variant="secondary" onClick={resetForm} className="mt-4">Try Again</Button>
                        </div>
                    )}

                    {report && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-cream p-6 rounded-xl">
                                <div className="flex-shrink-0">
                                    <ScoreCircle score={report.score} />
                                </div>
                                <div className="flex-1 space-y-4 text-center md:text-left">
                                     <div>
                                        <h4 className="font-semibold text-lg text-deep-teal flex items-center gap-2 justify-center md:justify-start"><CheckCircleIcon className="w-6 h-6 text-green-500" /> What's Working Well</h4>
                                        <ul className="list-disc list-inside text-slate-700 mt-1">
                                            {report.whatWorks.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg text-deep-teal flex items-center gap-2 justify-center md:justify-start"><LightBulbIcon className="w-6 h-6 text-yellow-500" /> Suggestions for Improvement</h4>
                                        <ul className="list-disc list-inside text-slate-700 mt-1">
                                            {report.suggestions.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                             <div>
                                <h3 className="text-xl font-bold font-serif text-deep-teal mb-3">AI-Powered Alternatives</h3>
                                <div className="space-y-3">
                                    {report.alternatives.map((alt, i) => (
                                        <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-start gap-4">
                                            <p className="italic text-slate-800">"{alt}"</p>
                                            <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => handleCopyToClipboard(alt)}>Copy</Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    {report ? (
                         <Button variant="secondary" onClick={resetForm}>Audit Another Message</Button>
                    ) : (
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    )}

                    <Button 
                        onClick={report ? onClose : handleAudit} 
                        disabled={isLoading || (!report && !userMessage.trim())}
                    >
                        {report ? 'Close' : 'Get AI Feedback'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
