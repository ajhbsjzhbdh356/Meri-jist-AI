import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { SparklesIcon, EditIcon, CloseIcon } from './IconComponents';
import { generateInterestTags } from '../services/geminiService';

interface InterestTagsSectionProps {
    profile: UserProfile;
    isMyProfile: boolean;
    onUpdateProfile: (id: number, updates: Partial<UserProfile>) => void;
}

export const InterestTagsSection: React.FC<InterestTagsSectionProps> = ({ profile, isMyProfile, onUpdateProfile }) => {
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [editableTags, setEditableTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);

    const handleGenerateTags = async () => {
        setIsGeneratingTags(true);
        try {
            const tags = await generateInterestTags(profile);
            onUpdateProfile(profile.id, { interestTags: tags });
        } catch (error) {
            console.error("Failed to generate interest tags", error);
            // Optionally, show an error to the user
        }
        setIsGeneratingTags(false);
    };

    const handleEditTags = () => {
        setEditableTags(profile.interestTags || []);
        setIsEditingTags(true);
    };

    const handleCancelEditTags = () => {
        setIsEditingTags(false);
        setNewTag('');
    };

    const handleSaveTags = () => {
        onUpdateProfile(profile.id, { interestTags: editableTags });
        setIsEditingTags(false);
        setNewTag('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setEditableTags(editableTags.filter(tag => tag !== tagToRemove));
    };

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTag.trim() && !editableTags.map(t => t.toLowerCase()).includes(newTag.trim().toLowerCase())) {
            setEditableTags([...editableTags, newTag.trim()]);
            setNewTag('');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold font-serif text-deep-teal">Interests & Hobbies</h3>
                {isMyProfile && !isEditingTags && (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={handleGenerateTags} leftIcon={<SparklesIcon />} disabled={isGeneratingTags}>
                            {isGeneratingTags ? 'Generating...' : (profile.interestTags && profile.interestTags.length > 0 ? 'Regenerate' : 'Generate with AI')}
                        </Button>
                        <Button variant="ghost" onClick={handleEditTags} leftIcon={<EditIcon />}>
                            Edit
                        </Button>
                    </div>
                )}
            </div>
            <div className="text-slate-700 space-y-2 min-h-[50px]">
                {isEditingTags ? (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {editableTags.map((tag, index) => (
                                <span key={index} className="bg-rose-gold/10 text-rose-gold text-sm font-semibold pl-3 pr-2 py-1.5 rounded-full flex items-center gap-2 animate-in fade-in duration-300">
                                    {tag}
                                    <button onClick={() => handleRemoveTag(tag)} className="bg-rose-gold/20 hover:bg-rose-gold/40 rounded-full p-0.5" aria-label={`Remove tag ${tag}`}>
                                        <CloseIcon className="w-3 h-3"/>
                                    </button>
                                </span>
                            ))}
                            {editableTags.length === 0 && <p className="text-slate-500 italic">No tags yet. Add one below.</p>}
                        </div>
                        <form onSubmit={handleAddTag} className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="Add a new tag"
                                className="flex-grow p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                                aria-label="New interest tag"
                            />
                            <Button type="submit" variant="secondary" className="!px-4 !py-2">Add</Button>
                        </form>
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                            <Button variant="secondary" onClick={handleCancelEditTags}>Cancel</Button>
                            <Button onClick={handleSaveTags}>Save Changes</Button>
                        </div>
                    </div>
                ) : isGeneratingTags && (!profile.interestTags || profile.interestTags.length === 0) ? (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                        <SparklesIcon className="w-10 h-10 text-rose-gold animate-pulse" />
                        <p className="mt-2 text-deep-teal font-semibold">AI is analyzing the profile...</p>
                    </div>
                ) : profile.interestTags && profile.interestTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {profile.interestTags.map((tag, index) => (
                            <span key={index} className="bg-rose-gold/10 text-rose-gold text-sm font-semibold px-3 py-1.5 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                ) : isMyProfile ? (
                    <div className="text-center py-4">
                        <p className="text-slate-600">Generate interest tags with AI or click 'Edit' to add them manually.</p>
                    </div>
                ) : (
                    <p className="text-slate-500 italic text-center py-4">This user hasn't added any interest tags yet.</p>
                )}
            </div>
        </div>
    );
};