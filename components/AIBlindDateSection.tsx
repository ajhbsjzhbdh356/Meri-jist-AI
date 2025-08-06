

import React from 'react';
import { Button } from './Button';
import { SparklesIcon } from './IconComponents';

interface AIBlindDateSectionProps {
    onStart: () => void;
    isLoading: boolean;
}

export const AIBlindDateSection: React.FC<AIBlindDateSectionProps> = ({ onStart, isLoading }) => {
    return (
        <div className="my-12 p-8 bg-gradient-to-br from-brand-primary to-brand-secondary text-white rounded-2xl shadow-2xl text-center border border-white/30">
            <SparklesIcon className="w-12 h-12 mx-auto text-white" />
            <h2 className="text-3xl font-bold font-serif mt-4">AI Blind Date</h2>
            <p className="mt-2 mb-6 max-w-xl mx-auto text-white/80">
                Ready for an adventure? Let our AI match you with someone based purely on personality. You'll chat for a bit before your identities are revealed.
            </p>
            <Button 
                onClick={onStart} 
                disabled={isLoading}
                className="!py-3 !px-8 !text-base !bg-white !text-brand-primary"
            >
                {isLoading ? 'Finding Your Match...' : "I'm Feeling Brave"}
            </Button>
        </div>
    )
};