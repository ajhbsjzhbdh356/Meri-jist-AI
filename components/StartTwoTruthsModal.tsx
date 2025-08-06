
import React, { useState } from 'react';
import { Button } from './Button';
import { CloseIcon } from './IconComponents';

interface StartTwoTruthsModalProps {
  onClose: () => void;
  onStartGame: (statements: string[], lieIndex: number) => void;
}

const LabeledInput: React.FC<{
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLie: boolean;
    onSelectLie: () => void;
    label: string;
}> = ({ id, value, onChange, isLie, onSelectLie, label }) => (
    <div className="flex items-center gap-3">
        <input
            type="radio"
            name="lie"
            id={`radio-${id}`}
            checked={isLie}
            onChange={onSelectLie}
            className="w-5 h-5 text-rose-gold focus:ring-rose-gold border-slate-400"
        />
        <div className="flex-1">
            <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
            <input
                type="text"
                id={id}
                value={value}
                onChange={onChange}
                placeholder="Enter a statement..."
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
            />
        </div>
    </div>
);

export const StartTwoTruthsModal: React.FC<StartTwoTruthsModalProps> = ({ onClose, onStartGame }) => {
    const [statements, setStatements] = useState(['', '', '']);
    const [lieIndex, setLieIndex] = useState<number | null>(null);

    const handleStatementChange = (index: number, value: string) => {
        const newStatements = [...statements];
        newStatements[index] = value;
        setStatements(newStatements);
    };

    const canStart = statements.every(s => s.trim() !== '') && lieIndex !== null;

    const handleStart = () => {
        if (canStart) {
            onStartGame(statements, lieIndex!);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">Two Truths & a Lie</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <p className="text-slate-600">Enter two true statements and one lie about yourself. Your match will try to guess the lie! Select the radio button next to your lie.</p>
                    <LabeledInput
                        id="statement1"
                        label="Statement 1"
                        value={statements[0]}
                        onChange={(e) => handleStatementChange(0, e.target.value)}
                        isLie={lieIndex === 0}
                        onSelectLie={() => setLieIndex(0)}
                    />
                     <LabeledInput
                        id="statement2"
                        label="Statement 2"
                        value={statements[1]}
                        onChange={(e) => handleStatementChange(1, e.target.value)}
                        isLie={lieIndex === 1}
                        onSelectLie={() => setLieIndex(1)}
                    />
                     <LabeledInput
                        id="statement3"
                        label="Statement 3"
                        value={statements[2]}
                        onChange={(e) => handleStatementChange(2, e.target.value)}
                        isLie={lieIndex === 2}
                        onSelectLie={() => setLieIndex(2)}
                    />
                </div>
                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleStart} disabled={!canStart}>Start Game</Button>
                </div>
            </div>
        </div>
    );
};
