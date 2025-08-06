import { useState, useCallback, useMemo, useEffect } from 'react';
import { UserProfile, Photo, Conversation, Message, JournalEntry, PurchasableBadgeId, SharedMemory } from '../types';
import { useAuth } from './useAuth';

// This is a placeholder for your API service helper functions.
// In a real app, this would be in its own file (e.g., `services/api.ts`)
const getAuthHeaders = async (token: string) => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
});

export const useUserData = (currentUser: UserProfile) => {
  const { firebaseUser } = useAuth();
  
  // All data is now fetched from the backend.
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  
  // These states are now managed in AuthenticatedApp to bridge the gap
  // between the mock setup and a real backend.
  const [likedProfiles, setLikedProfiles] = useState<Set<number>>(new Set());
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  // Fetch initial data (other profiles, conversations, etc.)
  useEffect(() => {
    const fetchData = async () => {
      if (!firebaseUser) return;
      try {
        const token = await firebaseUser.getIdToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        const [profilesRes, conversationsRes, journalRes] = await Promise.all([
            fetch('/api/profiles', { headers }), // Should fetch profiles *other than* the current user
            fetch('/api/conversations', { headers }),
            fetch('/api/journal', { headers }),
        ]);

        if (!profilesRes.ok || !conversationsRes.ok || !journalRes.ok) {
            console.error('Failed to fetch initial data from backend.');
            // Handle error state in UI if necessary
            return;
        }

        const [profilesData, conversationsData, journalData] = await Promise.all([
            profilesRes.json(),
            conversationsRes.json(),
            journalRes.json()
        ]);
        
        setProfiles(profilesData); 
        setConversations(conversationsData);
        setJournalEntries(journalData);
        // In a real app, the current user's profile would include their liked profile IDs
        // setLikedProfiles(new Set(currentUser.likedProfileIds));

      } catch (error) {
        console.error("Error fetching user data:", error);
        // Handle error state in UI
      }
    };

    fetchData();
  }, [firebaseUser, currentUser.id]);

  const updateProfile = useCallback(async (profileId: number, updates: Partial<UserProfile>) => {
    if (!firebaseUser || profileId !== currentUser.id) return; // For now, only allow updating own profile
    
    // Optimistic UI Update
    // A more robust solution would handle API failures and roll back the state.
    if (profileId === currentUser.id) {
        // This needs to be handled via the AuthContext now to keep it in sync
        console.warn("Updating currentUser should be handled through a dedicated function in AuthContext.");
    } else {
        setProfiles(current => current.map(p => p.id === profileId ? { ...p, ...updates } : p));
    }

    const token = await firebaseUser.getIdToken();
    await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: await getAuthHeaders(token),
        body: JSON.stringify(updates),
    });
  }, [firebaseUser, currentUser.id]);
  
  const sendMessage = useCallback(async (conversationId: string, message: Omit<Message, 'timestamp'>) => {
    if (!firebaseUser) return;
    const token = await firebaseUser.getIdToken();
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: await getAuthHeaders(token),
        body: JSON.stringify(message),
    });
    const newMessage = await response.json();
    setConversations(current => current.map(c => 
        c.id === conversationId ? { ...c, messages: [...c.messages, newMessage] } : c
    ));
  }, [firebaseUser]);

  const addJournalEntry = useCallback(async (content: string) => {
    if (!firebaseUser) return;
    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/journal', {
        method: 'POST',
        headers: await getAuthHeaders(token),
        body: JSON.stringify({ content }),
    });
    const newEntry = await response.json();
    setJournalEntries(prev => [newEntry, ...prev]);
  }, [firebaseUser]);

  const deleteJournalEntry = useCallback(async (id: string) => {
    if (!firebaseUser) return;
    const token = await firebaseUser.getIdToken();
    await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(token),
    });
    setJournalEntries(prev => prev.filter(entry => entry.id !== id));
  }, [firebaseUser]);
  
  // NOTE: Other data mutation functions would follow the same async/API call pattern.
  // For brevity, they are not all implemented here but the structure is established.
  const getOrCreateConversation = useCallback(async (otherUserId: number): Promise<string> => {
    if (!firebaseUser) throw new Error("Not authenticated");
    const token = await firebaseUser.getIdToken();
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: await getAuthHeaders(token),
      body: JSON.stringify({ otherUserId })
    });
    const conversation = await response.json();
    setConversations(prev => [...prev.filter(c => c.id !== conversation.id), conversation]);
    return conversation.id;
  }, [firebaseUser]);


  const selectProfile = (id: number | null) => {
    setSelectedProfileId(id);
  };
  
  const selectedProfile = useMemo(() => {
    if (selectedProfileId === null) return null;
    if (selectedProfileId === currentUser.id) return currentUser;
    return profiles.find(p => p.id === selectedProfileId) || null;
  }, [selectedProfileId, profiles, currentUser]);
  
  return {
    profiles,
    selectedProfile,
    selectProfile,
    updateProfile,
    // updatePhoto and addPhoto would be similar to updateProfile
    updatePhoto: async (profileId: number, photoId: number, updates: { caption: string }) => console.warn("updatePhoto needs backend implementation."),
    addPhoto: async (profileId: number, photo: { url: string; caption: string; }) => console.warn("addPhoto needs backend implementation."),
    likedProfiles,
    toggleLike: async (profileId: number) => console.warn("toggleLike needs backend implementation."),
    conversations,
    sendMessage,
    getOrCreateConversation,
    updateConversation: async (conversationId: string, updates: Partial<Conversation>) => console.warn("updateConversation needs backend implementation."),
    markConversationAsRead: async (conversationId: string) => console.warn("markConversationAsRead needs backend implementation."),
    blindDateHistory: new Set<string>(), // This would be fetched from the backend
    startBlindDateConversation: async (otherUserId: number, introMessage: string) => { console.warn("startBlindDateConversation needs backend implementation."); return ""; },
    updateUserPoints: async (userId: number, pointsDelta: number) => console.warn("updateUserPoints needs backend implementation."),
    unlockedAchievements: new Set<string>(),
    claimedAchievements: new Set<string>(),
    claimAchievement: async (achievementId: string, points: number) => console.warn("claimAchievement needs backend implementation."),
    journalEntries,
    addJournalEntry,
    deleteJournalEntry,
    buyBadge: async (badgeId: PurchasableBadgeId, cost: number) => console.warn("buyBadge needs backend implementation."),
    equipBadge: async (badgeId: PurchasableBadgeId) => console.warn("equipBadge needs backend implementation."),
    addSharedMemory: async (conversationId: string, memoryData: Omit<SharedMemory, 'id'>) => console.warn("addSharedMemory needs backend implementation."),
  };
};