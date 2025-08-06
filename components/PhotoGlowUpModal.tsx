import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, ArrowPathIcon } from './IconComponents';
import { Photo } from '../types';
import { glowUpPhoto } from '../services/geminiService';

interface PhotoGlowUpModalProps {
  photo: Photo;
  onClose: () => void;
  onSave: (newUrl: string) => void;
}

const urlToBase64 = async (url: string): Promise<{ base64: string, mimeType: string }> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const mimeType = blob.type;
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string)?.split(',')[1];
            if (base64) {
                resolve({ base64, mimeType });
            } else {
                reject(new Error("Failed to convert image to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const ImageSkeleton: React.FC = () => (
    <div className="w-full aspect-[4/3] bg-slate-200 rounded-lg animate-pulse flex flex-col items-center justify-center">
        <SparklesIcon className="w-16 h-16 text-rose-gold/50" />
        <p className="mt-4 text-lg font-semibold text-deep-teal/60">AI is giving your photo a glow-up...</p>
    </div>
);


export const PhotoGlowUpModal: React.FC<PhotoGlowUpModalProps> = ({ photo, onClose, onSave }) => {
    const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start loading immediately
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const performGlowUp = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // For picsum photos, which are dynamically generated, fetching them helps ensure consistency
                const { base64, mimeType } = await urlToBase64(photo.url);
                const newImageBase64 = await glowUpPhoto(base64, mimeType);
                setNewImageUrl(`data:image/jpeg;base64,${newImageBase64}`);
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred during the glow-up. Please try again.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        
        performGlowUp();
    }, [photo.url]); // Re-run if the photo prop somehow changes
    
    const handleSave = () => {
        if (newImageUrl) {
            onSave(newImageUrl);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">AI Photo Glow-Up</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <p className="text-slate-600 text-center">Our AI has generated an enhanced version of your photo. Compare them below and choose if you'd like to use the new one.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-center font-semibold text-deep-teal mb-2">Original</h3>
                            <img src={photo.url} alt="Original" className="w-full aspect-[4/3] object-cover rounded-lg shadow-md" />
                        </div>
                        <div>
                            <h3 className="text-center font-semibold text-deep-teal mb-2">AI Glow-Up</h3>
                             {isLoading ? (
                                <ImageSkeleton />
                            ) : error ? (
                                <div className="w-full aspect-[4/3] bg-red-50 border border-red-200 text-red-700 rounded-lg flex flex-col items-center justify-center p-4">
                                    <h4 className="font-bold">Generation Failed</h4>
                                    <p className="text-sm text-center mt-2">{error}</p>
                                </div>
                            ) : newImageUrl ? (
                                <img
                                    src={newImageUrl}
                                    alt="AI Generated Photo"
                                    className="w-full aspect-[4/3] object-cover rounded-lg shadow-md"
                                />
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading || !!error || !newImageUrl}>
                        Use New Photo
                    </Button>
                </div>
            </div>
        </div>
    );
};