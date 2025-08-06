import React, { useState } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, LightBulbIcon, ChatBubbleBottomCenterTextIcon, UsersIcon } from './IconComponents';
import { generatePeaceKeeperResponse } from '../services/geminiService';
import { PeaceKeeperReport } from '../types';

interface PeaceKeeperModalProps {
  onClose: () => void;
}

const ResultCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
        <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 text-rose-gold">{icon}</div>
            <h4 className="font-semibold text-deep-teal">{title}</h4>
        </div>
        <div className="pl-9 text-slate-700">{children}</div>
    </div>
);


export const PeaceKeeperModal: React.FC<PeaceKeeperModalProps> = ({ onClose }) => {
    const [whatHappened, setWhatHappened] = useState('');
    const [whatIWantToSay, setWhatIWantToSay] = useState('');
    const [report, setReport] = useState<PeaceKeeperReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!whatIWantToSay.trim()) return;
        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            const result = await generatePeaceKeeperResponse(whatHappened, whatIWantToSay);
            setReport(result);
        } catch (err) {
            setError("Sorry, the AI couldn't generate advice right now. Please try again later.");
            console.error(err);
        }
        setIsLoading(false);
    };

    const reset = () => {
        setWhatHappened('');
        setWhatIWantToSay('');
        setReport(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-rose-gold" />
                        AI Peace Keeper
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    {!report && !isLoading && (
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
                        </div>
                    )}
                    
                    {isLoading && (
                         <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
                            <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                            <p className="mt-4 text-xl font-semibold text-deep-teal">Finding the right words...</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">
                            <p className="font-bold">An Error Occurred</p>
                            <p>{error}</p>
                            <Button variant="secondary" onClick={reset} className="mt-4">Try Again</Button>
                        </div>
                    )}

                    {report && (
                        <div className="space-y-5">
                            <ResultCard icon={<ChatBubbleBottomCenterTextIcon className="w-6 h-6" />} title="A Gentler Way to Say It">
                                <p className="italic font-semibold">"{report.reframedMessage}"</p>
                            </ResultCard>
                            <ResultCard icon={<LightBulbIcon className="w-6 h-6" />} title="Talking Points">
                                <ul className="list-disc list-inside space-y-1">
                                    {report.talkingPoints.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </ResultCard>
                            <ResultCard icon={<UsersIcon className="w-6 h-6" />} title="Your Partner's Perspective">
                                <p>{report.partnerPerspective}</p>
                            </ResultCard>
                        </div>
                    )}
                </div>

                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    {report ? (
                         <Button variant="secondary" onClick={reset}>Start Over</Button>
                    ) : (
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    )}

                    <Button 
                        onClick={report ? onClose : handleGenerate} 
                        disabled={isLoading || (!report && !whatIWantToSay.trim())}
                    >
                        {report ? 'Close' : 'Get AI Advice'}
                    </Button>
                </div>
            </div>
        </div>
    );
};