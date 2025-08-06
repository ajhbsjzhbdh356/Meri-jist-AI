import React, { useState } from 'react';
import { UserProfile, Conversation, CoupleGoal } from '../types';
import { Button } from './Button';
import { SparklesIcon, PlusIcon, TrashIcon, CheckCircleIcon } from './IconComponents';
import { generateGoalEmoji, generateGoalSuggestions } from '../services/geminiService';

interface CoupleGoalsTrackerProps {
  goals: CoupleGoal[];
  onUpdateGoals: (newGoals: CoupleGoal[]) => void;
  currentUser: UserProfile;
  otherParticipant: UserProfile;
  conversation: Conversation;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div 
            className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);

const GoalItem: React.FC<{
    goal: CoupleGoal;
    onToggle: () => void;
    onDelete: () => void;
    suggestedByName: string;
}> = ({ goal, onToggle, onDelete, suggestedByName }) => (
    <div className={`p-4 rounded-lg flex items-center gap-4 transition-all duration-300 ${goal.isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'} border`}>
        <span className="text-3xl">{goal.emoji}</span>
        <div className="flex-1">
            <p className={`font-semibold ${goal.isComplete ? 'line-through text-slate-500' : 'text-deep-teal'}`}>{goal.title}</p>
            <p className="text-xs text-slate-500">Suggested by {suggestedByName}</p>
        </div>
        {!goal.isComplete && (
            <Button onClick={onToggle} className="!px-3 !py-1.5 !text-xs">Complete</Button>
        )}
        <button onClick={onDelete} className="text-slate-400 hover:text-red-500 transition-colors">
            <TrashIcon className="w-5 h-5"/>
        </button>
    </div>
);

export const CoupleGoalsTracker: React.FC<CoupleGoalsTrackerProps> = ({ goals, onUpdateGoals, currentUser, otherParticipant, conversation }) => {
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const completedGoals = goals.filter(g => g.isComplete);
    const activeGoals = goals.filter(g => !g.isComplete);
    const progress = goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoalTitle.trim()) return;

        setIsAdding(true);
        const title = newGoalTitle.trim();
        setNewGoalTitle('');

        try {
            const emoji = await generateGoalEmoji(title);
            const newGoal: CoupleGoal = {
                id: `goal-${Date.now()}`,
                title,
                emoji,
                isComplete: false,
                suggestedBy: currentUser.id,
            };
            onUpdateGoals([newGoal, ...goals]);
        } catch (err) {
            console.error(err);
            setError("Couldn't add goal. AI emoji generator might be busy.");
            // Add with default emoji
             const newGoal: CoupleGoal = {
                id: `goal-${Date.now()}`,
                title,
                emoji: '🎯',
                isComplete: false,
                suggestedBy: currentUser.id,
            };
            onUpdateGoals([newGoal, ...goals]);
        } finally {
            setIsAdding(false);
        }
    };

    const handleSuggestGoals = async () => {
        setIsSuggesting(true);
        setError(null);
        try {
            const suggestions = await generateGoalSuggestions(currentUser, otherParticipant, conversation);
            const newGoals: CoupleGoal[] = suggestions.map(s => ({
                ...s,
                id: `goal-${Date.now()}-${Math.random()}`,
                isComplete: false,
                suggestedBy: 'ai',
            }));
            onUpdateGoals([...newGoals, ...goals]);
        } catch (err) {
            console.error(err);
            setError("Couldn't get suggestions from AI right now.");
        } finally {
            setIsSuggesting(false);
        }
    };
    
    const handleToggleGoal = (id: string) => {
        onUpdateGoals(goals.map(g => g.id === id ? { ...g, isComplete: !g.isComplete } : g));
    };

    const handleDeleteGoal = (id: string) => {
        onUpdateGoals(goals.filter(g => g.id !== id));
    };
    
    const getSuggestedByName = (goal: CoupleGoal) => {
        if (goal.suggestedBy === 'ai') return 'SoulMate AI';
        if (goal.suggestedBy === currentUser.id) return 'You';
        return otherParticipant.name;
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                <h4 className="font-semibold text-deep-teal mb-2">Overall Progress</h4>
                <ProgressBar progress={progress} />
                <p className="text-sm text-slate-500 text-right mt-1">{completedGoals.length} of {goals.length} goals completed</p>
            </div>
            
            <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                <h4 className="font-semibold text-deep-teal mb-3">Add a New Goal</h4>
                <form onSubmit={handleAddGoal} className="flex gap-2">
                    <input
                        type="text"
                        value={newGoalTitle}
                        onChange={e => setNewGoalTitle(e.target.value)}
                        placeholder="e.g., Cook a new recipe together"
                        className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent"
                        disabled={isAdding}
                    />
                    <Button type="submit" disabled={!newGoalTitle.trim() || isAdding} className="!px-4">
                        {isAdding ? 'Adding...' : 'Add'}
                    </Button>
                </form>
                <div className="mt-3 text-center">
                    <Button variant="ghost" onClick={handleSuggestGoals} disabled={isSuggesting} leftIcon={<SparklesIcon />}>
                        {isSuggesting ? 'Thinking...' : 'Get AI Suggestions'}
                    </Button>
                </div>
                 {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
            </div>

            <div className="space-y-3">
                <h3 className="font-bold text-xl text-deep-teal">Active Goals</h3>
                {activeGoals.length > 0 ? (
                    activeGoals.map(goal => (
                        <GoalItem key={goal.id} goal={goal} onToggle={() => handleToggleGoal(goal.id)} onDelete={() => handleDeleteGoal(goal.id)} suggestedByName={getSuggestedByName(goal)}/>
                    ))
                ) : (
                    <p className="text-slate-500 italic text-center py-4">No active goals. Add one to get started!</p>
                )}
            </div>

            {completedGoals.length > 0 && (
                <div className="space-y-3 pt-6 border-t border-dusty-rose/50">
                    <h3 className="font-bold text-xl text-deep-teal flex items-center gap-2">
                        <CheckCircleIcon className="w-6 h-6 text-green-500"/>
                        Celebrations
                    </h3>
                    {completedGoals.map(goal => (
                         <GoalItem key={goal.id} goal={goal} onToggle={() => handleToggleGoal(goal.id)} onDelete={() => handleDeleteGoal(goal.id)} suggestedByName={getSuggestedByName(goal)}/>
                    ))}
                </div>
            )}
        </div>
    );
};
