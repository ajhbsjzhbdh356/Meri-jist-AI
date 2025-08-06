
import React, { useState, useEffect } from 'react';
import { Conversation, UserProfile, SharedMemory } from '../types';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, TrophyIcon } from './IconComponents';
import { extractSharedMemories } from '../services/geminiService';

interface SharedMemoriesModalProps {
  conversation: Conversation;
  currentUser: UserProfile;
  otherParticipant: UserProfile;
  onClose: () => void;
  onUpdateConversation: (updates: Partial<Conversation>) => void;
}

const MemoryCard: React.FC<{ memory: SharedMemory, index: number }> = ({ memory, index }) => (
  <div className="flex items-center w-full">
    {/* Line and Dot */}
    <div className={`relative px-4 ${index === 0 ? 'pt-2' : ''}`}>
      <div className="absolute top-0 left-1/2 w-0.5 h-full bg-dusty-rose -translate-x-1/2"></div>
      <div className="relative z-10 w-8 h-8 bg-cream rounded-full border-2 border-rose-gold flex items-center justify-center">
        <span className="text-lg">{memory.emoji}</span>
      </div>
    </div>
    {/* Content */}
    <div className="bg-white rounded-lg p-4 flex-1 shadow-sm border border-slate-200">
      <h4 className="font-bold text-deep-teal">{memory.title}</h4>
      <p className="text-sm text-slate-600">{memory.description}</p>
    </div>
  </div>
);


export const SharedMemoriesModal: React.FC<SharedMemoriesModalProps> = ({ conversation, currentUser, otherParticipant, onClose, onUpdateConversation }) => {
  const [memories, setMemories] = useState<SharedMemory[]>(conversation.memories || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if memories aren't already loaded and the conversation is long enough
    if (!conversation.memories && conversation.messages.length > 5) {
      const generateMemories = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const newMemoriesData = await extractSharedMemories(conversation.messages, currentUser.name, otherParticipant.name);
          const newMemories = newMemoriesData.map(mem => ({
            ...mem,
            id: `mem-${Date.now()}-${Math.random()}`,
          }));
          setMemories(newMemories);
          onUpdateConversation({ memories: newMemories });
        } catch (e) {
          setError("I had trouble remembering all the good times. Please try again in a moment.");
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      generateMemories();
    }
  }, [conversation, currentUser.name, otherParticipant.name, onUpdateConversation]);
  
  const hasMemories = memories && memories.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
            <TrophyIcon className="w-6 h-6 text-rose-gold" />
            Shared Memories
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-cream/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[300px]">
              <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
              <p className="mt-4 text-xl font-semibold text-deep-teal">AI is looking back at your chat...</p>
              <p className="text-slate-500">Finding the best moments.</p>
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                <h3 className="font-bold text-lg">Oops!</h3>
                <p>{error}</p>
             </div>
          ) : hasMemories ? (
            <div className="space-y-4">
                {memories.map((memory, index) => (
                    <MemoryCard key={memory.id} memory={memory} index={index}/>
                ))}
            </div>
          ) : (
            <div className="text-center p-8">
                <p className="text-slate-600">Keep chatting to create some shared memories! Our AI will highlight them here once you've built a connection.</p>
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