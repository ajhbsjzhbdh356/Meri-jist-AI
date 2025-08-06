import React from 'react';
import { Prompt } from '../types';
import { Button } from './Button';
import { EditIcon, ChatBubbleBottomCenterTextIcon } from './IconComponents';

interface PromptSectionProps {
    prompts: Prompt[];
    isMyProfile: boolean;
    onEdit: () => void;
}

const PromptCard: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
    <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
        <h4 className="font-semibold text-deep-teal mb-2">{question}</h4>
        <p className="text-slate-700 italic">"{answer}"</p>
    </div>
);

export const PromptSection: React.FC<PromptSectionProps> = ({ prompts, isMyProfile, onEdit }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold font-serif text-deep-teal">My Prompts</h3>
                {isMyProfile && (
                    <Button variant="ghost" onClick={onEdit} leftIcon={<EditIcon />}>Edit</Button>
                )}
            </div>
            {prompts && prompts.length > 0 ? (
                <div className="space-y-4">
                    {prompts.map(prompt => (
                        <PromptCard key={prompt.id} question={prompt.question} answer={prompt.answer} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-slate-500 italic">
                    <ChatBubbleBottomCenterTextIcon className="w-12 h-12 mx-auto text-slate-400" />
                    <p className="mt-2">
                        {isMyProfile ? "Add some prompts to show more of your personality!" : "This user hasn't added any prompts yet."}
                    </p>
                </div>
            )}
        </div>
    );
};