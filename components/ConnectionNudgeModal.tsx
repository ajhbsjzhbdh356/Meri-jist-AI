
import React, { useState, useEffect } from 'react';
import { Conversation, UserProfile, ConnectionNudge } from '../types';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, ChatBubbleLeftRightIcon } from './IconComponents';
import { generateConnectionNudges } from '../services/geminiService';

interface ConnectionNudgeModalProps {
  conversations: Conversation[];
  allProfiles: UserProfile[];
  currentUser: UserProfile;
  onClose: () => void;
  onNudgeSelect: (nudge: ConnectionNudge) => void;
}

const NudgeCard: React.FC<{ nudge: ConnectionNudge; onSelect: () => void; }> = ({ nudge, onSelect }) => {
    return (
        <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
            <h4 className="font-bold text-lg text-deep-teal mb-2">Reconnect with {nudge.otherUserName}</h4>
            <div className="p-3 bg-white/70 rounded-lg mb-3">
                 <p className="text-slate-800 italic">"{nudge.suggestion}"</p>
            </div>
            <Button variant="secondary" onClick={onSelect} className="w-full">
                Go to Chat
            </Button>
        </div>
    );
};

export const ConnectionNudgeModal: React.FC<ConnectionNudgeModalProps> = ({ conversations, allProfiles, currentUser, onClose, onNudgeSelect }) => {
  const [nudges, setNudges] = useState<ConnectionNudge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNudges = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await generateConnectionNudges(conversations, allProfiles, currentUser);
        setNudges(result);
      } catch (e) {
        setError("An error occurred while looking for chats to revive.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNudges();
  }, [conversations, allProfiles, currentUser]);

  const handleSelect = (nudge: ConnectionNudge) => {
    onNudgeSelect(nudge);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-rose-gold" />
            AI Connection Nudges
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[300px]">
              <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
              <p className="mt-4 text-xl font-semibold text-deep-teal">AI is scanning for stalled chats...</p>
              <p className="text-slate-500">This will just take a moment.</p>
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
              <h3 className="font-bold text-lg">Analysis Failed</h3>
              <p>{error}</p>
            </div>
          ) : nudges.length > 0 ? (
             <div className="space-y-4">
                <p className="text-center text-slate-600">Here are some suggestions to help you restart promising conversations that have gone quiet.</p>
                {nudges.map((nudge) => (
                    <NudgeCard key={nudge.conversationId} nudge={nudge} onSelect={() => handleSelect(nudge)} />
                ))}
            </div>
          ) : (
            <div className="text-center p-8">
                <p className="text-slate-600">Great job! All your conversations are active. Our AI couldn't find any promising chats that need a nudge right now.</p>
            </div>
          )}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
