import React, { useState } from 'react';
import { UserProfile, Prompt } from '../types';
import { Button } from './Button';
import { CloseIcon, TrashIcon } from './IconComponents';

interface EditPromptsModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSave: (prompts: Prompt[]) => void;
}

const ALL_PROMPT_QUESTIONS = [
  "The key to my heart is...",
  "I'm looking for someone who...",
  "My most controversial opinion is...",
  "A life goal of mine is...",
  "I get way too excited about...",
  "What I value most in a partner is...",
  "Two truths and a lie...",
  "The best way to spend a Sunday is...",
  "I'm weirdly good at...",
  "My simple pleasures are...",
];

export const EditPromptsModal: React.FC<EditPromptsModalProps> = ({ profile, onClose, onSave }) => {
  const [prompts, setPrompts] = useState<Prompt[]>(profile.prompts || []);

  const handleAnswerChange = (id: number, newAnswer: string) => {
    setPrompts(currentPrompts =>
      currentPrompts.map(p => (p.id === id ? { ...p, answer: newAnswer } : p))
    );
  };

  const handleDeletePrompt = (id: number) => {
    setPrompts(currentPrompts => currentPrompts.filter(p => p.id !== id));
  };

  const handleAddPrompt = (question: string) => {
    if (question && !prompts.some(p => p.question === question)) {
      const newPrompt: Prompt = {
        id: Date.now(),
        question,
        answer: '',
      };
      setPrompts(currentPrompts => [...currentPrompts, newPrompt]);
    }
  };
  
  const handleSave = () => {
    // Filter out empty prompts on save
    const validPrompts = prompts.filter(p => p.answer.trim() !== '');
    onSave(validPrompts);
    onClose();
  };
  
  const availableQuestions = ALL_PROMPT_QUESTIONS.filter(q => !prompts.some(p => p.question === q));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal">Edit Prompts</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {prompts.map(prompt => (
            <div key={prompt.id} className="bg-slate-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <label htmlFor={`prompt-${prompt.id}`} className="font-semibold text-deep-teal">{prompt.question}</label>
                <button 
                  onClick={() => handleDeletePrompt(prompt.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  aria-label={`Delete prompt: ${prompt.question}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              <textarea
                id={`prompt-${prompt.id}`}
                value={prompt.answer}
                onChange={(e) => handleAnswerChange(prompt.id, e.target.value)}
                placeholder="Your answer here..."
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                rows={3}
              />
            </div>
          ))}
          
          {availableQuestions.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
                <label htmlFor="add-prompt" className="block text-lg font-semibold text-deep-teal mb-2">Add a new prompt</label>
                 <select
                    id="add-prompt"
                    onChange={(e) => handleAddPrompt(e.target.value)}
                    value=""
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition bg-white"
                 >
                    <option value="" disabled>Select a question...</option>
                    {availableQuestions.map(q => <option key={q} value={q}>{q}</option>)}
                 </select>
            </div>
          )}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};