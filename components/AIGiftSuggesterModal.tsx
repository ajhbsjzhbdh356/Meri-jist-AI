
import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, GiftIcon, ArrowLeftIcon } from './IconComponents';
import { GiftIdea, UserProfile, Conversation } from '../types';
import { generateGiftIdeas } from '../services/geminiService';

interface AIGiftSuggesterModalProps {
  currentUser: UserProfile;
  conversations: Conversation[];
  allProfiles: UserProfile[];
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

const IdeaCard: React.FC<{ idea: GiftIdea }> = ({ idea }) => (
    <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
        <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-lg text-deep-teal">{idea.name}</h4>
            <span className="font-bold text-deep-teal">{idea.estimatedCost}</span>
        </div>
        <p className="text-slate-600 text-sm mb-3">{idea.description}</p>
        <div className="p-3 bg-white/60 rounded-md border-l-4 border-rose-gold">
            <p className="text-sm text-slate-700 italic">
                <span className="font-semibold not-italic text-deep-teal">Why it's a great gift:</span> {idea.reasoning}
            </p>
        </div>
    </div>
);


export const AIGiftSuggesterModal: React.FC<AIGiftSuggesterModalProps> = ({ currentUser, conversations, allProfiles, onClose }) => {
    const [step, setStep] = useState<'selection' | 'form' | 'loading' | 'results'>('selection');
    const [selectedMatch, setSelectedMatch] = useState<{ profile: UserProfile; conversation: Conversation } | null>(null);
    
    const [occasion, setOccasion] = useState('First Date');
    const [budget, setBudget] = useState('$');
    const [notes, setNotes] = useState('');

    const [results, setResults] = useState<GiftIdea[]>([]);
    const [error, setError] = useState<string | null>(null);

    const matchesWithConversations = useMemo(() => {
        return conversations
            .filter(c => c.messages.length > 2)
            .map(c => {
                const otherId = c.participantIds.find(id => id !== currentUser.id);
                const profile = allProfiles.find(p => p.id === otherId);
                return profile ? { profile, conversation: c } : null;
            })
            .filter((match): match is { profile: UserProfile; conversation: Conversation } => !!match);
    }, [conversations, allProfiles, currentUser.id]);

    const handleSelectMatch = (match: { profile: UserProfile; conversation: Conversation }) => {
        setSelectedMatch(match);
        setStep('form');
    };

    const handleGenerate = async () => {
        if (!selectedMatch) return;
        setStep('loading');
        setError(null);
        setResults([]);
        try {
            const ideas = await generateGiftIdeas(currentUser, selectedMatch.profile, selectedMatch.conversation, occasion, budget, notes);
            setResults(ideas);
        } catch (err) {
            setError("I couldn't come up with any gift ideas right now. The AI might be busy. Please try again!");
            console.error(err);
        }
        setStep('results');
    };
    
    const handleBackToForm = () => {
        setResults([]);
        setError(null);
        setStep('form');
    }

    const renderHeader = () => (
         <div className="flex justify-between items-center p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
                <GiftIcon className="w-6 h-6 text-rose-gold" />
                AI Gift Suggester
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                <CloseIcon />
            </button>
        </div>
    );

    const renderSelectionStep = () => (
        <>
            {renderHeader()}
            <div className="p-6 overflow-y-auto space-y-4">
                <p className="text-slate-600 text-center">Who are you getting a gift for? Select one of your matches below.</p>
                {matchesWithConversations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {matchesWithConversations.map(match => (
                            <button
                                key={match.profile.id}
                                onClick={() => handleSelectMatch(match)}
                                className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 hover:border-rose-gold hover:bg-rose-gold/5 transition-colors"
                            >
                                <img src={match.profile.profilePicture} alt={match.profile.name} className="w-12 h-12 rounded-full object-cover"/>
                                <span className="font-semibold text-deep-teal">{match.profile.name}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-slate-50 text-slate-600 rounded-lg">
                        <p>You don't have any active conversations yet. Start chatting with someone to use this feature!</p>
                    </div>
                )}
            </div>
        </>
    );

    const renderFormStep = () => (
        <>
            {renderHeader()}
            <div className="p-6 overflow-y-auto space-y-4">
                <div className="flex items-center gap-2 text-slate-600">
                    <button onClick={() => setStep('selection')} className="hover:text-deep-teal"><ArrowLeftIcon/></button>
                    <p>Gift ideas for <span className="font-bold text-deep-teal">{selectedMatch?.profile.name}</span></p>
                </div>
                 <div>
                    <InputLabel htmlFor="occasion">Occasion</InputLabel>
                    <TextInput id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)} />
                </div>
                <div>
                    <InputLabel htmlFor="budget">Budget</InputLabel>
                    <div className="flex gap-2">
                        <BudgetButton onClick={() => setBudget('$')} isActive={budget === '$'}>$</BudgetButton>
                        <BudgetButton onClick={() => setBudget('$$')} isActive={budget === '$$'}>$$</BudgetButton>
                        <BudgetButton onClick={() => setBudget('$$$')} isActive={budget === '$$$'}>$$$</BudgetButton>
                    </div>
                </div>
                 <div>
                    <InputLabel htmlFor="notes">Any other notes?</InputLabel>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., They mentioned loving cats or vintage books..."
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                        rows={3}
                    />
                </div>
            </div>
            <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleGenerate} leftIcon={<SparklesIcon/>}>Generate Ideas</Button>
            </div>
        </>
    );

    const renderLoadingStep = () => (
         <>
            {renderHeader()}
            <div className="p-6 flex flex-col items-center justify-center text-center flex-grow">
                <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-deep-teal">Finding the perfect gifts...</p>
                <p className="text-slate-500">This might take a moment.</p>
            </div>
        </>
    );
    
    const renderResultsStep = () => (
        <>
            {renderHeader()}
            <div className="p-6 overflow-y-auto space-y-4">
                 {error ? (
                    <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                        <h3 className="font-bold text-lg">Oops!</h3>
                        <p>{error}</p>
                    </div>
                 ) : results.length > 0 ? (
                    results.map((idea, index) => <IdeaCard key={index} idea={idea} />)
                 ) : (
                    <div className="text-center p-8 bg-slate-50 text-slate-600 rounded-lg">
                        <h3 className="font-bold text-lg">No Ideas Found</h3>
                        <p>Try broadening your search criteria.</p>
                    </div>
                 )}
            </div>
             <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                <Button variant="secondary" onClick={handleBackToForm}>Try Again</Button>
                <Button variant="primary" onClick={onClose}>Done</Button>
            </div>
        </>
    );

    const renderStep = () => {
        switch(step) {
            case 'selection': return renderSelectionStep();
            case 'form': return renderFormStep();
            case 'loading': return renderLoadingStep();
            case 'results': return renderResultsStep();
            default: return renderSelectionStep();
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
                {renderStep()}
            </div>
        </div>
    );
};
