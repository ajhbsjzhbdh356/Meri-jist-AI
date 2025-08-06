
import React, { useState } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, CalendarDaysIcon } from './IconComponents';
import { generatePersonalizedDateIdeas } from '../services/geminiService';
import { PersonalizedDateIdea } from '../types';

interface DatePlannerModalProps {
  onClose: () => void;
}

const InputLabel: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1">{children}</label>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition" />
);

const BudgetButton: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode }> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm rounded-full border-2 transition-colors ${isActive ? 'bg-rose-gold text-white border-rose-gold font-semibold' : 'bg-white text-slate-600 border-slate-300 hover:border-rose-gold/50'}`}
    >
        {children}
    </button>
);

const IdeaCard: React.FC<{ idea: PersonalizedDateIdea }> = ({ idea }) => {
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
        <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
            <div className="flex justify-between items-start mb-2">
                <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${categoryClass}`}>
                    {idea.category}
                </span>
                <span className="font-bold text-deep-teal">{idea.estimatedCost}</span>
            </div>
            <h4 className="font-bold text-lg text-deep-teal mb-2">{idea.title}</h4>
            <p className="text-slate-600 text-sm">{idea.description}</p>
        </div>
    );
};

export const DatePlannerModal: React.FC<DatePlannerModalProps> = ({ onClose }) => {
  const [ideas, setIdeas] = useState<PersonalizedDateIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [interests, setInterests] = useState('adventurous, outdoors');
  const [budget, setBudget] = useState('$');
  const [location, setLocation] = useState('Mumbai');
  
  const [hasSearched, setHasSearched] = useState(false);

  const handleGenerate = async () => {
    if (!interests.trim() || !budget.trim() || !location.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setIdeas([]);
    setHasSearched(true);

    try {
      const result = await generatePersonalizedDateIdeas(interests, budget, location);
      setIdeas(result);
    } catch (err) {
      setError("I couldn't come up with any ideas right now. The AI might be busy, or the request was too specific. Please try again!");
      console.error(err);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
            <CalendarDaysIcon className="w-6 h-6 text-rose-gold" />
            AI Date Planner
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Controls */}
          <div className="md:col-span-1 space-y-4 md:border-r md:pr-6 border-slate-200">
             <div>
                <InputLabel htmlFor="location">Location</InputLabel>
                <TextInput id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Bangalore" />
            </div>
            <div>
                <InputLabel htmlFor="interests">Interests or Vibe</InputLabel>
                <TextInput id="interests" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="e.g., romantic, casual" />
            </div>
            <div>
                <InputLabel htmlFor="budget">Budget</InputLabel>
                <div className="flex gap-2">
                    <BudgetButton onClick={() => setBudget('Free')} isActive={budget === 'Free'}>Free</BudgetButton>
                    <BudgetButton onClick={() => setBudget('$')} isActive={budget === '$'}>$</BudgetButton>
                    <BudgetButton onClick={() => setBudget('$$')} isActive={budget === '$$'}>$$</BudgetButton>
                    <BudgetButton onClick={() => setBudget('$$$')} isActive={budget === '$$$'}>$$$</BudgetButton>
                </div>
            </div>
            <div className="pt-4">
                <Button 
                    variant="primary" 
                    onClick={handleGenerate} 
                    disabled={isLoading || !interests || !location || !budget}
                    leftIcon={<SparklesIcon className="w-5 h-5"/>}
                    className="w-full"
                >
                    {isLoading ? 'Thinking...' : 'Generate Ideas'}
                </Button>
            </div>
          </div>
          
          {/* Right Column: Results */}
          <div className="md:col-span-2">
             {isLoading && (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[300px] h-full">
                    <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                    <p className="mt-4 text-xl font-semibold text-deep-teal">Planning some perfect dates...</p>
                </div>
            )}
            {!isLoading && hasSearched && (
                <div className="space-y-4">
                    {error ? (
                        <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                            <h3 className="font-bold text-lg">Oops!</h3>
                            <p>{error}</p>
                        </div>
                    ) : ideas.length > 0 ? (
                        ideas.map((idea, index) => <IdeaCard key={index} idea={idea} />)
                    ) : (
                        <div className="text-center p-8 bg-slate-50 text-slate-600 rounded-lg">
                            <h3 className="font-bold text-lg">No Ideas Found</h3>
                            <p>Try broadening your search criteria.</p>
                        </div>
                    )}
                </div>
            )}
             {!isLoading && !hasSearched && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-lg h-full border-2 border-dashed border-slate-300">
                    <p className="text-slate-500">Your personalized date ideas will appear here.</p>
                </div>
             )}
          </div>
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
