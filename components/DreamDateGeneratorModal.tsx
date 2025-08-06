import React, { useState } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon } from './IconComponents';
import { generateDreamDateImage } from '../services/geminiService';

interface DreamDateGeneratorModalProps {
  onClose: () => void;
}

const StyleButton: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="px-3 py-1.5 text-sm bg-rose-gold/10 text-rose-gold rounded-full hover:bg-rose-gold/20 transition-colors">
        {children}
    </button>
);

const ImageSkeleton: React.FC = () => (
    <div className="w-full aspect-video bg-slate-200 rounded-lg animate-pulse flex flex-col items-center justify-center">
        <SparklesIcon className="w-16 h-16 text-rose-gold/50" />
        <p className="mt-4 text-lg font-semibold text-deep-teal/60">AI is illustrating your dream date...</p>
    </div>
);


export const DreamDateGeneratorModal: React.FC<DreamDateGeneratorModalProps> = ({ onClose }) => {
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
            const base64Bytes = await generateDreamDateImage(prompt);
            setGeneratedImage(base64Bytes);
        } catch (err: any) {
            setError(err.message || "An error occurred while generating your image. Please try again.");
            console.error(err);
        }
        setIsLoading(false);
    };
    
    const handleAddStyle = (style: string) => {
        setPrompt(p => p.trim() ? `${p.trim()}, ${style}` : style);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">Dream Date Illustrator</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <p className="text-slate-600">Describe your perfect date scene, and let our AI bring it to life! Be as imaginative as you like.</p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A romantic candlelight dinner on a beach at sunset, with lanterns floating in the sky."
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                        rows={3}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-500">Add a style:</span>
                        <StyleButton onClick={() => handleAddStyle('photorealistic')}>Photorealistic</StyleButton>
                        <StyleButton onClick={() => handleAddStyle('cinematic lighting')}>Cinematic</StyleButton>
                        <StyleButton onClick={() => handleAddStyle('impressionist painting')}>Impressionist</StyleButton>
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
                            <div className="w-full aspect-video bg-red-50 border border-red-200 text-red-700 rounded-lg flex flex-col items-center justify-center p-4">
                                <h4 className="font-bold">Generation Failed</h4>
                                <p className="text-sm text-center mt-2">{error}</p>
                            </div>
                        ) : generatedImage ? (
                            <img
                                src={`data:image/jpeg;base64,${generatedImage}`}
                                alt="AI Generated Dream Date"
                                className="w-full aspect-video object-contain rounded-lg shadow-md bg-slate-100"
                            />
                        ) : (
                             <div className="w-full aspect-video bg-slate-50 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-4">
                                <p className="text-slate-500">Your generated dream date will appear here.</p>
                             </div>
                        )}
                    </div>
                </div>

                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};