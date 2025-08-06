import React from 'react';
import { VideoCallReport } from '../types';
import { SparklesIcon, CheckCircleIcon, LightBulbIcon } from './IconComponents';

interface VideoCallReportCardProps {
    report: VideoCallReport;
}

export const VideoCallReportCard: React.FC<VideoCallReportCardProps> = ({ report }) => {
    
    const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
        <div>
            <h4 className="font-semibold text-ghost-white mb-2 flex items-center gap-2">
                {icon}
                {title}
            </h4>
            <ul className="space-y-1.5 pl-7 text-sm text-slate-gray">
                {children}
            </ul>
        </div>
    );
    
    return (
        <div className="text-center my-4">
            <div className="inline-block p-6 bg-midnight-blue border border-slate-gray/50 rounded-2xl text-ghost-white max-w-lg mx-auto shadow-lg text-left space-y-5">
                <div className="text-center border-b border-slate-gray/50 pb-5">
                     <h3 className="text-2xl font-bold font-serif text-ghost-white">Post-Call Debrief</h3>
                     <p className="text-slate-gray text-sm">Here's our AI's take on your recent video call.</p>
                </div>
               
                <div className="text-center p-4 bg-space-cadet/60 rounded-xl">
                    <p className="text-sm font-semibold text-slate-gray">VIBE</p>
                    <p className="text-xl font-bold text-electric-pink">{report.vibe}</p>
                </div>

                <DetailSection title="Potential Positive Moments" icon={<CheckCircleIcon className="w-5 h-5 text-green-400"/>}>
                    {report.positiveMoments.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <span>-</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </DetailSection>
                
                <div className="pt-5 border-t border-slate-gray/50">
                    <h4 className="font-semibold text-ghost-white mb-2 flex items-center gap-2">
                         <LightBulbIcon className="w-5 h-5 text-electric-pink"/>
                         Suggested Next Step
                    </h4>
                    <div className="p-3 bg-space-cadet/70 rounded-lg">
                        <p className="text-slate-gray italic">"{report.nextStepSuggestion}"</p>
                    </div>
                </div>
            </div>
        </div>
    )
};