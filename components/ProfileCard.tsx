

import React from 'react';
import { UserProfile, DynamicBadgeType } from '../types';
import { HeartIcon, HeartOutlineIcon, SparklesIcon, ChatBubbleBottomCenterTextIcon, QuestionMarkCircleIcon, PencilIcon, ShieldCheckIcon } from './IconComponents';
import { getBadgeById } from './GameView';

interface ProfileCardProps {
  profile: UserProfile;
  onViewProfile: (id: number) => void;
  isCurrentUser?: boolean;
  isLiked: boolean;
  onLikeToggle: (id: number) => void;
  isTopPick?: boolean;
  onExplainMatch?: (profileId: number) => void;
}

const Badge: React.FC<{badge?: UserProfile['dynamicBadge']}> = ({ badge }) => {
    if (!badge) return null;

    const badgeIcons: Record<DynamicBadgeType, React.ReactNode> = {
        GREAT_CHATTER: <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />,
        PROMPT_PRO: <PencilIcon className="w-4 h-4" />,
        VERIFIED_PROFILER: <ShieldCheckIcon className="w-4 h-4" />,
    };
    
    return (
         <div className="bg-brand-secondary/10 text-brand-secondary text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md animate-in fade-in slide-in-from-top-2 duration-500">
            {badgeIcons[badge.type]}
            <span>{badge.text}</span>
        </div>
    );
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onViewProfile, isCurrentUser = false, isLiked, onLikeToggle, isTopPick = false, onExplainMatch }) => {
  const cardClasses = `bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 ease-in-out group ${isCurrentUser ? 'border-2 border-brand-primary' : 'border border-gray-200'}`;
  const buttonClasses = `w-full font-semibold py-2.5 rounded-lg transition-colors duration-200 ${isCurrentUser ? 'bg-transparent text-brand-secondary border border-brand-secondary hover:bg-brand-secondary/20' : 'bg-brand-primary text-white hover:bg-brand-primary/90'}`;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event when liking
    onLikeToggle(profile.id);
  };

  const handleExplainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(onExplainMatch) {
      onExplainMatch(profile.id);
    }
  };

  const equippedBadgeData = profile.equippedBadge ? getBadgeById(profile.equippedBadge) : null;
  const EquippedBadgeIcon = equippedBadgeData ? equippedBadgeData.icon : null;

  return (
    <div className={cardClasses}>
      <div className="relative">
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            {isTopPick && !isCurrentUser && (
                <div className="bg-brand-primary text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                    <SparklesIcon className="w-3 h-3" />
                    <span>Top Pick</span>
                </div>
            )}
             {isTopPick && onExplainMatch && !isCurrentUser && (
                 <button 
                    onClick={handleExplainClick}
                    className="bg-gray-800/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md hover:bg-gray-800/70 transition-colors animate-in fade-in slide-in-from-top-2 duration-500"
                  >
                    <QuestionMarkCircleIcon className="w-4 h-4 text-brand-primary" />
                    <span>Why this pick?</span>
                </button>
            )}
            {!isCurrentUser && <Badge badge={profile.dynamicBadge} />}
        </div>
        <img className="w-full h-64 object-cover" src={profile.profilePicture} alt={profile.name} />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-bold text-white font-serif">{profile.name}, {profile.age}</h3>
              <p className="text-white/90 text-sm">{profile.city}</p>
            </div>
             {EquippedBadgeIcon && (
                <div title={equippedBadgeData!.name}>
                    <div className="bg-white/30 backdrop-blur-md p-1.5 rounded-full shadow-lg">
                        <EquippedBadgeIcon className="w-7 h-7 text-brand-secondary" />
                    </div>
                </div>
            )}
        </div>
        {!isCurrentUser && (
            <button 
                onClick={handleLikeClick}
                className="absolute top-4 right-4 bg-white/50 backdrop-blur-sm p-2 rounded-full text-white cursor-pointer hover:bg-white/70 transition-colors duration-200 transform hover:scale-110 active:scale-95 z-10"
                aria-label={isLiked ? 'Unlike' : 'Like'}
            >
                {isLiked ? <HeartIcon className="w-6 h-6 text-brand-primary" /> : <HeartOutlineIcon className="w-6 h-6 text-gray-800" />}
            </button>
        )}
      </div>
      <div className="p-5">
        <p className="text-gray-500 text-sm mb-4 h-10 overflow-hidden">{profile.bio}</p>
        <button
          onClick={() => onViewProfile(profile.id)}
          className={buttonClasses}
        >
          {isCurrentUser ? 'View My Profile' : 'View Profile'}
        </button>
      </div>
    </div>
  );
};