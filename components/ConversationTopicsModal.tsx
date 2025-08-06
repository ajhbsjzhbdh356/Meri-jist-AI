
import React, { useState, useEffect } from 'react';
import { UserProfile, ConversationTopic } from '../types';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, LightBulbIcon } from './IconComponents';
import { generateConversationTopics } from '../services/geminiService';

interface ConversationTopicsModalProps {
  currentUser: UserProfile;
  onClose: () => void;
}

const TopicCard: React.FC<{ topic: ConversationTopic }> = ({ topic }) => {
    return (
        <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
            <div className="flex items-start gap-3">
                <LightBulbIcon className="w-6 h-6 text-rose-gold/80 mt-1 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-lg text-deep-teal mb-1">{topic.topic}</h4>
                    <p className="text-slate-600 text-sm">{topic.reasoning}</p>
                </div>
            </div>
        </div>
    );
};

export const ConversationTopicsModal: React.FC<ConversationTopicsModalProps> = ({ currentUser, onClose }) => {
  const [topics, setTopics] = useState<ConversationTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      try {
        const result = await generateConversationTopics(currentUser);
        setTopics(result);
      } catch(error) {
        console.error("Failed to generate conversation topics:", error);
        setTopics([]);
      }
      setIsLoading(false);
    };

    fetchTopics();
  }, [currentUser]);


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-rose-gold" />
            Conversation Topic Ideas
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[300px]">
                <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-deep-teal">AI is brainstorming topics for you...</p>
                <p className="text-slate-500">This will just take a moment.</p>
            </div>
          ) : topics.length > 0 ? (
            <div className="space-y-4">
                <p className="text-slate-600 mb-4 text-center">Here are some personalized topics to help you spark meaningful conversations based on your profile.</p>
                {topics.map((topic, index) => (
                    <TopicCard key={index} topic={topic} />
                ))}
            </div>
          ) : (
             <div className="text-center p-8">
                <p className="text-slate-600">Our AI couldn't come up with topics right now. Try reviewing your profile to make sure it's filled out!</p>
             </div>
          )}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
          <Button variant="primary" onClick={onClose}>Great, thanks!</Button>
        </div>
      </div>
    </div>
  );
};
