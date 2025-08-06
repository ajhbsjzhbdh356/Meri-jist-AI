

import React from 'react';
import { HomeIcon, HeartIcon, ChatBubbleLeftRightIcon, SparklesIcon, TrophyIcon, BookOpenIcon } from './IconComponents';
import { UserProfile } from '../types';
import { Button } from './Button';

interface HeaderProps {
    view: 'home' | 'matches' | 'chats' | 'coach' | 'game' | 'journal';
    onViewChange: (view: 'home' | 'matches' | 'chats' | 'coach' | 'game' | 'journal') => void;
    chatNotificationCount?: number;
    user: UserProfile;
    onLogout: () => void;
}

const NavButton: React.FC<{
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon: React.ReactNode;
    notificationCount?: number;
}> = ({ isActive, onClick, children, icon, notificationCount }) => {
    const baseClasses = "relative flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 focus:outline-none";
    const activeClasses = "bg-brand-primary/10 text-brand-primary";
    const inactiveClasses = "text-gray-500 hover:bg-brand-primary/10";

    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {icon}
            <span className="hidden sm:inline">{children}</span>
            {notificationCount && notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary text-white text-xs font-bold ring-2 ring-white">
                    {notificationCount}
                </span>
            )}
        </button>
    )
}

export const Header: React.FC<HeaderProps> = ({ view, onViewChange, chatNotificationCount, user, onLogout }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-800 cursor-pointer" onClick={() => onViewChange('home')}>
            <HeartIcon className="w-7 h-7 text-brand-primary mr-2" />
            <h1 className="text-2xl font-serif font-bold">
              SoulMate <span className="text-brand-primary">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center space-x-1 sm:space-x-2">
                 <NavButton
                  isActive={view === 'home'}
                  onClick={() => onViewChange('home')}
                  icon={<HomeIcon className="w-5 h-5"/>}
                >
                    Home
                </NavButton>
                <NavButton
                  isActive={view === 'matches'}
                  onClick={() => onViewChange('matches')}
                  icon={<HeartIcon className="w-5 h-5"/>}
                >
                    Matches
                </NavButton>
                <NavButton
                  isActive={view === 'chats'}
                  onClick={() => onViewChange('chats')}
                  icon={<ChatBubbleLeftRightIcon className="w-5 h-5"/>}
                  notificationCount={chatNotificationCount}
                >
                    Chats
                </NavButton>
                <NavButton
                  isActive={view === 'game'}
                  onClick={() => onViewChange('game')}
                  icon={<TrophyIcon className="w-5 h-5"/>}
                >
                    Game
                </NavButton>
                <NavButton
                  isActive={view === 'journal'}
                  onClick={() => onViewChange('journal')}
                  icon={<BookOpenIcon className="w-5 h-5"/>}
                >
                    Journal
                </NavButton>
                <NavButton
                  isActive={view === 'coach'}
                  onClick={() => onViewChange('coach')}
                  icon={<SparklesIcon className="w-5 h-5"/>}
                >
                    AI Coach
                </NavButton>
            </nav>
            <div className="flex items-center gap-2 border-l border-gray-200 pl-2 sm:pl-4">
              <div className="hidden sm:flex items-center gap-2">
                  <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full object-cover"/>
                  <span className="font-semibold text-sm text-gray-800 whitespace-nowrap">{user.name.split(' ')[0]}</span>
              </div>
              <Button variant="secondary" onClick={onLogout} className="!px-3 !py-1.5 !text-xs sm:!text-sm sm:!px-4 sm:!py-2">Logout</Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};