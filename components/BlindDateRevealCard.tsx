
import React from 'react';
import { BlindDateRevealReport } from '../types';
import { Button } from './Button';
import { CircularProgress, CheckCircleIcon, SparklesIcon, PaperAirplaneIcon, HeartIcon } from './IconComponents';

interface BlindDateRevealCardProps {
    report: BlindDateRevealReport;
    onSendIcebreaker: (text: string) => void;
}

export const BlindDateRevealCard: React.FC<BlindDateRevealCardProps> = ({ report, onSendIcebreaker }) => {
    
    const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
        <div>
            <h4 className="font-semibold text-deep-teal mb-2 flex items-center gap-2">
                {icon}
                {title}
            </h4>
            <ul className="space-y-1.5 pl-7 text-sm text-slate-700">
                {children}
            </ul>
        </div>
    );
    
    return (
        <div className="text-center my-4">
            <div className="inline-block p-6 bg-cream border-2 border-rose-gold rounded-2xl text-deep-teal max-w-lg mx-auto shadow-xl text-left space-y-5">
                <div className="text-center border-b border-dusty-rose/50 pb-5">
                     <h3 className="text-2xl font-bold font-serif text-deep-teal">It's a Reveal!</h3>
                     <p className="text-slate-600 text-sm">You can now see each other's profiles. Here's what our AI thinks of your connection.</p>
                </div>
               
                <div className="flex flex-col items-center text-center">
                    <CircularProgress className="w-28 h-28" progress={report.compatibilityScore} viewBoxSize={120} strokeWidth={10}>
                        <div>
                            <span className="text-3xl font-bold text-deep-teal">{report.compatibilityScore}</span>
                            <span className="text-lg font-semibold text-deep-teal/80">%</span>
                        </div>
                    </CircularProgress>
                    <p className="mt-2 text-lg font-bold text-deep-teal">AI Compatibility Score</p>
                </div>

                <DetailSection title="Conversation Highlights" icon={<CheckCircleIcon className="w-5 h-5 text-green-600"/>}>
                    {report.conversationHighlights.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span className='font-serif text-green-700'>✓</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </DetailSection>

                <DetailSection title="Shared Interests" icon={<HeartIcon className="w-5 h-5 text-rose-gold"/>}>
                    {report.sharedInterests.map((item, i) => (
                         <li key={i} className="flex items-start gap-2">
                            <span className='font-serif text-rose-gold'>♥</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </DetailSection>
                
                <div className="pt-5 border-t border-dusty-rose/50">
                    <h4 className="font-semibold text-deep-teal mb-2 flex items-center gap-2">
                         <SparklesIcon className="w-5 h-5 text-rose-gold"/>
                         Your Next Icebreaker
                    </h4>
                    <div className="p-3 bg-white/70 rounded-lg">
                        <p className="text-slate-800 italic">"{report.nextIcebreaker}"</p>
                    </div>
                     <Button 
                        onClick={() => onSendIcebreaker(report.nextIcebreaker)}
                        leftIcon={<PaperAirplaneIcon className="w-5 h-5"/>}
                        className="w-full mt-3"
                    >
                        Send this message
                    </Button>
                </div>
            </div>
        </div>
    )
};