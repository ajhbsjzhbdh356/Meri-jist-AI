
import React, { useState, useEffect } from 'react';
import { UserProfile, DateIdea } from '../types';
import { Button } from './Button';
import { SparklesIcon, CloseIcon } from './IconComponents';
import { generateDateIdeas } from '../services/geminiService';

interface DateIdeaModalProps {
  currentUser: UserProfile;
  otherProfile: UserProfile;
  onClose: () => void;
  onSuggest: (suggestionText: string) => void;
}

const DateIdeaCard: React.FC<{ idea: DateIdea; onSuggest: () => void; }> = ({ idea, onSuggest }) => {
    const categoryColors: { [key: string]: string } = {
        Casual: "bg-blue-100 text-blue-800",
        Adventurous: "bg-green-100 text-green-800",
        Creative: "bg-purple-100 text-purple-800",
        Foodie: "bg-yellow-100 text-yellow-800",
        Relaxing: "bg-indigo-100 text-indigo-800",
        Intellectual: "bg-gray-100 text-gray-800"
    };
    const categoryClass = categoryColors[idea.category] || "bg-slate-100 text-slate-800";

    return (
        <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30 flex flex-col justify-between">
            <div>
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full mb-2 ${categoryClass}`}>
                    {idea.category}
                </span>
                <h4 className="font-bold text-lg text-deep-teal mb-2">{idea.title}</h4>
                <p className="text-slate-600 text-sm mb-4">{idea.description}</p>
            </div>
            <Button variant="secondary" onClick={onSuggest} className="mt-auto w-full">Suggest this Date</Button>
        </div>
    );
};

export const DateIdeaModal: React.FC<DateIdeaModalProps> = ({ currentUser, otherProfile, onClose, onSuggest }) => {
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIdeas = async () => {
      setIsLoading(true);
      try {
        const result = await generateDateIdeas(currentUser, otherProfile);
        setIdeas(result);
      } catch(error) {
        console.error("Failed to generate date ideas:", error);
        setIdeas([]);
      }
      setIsLoading(false);
    };

    fetchIdeas();
  }, [currentUser, otherProfile]);

  const handleSuggest = (idea: DateIdea) => {
    const suggestionText = `I have a fun date idea! How about we try '${idea.title}'? ${idea.description}`;
    onSuggest(suggestionText);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-rose-gold" />
            AI Date Planner
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[300px]">
                <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-deep-teal">Our AI is planning some dates for you...</p>
                <p className="text-slate-500">This will just take a moment.</p>
            </div>
          ) : ideas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ideas.map((idea, index) => (
                    <DateIdeaCard key={index} idea={idea} onSuggest={() => handleSuggest(idea)} />
                ))}
            </div>
          ) : (
             <div className="text-center p-8">
                <p className="text-slate-600">Our AI couldn't come up with specific ideas right now. How about a simple coffee date to start?</p>
             </div>
          )}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
