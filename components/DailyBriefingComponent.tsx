

import React from 'react';
import { DailyBriefing } from '../types';
import { PencilIcon, LightBulbIcon } from './IconComponents';

const BriefingCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white p-4 rounded-lg border border-brand-primary/30 flex-grow">
        <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 text-brand-primary">{icon}</div>
            <h4 className="font-semibold text-gray-800">{title}</h4>
        </div>
        <p className="text-gray-500 text-sm pl-9">{children}</p>
    </div>
);

export const DailyBriefingComponent: React.FC<{ briefing: DailyBriefing | null, isLoading: boolean }> = ({ briefing, isLoading }) => {
    if (isLoading) {
        return (
            <div>
                 <h2 className="text-2xl font-bold font-serif text-gray-800 mb-3">Your Daily Briefing</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 h-24 animate-pulse"></div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 h-24 animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (!briefing) return null;

    return (
        <div>
             <h2 className="text-2xl font-bold font-serif text-gray-800 mb-3">Your Daily Briefing</h2>
            <div className="flex flex-col md:flex-row gap-4">
                <BriefingCard icon={<PencilIcon className="w-5 h-5"/>} title="Profile Tip of the Day">
                    {briefing.profileTip}
                </BriefingCard>
                <BriefingCard icon={<LightBulbIcon className="w-5 h-5"/>} title="Conversation Starter Idea">
                    {briefing.conversationStarter}
                </BriefingCard>
            </div>
        </div>
    );
};