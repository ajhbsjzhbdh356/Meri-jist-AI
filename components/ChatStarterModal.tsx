

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, PaperAirplaneIcon } from './IconComponents';
import { generateIcebreakers } from '../services/geminiService';

interface ChatStarterModalProps {
  currentUser: UserProfile;
  otherProfile: UserProfile;
  onClose: () => void;
  onSendMessage: (messageText: string) => void;
}

export const ChatStarterModal: React.FC<ChatStarterModalProps> = ({ currentUser, otherProfile, onClose, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setIcebreakers([]);
    try {
      const content = await generateIcebreakers(currentUser, otherProfile);
      setIcebreakers(content.split('\n').filter(line => line.trim() !== ''));
    } catch (error) {
      console.error("Failed to generate icebreakers", error);
      setIcebreakers(["I'm a bit tongue-tied at the moment! Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSend = () => {
    if (!message.trim()) return;
    onSendMessage(message);
  };

  const handleIcebreakerClick = (icebreaker: string) => {
    setMessage(icebreaker);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-brand-purple-dark">Send a message to {otherProfile.name}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something charming..."
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent transition"
            rows={5}
          />
          
          <div className="text-center">
            <Button onClick={handleGenerate} disabled={isLoading} leftIcon={<SparklesIcon className="w-5 h-5"/>} variant="secondary">
              {isLoading ? 'Generating...' : 'AI Icebreakers'}
            </Button>
          </div>
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg">
                <SparklesIcon className="w-12 h-12 text-brand-secondary animate-pulse" />
                <p className="mt-4 text-lg font-semibold text-brand-purple-dark">AI is writing some opening lines...</p>
                <p className="text-slate-500">This might take a moment.</p>
            </div>
          )}

          {icebreakers.length > 0 && (
            <div>
              <h3 className="font-bold text-lg text-brand-purple-dark mb-2">Suggestions from our AI:</h3>
              <div className="bg-cream p-2 rounded-lg border border-dusty-rose/50 space-y-2">
                 {icebreakers.map((line, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleIcebreakerClick(line)} 
                        className="block text-left w-full p-3 hover:bg-brand-secondary/20 rounded-md transition-colors text-brand-purple-dark/80 text-sm"
                    >
                        "{line}"
                    </button>
                 ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} disabled={!message.trim()} leftIcon={<PaperAirplaneIcon/>}>
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
};