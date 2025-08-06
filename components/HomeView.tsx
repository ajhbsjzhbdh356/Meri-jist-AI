import React from 'react';
import { UserProfile, DailyBriefing, Conversation, WeeklyGoal } from '../types';
import { DailyBriefingComponent } from './DailyBriefingComponent';
import { SparklesIcon, HeartIcon, ChatBubbleLeftRightIcon, LightBulbIcon, TrophyIcon, CheckCircleIcon } from './IconComponents';
import { Button } from './Button';
import { ProfileCompleteness } from './ProfileCompleteness';

type View = 'home' | 'matches' | 'chats' | 'coach';

interface HomeViewProps {
    currentUser: UserProfile;
    briefing: DailyBriefing | null;
    isBriefingLoading: boolean;
    dailyPicks: UserProfile[];
    isFetchingPicks: boolean;
    conversations: Conversation[];
    allProfiles: UserProfile[];
    onViewChange: (view: View) => void;
    onSelectConversation: (id: string) => void;
    onOpenNudgeModal: () => void;
    setMatchesView: (view: 'discover' | 'explore') => void;
    onViewMyProfile: () => void;
    personalizedGreeting: string;
    weeklyGoal: WeeklyGoal | null;
    onCompleteGoal: () => void;
}

const HomeWidget: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string; }> = ({ title, icon, children, className }) => (
    <div className={`bg-white rounded-xl shadow-md ${className}`}>
        <div className="p-4 border-b border-brand-primary/30 flex items-center gap-3">
            <div className="text-brand-primary">{icon}</div>
            <h3 className="font-bold text-gray-800">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const WeeklyGoalWidget: React.FC<{
    goal: WeeklyGoal;
    onComplete: () => void;
    onNavigate: () => void;
}> = ({ goal, onComplete, onNavigate }) => {
    return (
        <div className={`p-6 rounded-2xl shadow-lg transition-all duration-500 ${goal.isComplete ? 'bg-gradient-to-br from-brand-secondary/20 to-brand-secondary/30' : 'bg-gradient-to-br from-brand-primary to-brand-secondary'}`}>
            <div className="flex items-start gap-4">
                <span className="text-4xl">{goal.isComplete ? '🎉' : goal.emoji}</span>
                <div className="flex-1">
                    <h3 className={`font-bold font-serif text-2xl ${goal.isComplete ? 'text-brand-secondary' : 'text-white'}`}>
                        {goal.isComplete ? "Goal Complete!" : "Goal of the Week"}
                    </h3>
                    <p className={`mt-1 ${goal.isComplete ? 'text-gray-700/80' : 'text-white/90'}`}>{goal.isComplete ? `Great job on completing your goal: "${goal.title}"` : goal.title}</p>
                </div>
                {goal.isComplete && <CheckCircleIcon className="w-10 h-10 text-brand-secondary flex-shrink-0" />}
            </div>
            {!goal.isComplete && (
                <div className="mt-4 pt-4 border-t border-white/30">
                    <p className="text-sm text-white/90 mb-4">{goal.description}</p>
                    <div className="flex gap-2">
                        <Button onClick={onNavigate} className="!bg-white !text-brand-primary flex-1">Let's Go</Button>
                        <Button onClick={onComplete} variant="ghost" className="!text-white hover:!bg-white/20 flex-1">Mark as Done</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export const HomeView: React.FC<HomeViewProps> = ({
    currentUser,
    briefing,
    isBriefingLoading,
    dailyPicks,
    isFetchingPicks,
    conversations,
    allProfiles,
    onViewChange,
    onSelectConversation,
    onOpenNudgeModal,
    setMatchesView,
    onViewMyProfile,
    personalizedGreeting,
    weeklyGoal,
    onCompleteGoal
}) => {
    const unreadConversations = conversations.filter(c => c.messages.some(m => !m.isRead && m.senderId !== currentUser.id)).slice(0, 3);
    const profilesById = Object.fromEntries(allProfiles.map(p => [p.id, p]));
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const hasStalledConversations = conversations.some(c => {
        if (c.messages.length < 4 || c.messages.length > 20) return false;
        const lastMessage = c.messages[c.messages.length - 1];
        return lastMessage.senderId !== currentUser.id && new Date(lastMessage.timestamp) < threeDaysAgo;
    });
    
    const completeness = {
        bio: currentUser.bio.length > 50 ? 30 : 0,
        story: currentUser.story.length > 100 ? 30 : 0,
        photos: Math.min(currentUser.photos.length / 3, 1) * 40,
    };
    const totalScore = Math.round(completeness.bio + completeness.story + completeness.photos);
    const isProfileIncomplete = totalScore < 100;

    const handleGoalNavigate = () => {
        if (!weeklyGoal) return;

        switch (weeklyGoal.featureTarget) {
            case 'PROFILE':
                onViewMyProfile();
                break;
            case 'MATCHES':
                setMatchesView('explore');
                onViewChange('matches');
                break;
            case 'CHATS':
                onViewChange('chats');
                break;
            case 'COACH':
                onViewChange('coach');
                break;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold font-serif text-gray-800 mb-2">{personalizedGreeting || `Welcome back, ${currentUser.name}!`}</h1>
            <p className="text-gray-500 mb-8">Here's your dashboard for today.</p>
            
            {weeklyGoal && (
                 <div className="mb-8">
                    <WeeklyGoalWidget goal={weeklyGoal} onComplete={onCompleteGoal} onNavigate={handleGoalNavigate} />
                </div>
            )}
            
            <div className="mb-8">
                <DailyBriefingComponent briefing={briefing} isLoading={isBriefingLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HomeWidget title="Your Daily Picks" icon={<SparklesIcon className="w-6 h-6"/>}>
                    {isFetchingPicks ? (
                        <p className="text-gray-500">Finding your matches...</p>
                    ) : dailyPicks.length > 0 ? (
                        <div className="flex items-center justify-between">
                            <div className="flex -space-x-4">
                                {dailyPicks.slice(0, 3).map(p => (
                                    <img key={p.id} src={p.profilePicture} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 border-white"/>
                                ))}
                            </div>
                            <Button variant="secondary" onClick={() => { setMatchesView('explore'); onViewChange('matches'); }}>View Picks</Button>
                        </div>
                    ) : (
                        <p className="text-gray-500">Your daily picks will appear here tomorrow.</p>
                    )}
                </HomeWidget>

                <HomeWidget title="Unread Messages" icon={<ChatBubbleLeftRightIcon className="w-6 h-6"/>}>
                    {unreadConversations.length > 0 ? (
                        <div className="space-y-2">
                           {unreadConversations.map(conv => {
                               const otherId = conv.participantIds.find(id => id !== currentUser.id);
                               const otherUser = otherId ? profilesById[otherId] : null;
                               return (
                                   <button key={conv.id} onClick={() => onSelectConversation(conv.id)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-brand-primary/10 transition-colors">
                                       <img src={otherUser?.profilePicture} alt={otherUser?.name} className="w-10 h-10 rounded-full object-cover" />
                                       <div className="text-left">
                                           <p className="font-semibold text-gray-800">{otherUser?.name}</p>
                                           <p className="text-sm text-gray-500 truncate">{conv.messages[conv.messages.length - 1]?.text}</p>
                                       </div>
                                   </button>
                               )
                           })}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No unread messages.</p>
                    )}
                </HomeWidget>
                
                {isProfileIncomplete && (
                     <HomeWidget title="Profile Completeness" icon={<TrophyIcon className="w-6 h-6"/>}>
                        <ProfileCompleteness
                            profile={currentUser}
                            onImprove={onViewMyProfile}
                        />
                    </HomeWidget>
                )}

                {hasStalledConversations && (
                    <HomeWidget title="Reconnect" icon={<LightBulbIcon className="w-6 h-6"/>}>
                        <div className="text-center">
                            <p className="text-gray-500 mb-3">Some conversations have gone quiet. Let our AI help you get things going again!</p>
                            <Button variant="secondary" onClick={onOpenNudgeModal}>Get Connection Nudges</Button>
                        </div>
                    </HomeWidget>
                )}

                 <HomeWidget title="Explore AI Tools" icon={<HeartIcon className="w-6 h-6"/>}>
                    <div className="text-center">
                         <p className="text-gray-500 mb-3">Ready to improve your profile or plan a date? Our AI Coach is here to help.</p>
                         <Button variant="secondary" onClick={() => onViewChange('coach')}>Visit AI Coach</Button>
                    </div>
                </HomeWidget>
            </div>
        </div>
    );
};