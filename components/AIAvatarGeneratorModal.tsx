
import React, { useState } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon } from './IconComponents';
import { generateAvatar } from '../services/geminiService';

interface AIAvatarGeneratorModalProps {
  onClose: () => void;
  onSave: (base64Image: string) => void;
}

const StyleButton: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="px-3 py-1.5 text-sm bg-rose-gold/10 text-rose-gold rounded-full hover:bg-rose-gold/20 transition-colors">
        {children}
    </button>
);

const ImageSkeleton: React.FC = () => (
    <div className="w-full aspect-square bg-slate-200 rounded-lg animate-pulse flex flex-col items-center justify-center">
        <SparklesIcon className="w-16 h-16 text-rose-gold/50" />
        <p className="mt-4 text-lg font-semibold text-deep-teal/60">AI is painting your portrait...</p>
    </div>
);


export const AIAvatarGeneratorModal: React.FC<AIAvatarGeneratorModalProps> = ({ onClose, onSave }) => {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const base64Bytes = await generateAvatar(prompt);
            setGeneratedImage(base64Bytes);
        } catch (err: any) {
            setError(err.message || "An error occurred while generating your avatar. Please try again.");
            console.error(err);
        }
        setIsLoading(false);
    };
    
    const handleSave = () => {
        if (generatedImage) {
            onSave(generatedImage);
            onClose();
        }
    };
    
    const handleAddStyle = (style: string) => {
        setPrompt(p => p.trim() ? `${p.trim()}, ${style}` : style);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">AI Avatar Generator</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <p className="text-slate-600">Describe your ideal profile picture, and our AI will create it for you. Be descriptive for the best results!</p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A professional headshot of a smiling South Asian woman in her late 20s, with long dark hair, wearing a blue kurti, against a soft, out-of-focus garden background."
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                        rows={4}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-500">Add a style:</span>
                        <StyleButton onClick={() => handleAddStyle('cinematic lighting')}>Cinematic</StyleButton>
                        <StyleButton onClick={() => handleAddStyle('watercolor illustration')}>Watercolor</StyleButton>
                        <StyleButton onClick={() => handleAddStyle('fantasy art')}>Fantasy</StyleButton>
                        <StyleButton onClick={() => handleAddStyle('anime style')}>Anime</StyleButton>
                    </div>

                    <div className="mt-4 text-center">
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} leftIcon={<SparklesIcon className="w-5 h-5"/>}>
                            {isLoading ? 'Generating...' : (generatedImage ? 'Generate Again' : 'Generate with AI')}
                        </Button>
                    </div>

                    <div className="mt-6">
                        {isLoading ? (
                            <ImageSkeleton />
                        ) : error ? (
                            <div className="w-full aspect-square bg-red-50 border border-red-200 text-red-700 rounded-lg flex flex-col items-center justify-center p-4">
                                <h4 className="font-bold">Generation Failed</h4>
                                <p className="text-sm text-center mt-2">{error}</p>
                            </div>
                        ) : generatedImage ? (
                            <img
                                src={`data:image/jpeg;base64,${generatedImage}`}
                                alt="AI Generated Avatar"
                                className="w-full aspect-square object-cover rounded-lg shadow-md"
                            />
                        ) : (
                             <div className="w-full aspect-square bg-slate-50 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-4">
                                <p className="text-slate-500">Your generated avatar will appear here.</p>
                             </div>
                        )}
                    </div>
                </div>

                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!generatedImage || isLoading}>
                        Use this Avatar
                    </Button>
                </div>
            </div>
        </div>
    );
};
