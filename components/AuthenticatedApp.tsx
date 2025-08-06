import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './Header';
import { ProfileCard } from './ProfileCard';
import { ProfileDetail } from './ProfileDetail';
import { ChatView } from './ChatView';
import { ChatStarterModal } from './ChatStarterModal';
import { useUserData } from '../hooks/useUserData';
import { UserProfile, AIFilterCriteria, ConnectionNudge, DailyBriefing, WeeklyGoal, Conversation, SharedMemory } from '../types';
import { AISearchBar } from './FilterBar';
import { Button } from './Button';
import { AICoachView } from './AICoachView';
import { DailyPicksSection } from './DailyPicksSection';
import { getDailyPicks, getInitialAppData, parseSearchQuery, findBlindDateMatch, analyzeVideoCall } from '../services/geminiService';
import { DiscoveryView } from './DiscoveryView';
import { AIBlindDateSection } from './AIBlindDateSection';
import { MatchExplanationModal } from './MatchExplanationModal';
import { ConnectionNudgeModal } from './ConnectionNudgeModal';
import { HomeView } from './HomeView';
import { GameView } from './GameView';
import { AIJournalView } from './AIJournalView';
import { useAuth } from '../hooks/useAuth';
import { VideoCallView } from './VideoCallView';

const MatchesNavButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isActive, onClick, children }) => {
  const baseClasses = "px-6 py-2 rounded-full font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary";
  const activeClasses = "bg-brand-primary text-white shadow-md";
  const inactiveClasses = "bg-white/50 text-gray-700 hover:bg-white";

  return (
      <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
          {children}
      </button>
  )
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

export const AuthenticatedApp: React.FC = () => {
  const { user: currentUser, logout } = useAuth();
  
  // The useUserData hook is now the single source of truth for app data.
  // It's initialized with the authenticated user.
  const userData = useUserData(currentUser!); 

  const [view, setView] = useState<'home' | 'matches' | 'chats' | 'coach' | 'game' | 'journal'>('home');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatStarterProfile, setChatStarterProfile] = useState<UserProfile | null>(null);
  const [aiFilters, setAiFilters] = useState<AIFilterCriteria | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[] | null>(null);
  const [dailyPicks, setDailyPicks] = useState<UserProfile[]>([]);
  const [isFindingBlindDate, setIsFindingBlindDate] = useState(false);
  const [explainingMatchProfile, setExplainingMatchProfile] = useState<UserProfile | null>(null);
  const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
  const [matchesView, setMatchesView] = useState<'discover' | 'explore'>('discover');
  const [swipedUserIds, setSwipedUserIds] = useState<Set<number>>(new Set());
  const [lastSwiped, setLastSwiped] = useState<{ userId: number; wasLiked: boolean; } | null>(null);
  
  // Home Screen specific state
  const [initialAppData, setInitialAppData] = useState<{
      greeting: string;
      briefing: DailyBriefing;
      weeklyGoal: WeeklyGoal;
      dailyPickIds: number[];
  } | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const [activeCall, setActiveCall] = useState<{ conversation: Conversation; currentUser: UserProfile; otherParticipant: UserProfile; } | null>(null);

  // This effect replaces the mock data initialization. It fetches all necessary
  // startup data from the backend in a single call.
  useEffect(() => {
    const fetchInitialData = async () => {
        if (!currentUser) return;
        try {
            // In a real app, this API call would be implemented on your backend.
            // For now, we simulate it with the geminiService but this shows the pattern.
            // It uses the existing profiles and conversations from the userData hook.
            const data = await getInitialAppData(currentUser, userData.conversations, userData.profiles);
            setInitialAppData({
                ...data,
                weeklyGoal: { ...data.weeklyGoal, isComplete: false },
            });
        } catch (error) {
            console.error("Failed to fetch initial app data:", error);
            // Set some defaults on failure
             setInitialAppData({
                greeting: `Welcome, ${currentUser.name}!`,
                briefing: { profileTip: "Try adding a new photo to your profile.", conversationStarter: "Ask about someone's favorite childhood memory." },
                weeklyGoal: { title: "Explore your matches", description: "Take a look at the profiles in the explore tab.", emoji: "💖", featureTarget: 'MATCHES', isComplete: false },
                dailyPickIds: [],
            });
        } finally {
            setIsAppLoading(false);
        }
    };

    // Only run once when the component mounts and user data is available.
    if(currentUser && userData.profiles.length > 0) {
        fetchInitialData();
    }
  }, [currentUser, userData.conversations, userData.profiles]);

  const handleViewChange = (newView: 'home' | 'matches' | 'chats' | 'coach' | 'game' | 'journal') => {
      setView(newView);
      if (newView !== 'chats') setActiveConversationId(null);
      if (newView !== 'matches') userData.selectProfile(null);
  };
  
  const handleStartChat = (otherProfile: UserProfile) => {
    // This logic is now async because it interacts with the backend.
    setSwipedUserIds(prev => new Set(prev).add(otherProfile.id));
    userData.getOrCreateConversation(otherProfile.id).then(conversationId => {
        const conversation = userData.conversations.find(c => c.id === conversationId);
        if (conversation && conversation.messages.length > 0) {
            setActiveConversationId(conversationId);
            userData.markConversationAsRead(conversationId);
            setView('chats');
        } else {
            setChatStarterProfile(otherProfile);
        }
    });
  };
  
  const handleViewMyProfile = () => {
      userData.selectProfile(currentUser!.id);
      setView('matches');
  };

  const handleSendMessageFromModal = async (messageText: string) => {
    if (!chatStarterProfile) return;
    const conversationId = await userData.getOrCreateConversation(chatStarterProfile.id);
    await userData.sendMessage(conversationId, { senderId: currentUser!.id, text: messageText });
    setChatStarterProfile(null);
    setActiveConversationId(conversationId);
    setView('chats');
  };
  
  const handleSelectConversation = (conversationId: string) => {
      userData.markConversationAsRead(conversationId);
      setActiveConversationId(conversationId);
      setView('chats');
  }
  
  const handleSwipe = (userId: number, direction: 'right' | 'left') => {
    setLastSwiped({ userId, wasLiked: userData.likedProfiles.has(userId) });
    if (direction === 'right') {
        if (!userData.likedProfiles.has(userId)) {
            userData.toggleLike(userId);
        }
    } else {
        if (userData.likedProfiles.has(userId)) {
            userData.toggleLike(userId);
        }
    }
    setSwipedUserIds(prev => new Set(prev).add(userId));
  };

  const handleRewind = () => {
    if (!lastSwiped) return;
    userData.toggleLike(lastSwiped.userId);
    setSwipedUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(lastSwiped.userId);
        return newSet;
    });
    setLastSwiped(null);
  };

  const handleExplainMatch = (profileId: number) => {
    const profileToExplain = userData.profiles.find(p => p.id === profileId);
    if(profileToExplain) setExplainingMatchProfile(profileToExplain);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setFilteredProfiles(null); 
    try {
        const filters = await parseSearchQuery(query);
        setAiFilters(filters);

        const newFilteredProfiles = userData.profiles.filter(profile => {
            if (filters.minAge && profile.age < filters.minAge) return false;
            if (filters.maxAge && profile.age > filters.maxAge) return false;
            if (filters.religion && !profile.religion.toLowerCase().includes(filters.religion.toLowerCase())) return false;
            if (filters.cities && filters.cities.length > 0 && !filters.cities.some(city => profile.city.toLowerCase().includes(city.toLowerCase()))) return false;
            if (filters.professions && filters.professions.length > 0 && !filters.professions.some(prof => profile.profession.toLowerCase().includes(prof.toLowerCase()))) return false;
            if (filters.keywords && filters.keywords.length > 0) {
                const profileText = `${profile.bio} ${profile.story} ${profile.interestTags?.join(' ')}`.toLowerCase();
                if (!filters.keywords.every(kw => profileText.includes(kw.toLowerCase()))) {
                    return false;
                }
            }
            return true;
        });
        setFilteredProfiles(newFilteredProfiles);
    } catch (error) {
        console.error("Failed to parse search query:", error);
        setAiFilters(null);
    } finally {
        setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setAiFilters(null);
    setFilteredProfiles(null);
  };
  
  const handleStartCall = (conversation: Conversation) => {
    const otherParticipant = userData.profiles.find(p => p.id === conversation.participantIds.find(id => id !== currentUser!.id));
    if (currentUser && otherParticipant) {
      userData.updateConversation(conversation.id, { videoCallState: { status: 'active', initiatorId: conversation.videoCallState?.initiatorId }});
      setActiveCall({ conversation, currentUser, otherParticipant });
    }
  };

  const handleEndCall = async (conversationId: string, duration: number) => {
    setActiveCall(null);
    await userData.updateConversation(conversationId, { videoCallState: { status: 'ended', duration }});
  };

   const handleShareComic = (otherUserId: number, imageBase64: string) => {
    if (!currentUser) return;
    userData.getOrCreateConversation(otherUserId).then(conversationId => {
      userData.sendMessage(conversationId, {
          senderId: currentUser.id,
          imageUrl: `data:image/jpeg;base64,${imageBase64}`,
          text: `${currentUser.name.split(' ')[0]} shared a comic!`,
      });
      setActiveConversationId(conversationId);
      setView('chats');
    });
  };

  const allProfilesForViews = useMemo(() => [currentUser!, ...userData.profiles], [currentUser, userData.profiles]);
  const profilesForDiscovery = useMemo(() => userData.profiles.filter(p => !swipedUserIds.has(p.id)), [userData.profiles, swipedUserIds]);
  const profilesToDisplayInExplore = aiFilters ? filteredProfiles : userData.profiles;
  
  if (!currentUser) {
    return <div>Authenticating...</div>
  }
  
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col">
       {activeCall && (
        <VideoCallView 
            currentUser={activeCall.currentUser}
            otherParticipant={activeCall.otherParticipant}
            onEndCall={(duration) => handleEndCall(activeCall.conversation.id, duration)}
            onAddMemory={(memoryData) => userData.addSharedMemory(activeCall.conversation.id, memoryData)}
        />
      )}
      <Header 
        view={view} 
        onViewChange={handleViewChange} 
        chatNotificationCount={userData.conversations.filter(c => c.messages.some(m => !m.isRead && m.senderId !== currentUser.id)).length}
        user={currentUser}
        onLogout={logout}
      />
      {chatStarterProfile && (
        <ChatStarterModal 
          currentUser={currentUser}
          otherProfile={chatStarterProfile}
          onClose={() => setChatStarterProfile(null)}
          onSendMessage={handleSendMessageFromModal}
        />
      )}
      {explainingMatchProfile && (
        <MatchExplanationModal
            currentUser={currentUser}
            otherProfile={explainingMatchProfile}
            onClose={() => setExplainingMatchProfile(null)}
        />
      )}
       {isNudgeModalOpen && (
        <ConnectionNudgeModal
            conversations={userData.conversations}
            allProfiles={allProfilesForViews}
            currentUser={currentUser}
            onClose={() => setIsNudgeModalOpen(false)}
            onNudgeSelect={(nudge) => handleSelectConversation(nudge.conversationId)}
        />
      )}
      <main className="flex-grow flex flex-col">
        {view === 'home' && <HomeView 
            currentUser={currentUser}
            briefing={initialAppData?.briefing ?? null}
            isBriefingLoading={isAppLoading}
            dailyPicks={userData.profiles.filter(p => initialAppData?.dailyPickIds.includes(p.id))}
            isFetchingPicks={isAppLoading}
            conversations={userData.conversations}
            allProfiles={allProfilesForViews}
            onViewChange={handleViewChange}
            onSelectConversation={handleSelectConversation}
            onOpenNudgeModal={() => setIsNudgeModalOpen(true)}
            setMatchesView={setMatchesView}
            onViewMyProfile={handleViewMyProfile}
            personalizedGreeting={initialAppData?.greeting ?? ''}
            weeklyGoal={initialAppData?.weeklyGoal ?? null}
            onCompleteGoal={() => {
                if (initialAppData) setInitialAppData(d => d ? ({ ...d, weeklyGoal: {...d.weeklyGoal, isComplete: true} }) : null);
            }}
        />}
        {view === 'matches' && (
          userData.selectedProfile ? (
            <ProfileDetail
              profile={userData.selectedProfile}
              currentUser={currentUser}
              onBack={() => userData.selectProfile(null)}
              onUpdateProfile={userData.updateProfile}
              onUpdatePhoto={userData.updatePhoto}
              onAddPhoto={userData.addPhoto}
              isLiked={userData.likedProfiles.has(userData.selectedProfile.id)}
              onLikeToggle={userData.toggleLike}
              onStartChat={handleStartChat}
              conversations={userData.conversations}
              allProfiles={allProfilesForViews}
              onShareComic={handleShareComic}
            />
          ) : (
             <div className="container mx-auto px-4 py-8 flex-grow flex flex-col">
                <div className="flex justify-center p-1.5 bg-gray-200/50 rounded-full mb-8 w-max mx-auto">
                    <MatchesNavButton isActive={matchesView === 'discover'} onClick={() => setMatchesView('discover')}>
                        Discover
                    </MatchesNavButton>
                    <MatchesNavButton isActive={matchesView === 'explore'} onClick={() => setMatchesView('explore')}>
                        Explore
                    </MatchesNavButton>
                </div>
                {matchesView === 'discover' ? (
                  <DiscoveryView
                    users={profilesForDiscovery}
                    onSwipe={handleSwipe}
                    onRewind={handleRewind}
                    canRewind={!!lastSwiped}
                    onViewProfile={userData.selectProfile}
                  />
                ) : (
                  <div className="flex-grow flex flex-col">
                      <AISearchBar 
                          onSearch={handleSearch} 
                          onClear={handleClearSearch}
                          activeFilters={aiFilters}
                          isSearching={isSearching}
                      />
                      {isSearching ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {Array.from({ length: 6 }).map((_, i) => <ProfileCardSkeleton key={i} />)}
                          </div>
                      ) : profilesToDisplayInExplore && profilesToDisplayInExplore.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {profilesToDisplayInExplore.map(profile => (
                                  <ProfileCard
                                      key={profile.id}
                                      profile={profile}
                                      onViewProfile={() => userData.selectProfile(profile.id)}
                                      isLiked={userData.likedProfiles.has(profile.id)}
                                      onLikeToggle={() => userData.toggleLike(profile.id)}
                                      onExplainMatch={handleExplainMatch}
                                  />
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-16">
                              <h3 className="text-2xl font-bold font-serif text-gray-800">No Profiles Found</h3>
                              <p className="text-gray-500 mt-2">
                                  {aiFilters ? "Try adjusting your search filters." : "There are no new profiles to show right now."}
                              </p>
                          </div>
                      )}
                  </div>
                )}
            </div>
          )
        )}
        {view === 'chats' && <ChatView 
            conversations={userData.conversations}
            currentUser={currentUser}
            allProfiles={allProfilesForViews}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onSendMessage={userData.sendMessage}
            onUpdateConversation={userData.updateConversation}
            onStartCall={handleStartCall}
        />}
        {view === 'coach' && <AICoachView 
            currentUser={currentUser}
            onOpenNudgeModal={() => setIsNudgeModalOpen(true)}
            likedProfiles={userData.profiles.filter(p => userData.likedProfiles.has(p.id))}
            conversations={userData.conversations}
            allProfiles={allProfilesForViews}
            onShareComic={handleShareComic}
        />}
         {view === 'game' && <GameView 
             currentUser={currentUser}
             allProfiles={allProfilesForViews}
             onUpdateUserPoints={userData.updateUserPoints}
             onRedeemPicks={async () => console.warn("Redeem picks needs backend implementation")}
             isRedeeming={false}
             unlockedAchievements={userData.unlockedAchievements}
             claimedAchievements={userData.claimedAchievements}
             onClaimAchievement={userData.claimAchievement}
             onBuyBadge={userData.buyBadge}
             onEquipBadge={userData.equipBadge}
             onStartChat={handleStartChat}
        />}
        {view === 'journal' && <AIJournalView 
            entries={userData.journalEntries}
            onAddEntry={userData.addJournalEntry}
            onDeleteEntry={userData.deleteJournalEntry}
            conversations={userData.conversations}
            likedProfiles={userData.profiles.filter(p => userData.likedProfiles.has(p.id))}
        />}
      </main>
      <footer className="text-center py-8 border-t border-gray-200">
        <p className="text-gray-500">&copy; {new Date().getFullYear()} SoulMate AI. All rights reserved.</p>
      </footer>
    </div>
  );
};
