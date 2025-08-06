

import React from 'react';
import { UserProfile } from '../types';
import { SwipeableProfileCard } from './SwipeableProfileCard';
import { RewindIcon, CloseIcon, HeartIcon } from './IconComponents';

interface DiscoveryViewProps {
  users: UserProfile[];
  onSwipe: (userId: number, direction: 'left' | 'right') => void;
  onRewind: () => void;
  canRewind: boolean;
  onViewProfile: (id: number) => void;
}

const ActionButton: React.FC<{ 
    onClick: () => void; 
    children: React.ReactNode; 
    className?: string; 
    disabled?: boolean;
    badge?: React.ReactNode;
}> = ({ onClick, children, className = '', disabled = false, badge }) => (
    <div className="relative flex flex-col items-center">
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
            aria-disabled={disabled}
        >
            {children}
        </button>
        {badge}
    </div>
);

export const DiscoveryView: React.FC<DiscoveryViewProps> = ({ users, onSwipe, onRewind, canRewind, onViewProfile }) => {
    // We are only concerned with the top card for swiping
    const currentUser = users.length > 0 ? users[0] : null;
    const nextUser = users.length > 1 ? users[1] : null;

    const handleSwipe = (direction: 'left' | 'right') => {
        if (!currentUser) return;
        onSwipe(currentUser.id, direction);
    };

    const handleRewind = () => {
        if (canRewind) {
            onRewind();
        }
    };

    return (
        <div className="flex flex-col items-center justify-between flex-grow h-full max-h-[calc(100vh-250px)]">
            <div className="relative flex-grow flex items-center justify-center w-full max-w-sm min-h-[500px]">
                {users.length > 0 ? (
                    <>
                        {/* Render next card in the background for a stacked effect */}
                        {nextUser && (
                           <div className="absolute w-full h-full max-h-[500px] scale-95 top-4">
                                <SwipeableProfileCard
                                    key={nextUser.id}
                                    profile={nextUser}
                                    onSwipe={() => {}} // This card is not interactive
                                    onViewProfile={() => {}}
                                    active={false}
                                />
                            </div>
                        )}
                        {/* Render the active, swipeable card */}
                        {currentUser && (
                            <div className="absolute w-full h-full max-h-[500px]">
                                <SwipeableProfileCard
                                    key={currentUser.id}
                                    profile={currentUser}
                                    onSwipe={handleSwipe}
                                    onViewProfile={onViewProfile}
                                    active={true}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center p-8 bg-white/50 rounded-2xl">
                        <h3 className="text-2xl font-bold font-serif text-gray-800">You've seen everyone!</h3>
                        <p className="text-gray-500 mt-2">Check back later for new profiles. In the meantime, why not explore profiles you've already liked?</p>
                    </div>
                )}
            </div>

            <div className="flex justify-center items-end space-x-8 mt-6">
                <ActionButton 
                    onClick={handleRewind} 
                    className="bg-white text-brand-secondary" 
                    disabled={!canRewind}
                    badge={
                        <span className="mt-2 bg-brand-secondary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                            50 pts
                        </span>
                    }
                >
                    <RewindIcon className="w-8 h-8" />
                </ActionButton>
                <ActionButton onClick={() => handleSwipe('left')} className="bg-white text-brand-primary" disabled={!currentUser}>
                    <CloseIcon className="w-10 h-10" />
                </ActionButton>
                <ActionButton onClick={() => handleSwipe('right')} className="bg-white text-brand-secondary" disabled={!currentUser}>
                    <HeartIcon className="w-10 h-10" />
                </ActionButton>
            </div>
        </div>
    );
};