

import React from 'react';
import { UserProfile } from '../types';
import { ProfileCard } from './ProfileCard';
import { SparklesIcon } from './IconComponents';

interface DailyPicksSectionProps {
  picks: UserProfile[];
  isLoading: boolean;
  onViewProfile: (id: number) => void;
  likedProfiles: Set<number>;
  onLikeToggle: (id: number) => void;
  onExplainMatch: (profileId: number) => void;
}

const ProfileCardSkeleton: React.FC = () => (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
        <div className="bg-gray-300 w-full h-64"></div>
        <div className="p-5">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-10 bg-gray-300 rounded w-full mb-4"></div>
            <div className="h-9 bg-gray-300 rounded-lg w-full"></div>
        </div>
    </div>
);


export const DailyPicksSection: React.FC<DailyPicksSectionProps> = ({ picks, isLoading, onViewProfile, likedProfiles, onLikeToggle, onExplainMatch }) => {
    if (isLoading) {
        return (
            <div className="mb-12">
                <h2 className="text-3xl font-bold font-serif text-gray-800 mb-2 text-center">Your AI-Curated Daily Picks</h2>
                <p className="text-gray-500 mt-1 mb-6 text-center">Our AI is finding your most compatible matches...</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <ProfileCardSkeleton />
                    <ProfileCardSkeleton />
                    <ProfileCardSkeleton />
                </div>
            </div>
        );
    }

    if (picks.length === 0) {
        return null; // Don't show the section if there are no picks and it's not loading
    }
    
    return (
        <div className="mb-12">
            <h2 className="text-3xl font-bold font-serif text-gray-800 mb-2 text-center flex items-center justify-center gap-3">
                <SparklesIcon className="w-7 h-7 text-brand-primary" />
                <span>Your AI-Curated Daily Picks</span>
            </h2>
            <p className="text-gray-500 mt-1 mb-6 text-center">Selected just for you by SoulMate AI. New picks tomorrow!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {picks.map(profile => (
                    <ProfileCard
                        key={profile.id}
                        profile={profile}
                        onViewProfile={onViewProfile}
                        isCurrentUser={false}
                        isLiked={likedProfiles.has(profile.id)}
                        onLikeToggle={onLikeToggle}
                        isTopPick={true}
                        onExplainMatch={onExplainMatch}
                    />
                ))}
            </div>
        </div>
    );
};