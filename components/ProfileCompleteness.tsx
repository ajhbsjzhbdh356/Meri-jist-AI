
import React from 'react';
import { UserProfile } from '../types';
import { EditIcon } from './IconComponents';
import { Button } from './Button';

interface ProfileCompletenessProps {
  profile: UserProfile;
  onEditBio?: () => void;
  onEditStory?: () => void;
  onAddPhoto?: () => void;
  onImprove?: () => void;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-slate-gray/50 rounded-full h-2.5">
        <div 
            className="bg-electric-pink h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ profile, onEditBio, onEditStory, onAddPhoto, onImprove }) => {
    const completeness = {
        bio: profile.bio.length > 50 ? 30 : 0,
        story: profile.story.length > 100 ? 30 : 0,
        photos: Math.min(profile.photos.length / 3, 1) * 40,
    };

    const totalScore = Math.round(completeness.bio + completeness.story + completeness.photos);

    const getSuggestion = () => {
        if (completeness.bio === 0) {
            return {
                text: "Your bio is your introduction. Write a bit more about yourself!",
                action: onEditBio || onImprove,
                buttonText: onEditBio ? "Write Bio" : "Improve Profile"
            };
        }
        if (completeness.story === 0) {
            return {
                text: "A great story helps others connect with you. Share yours!",
                action: onEditStory || onImprove,
                buttonText: onEditStory ? "Write Story" : "Improve Profile"
            };
        }
        if (profile.photos.length < 3) {
            return {
                text: `Add ${3 - profile.photos.length} more photo(s) to show off your personality.`,
                action: onAddPhoto || onImprove,
                buttonText: onAddPhoto ? "Add Photos" : "Improve Profile"
            };
        }
        return null;
    }

    const suggestion = getSuggestion();

    return (
        <div className="bg-midnight-blue p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold font-serif text-ghost-white mb-3">Profile Completeness</h3>
            <div className="flex items-center gap-4 mb-3">
                <span className="text-2xl font-bold text-electric-pink">{totalScore}%</span>
                <ProgressBar progress={totalScore} />
            </div>
            {suggestion && suggestion.action && (
                <div className="mt-4 pt-4 border-t border-slate-gray/50 text-center">
                    <p className="text-slate-gray text-sm mb-4">{suggestion.text}</p>
                    <Button variant="secondary" onClick={suggestion.action} leftIcon={<EditIcon />}>
                        {suggestion.buttonText}
                    </Button>
                </div>
            )}
            {totalScore === 100 && (
                 <p className="text-center text-electric-pink font-semibold mt-4 pt-4 border-t border-slate-gray/50">
                    Your profile looks great! You're all set.
                 </p>
            )}
        </div>
    );
};