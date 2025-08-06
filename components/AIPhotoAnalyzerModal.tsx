import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, TrashIcon, CheckCircleIcon, XCircleIcon, TrophyIcon, CameraIcon } from './IconComponents';
import { AIPhotoAnalysisReport } from '../types';
import { analyzeProfilePhotos } from '../services/geminiService';

const MIN_PHOTOS = 2;
const MAX_PHOTOS = 5;

interface AIPhotoAnalyzerModalProps {
  onClose: () => void;
}

const fileToGenerativePart = (file: File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64 = (reader.result as string)?.split(',')[1];
            if (base64) {
                resolve({ base64, mimeType: file.type });
            } else {
                reject(new Error("Failed to convert file to base64"));
            }
        };
        reader.onerror = (error) => reject(error);
    });
};

export const AIPhotoAnalyzerModal: React.FC<AIPhotoAnalyzerModalProps> = ({ onClose }) => {
    const [step, setStep] = useState<'upload' | 'analyzing' | 'results'>('upload');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [analysisReport, setAnalysisReport] = useState<AIPhotoAnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Create and revoke object URLs for previews
        if (selectedFiles.length > 0) {
            const urls = selectedFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(urls);

            return () => {
                urls.forEach(url => URL.revokeObjectURL(url));
            };
        } else {
            setImagePreviews([]);
        }
    }, [selectedFiles]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (selectedFiles.length + files.length > MAX_PHOTOS) {
                alert(`You can only select up to ${MAX_PHOTOS} photos in total.`);
            } else {
                setSelectedFiles(prev => [...prev, ...files]);
            }
        }
        e.target.value = ''; // Reset file input
    };
    
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleAnalyze = async () => {
        if (selectedFiles.length < MIN_PHOTOS || selectedFiles.length > MAX_PHOTOS) return;
        
        setStep('analyzing');
        setError(null);
        
        try {
            const imageParts = await Promise.all(selectedFiles.map(fileToGenerativePart));
            const report = await analyzeProfilePhotos(imageParts);
            setAnalysisReport(report);
            setStep('results');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            setStep('upload'); // Go back to upload screen on error
        }
    };

    const reset = () => {
        setSelectedFiles([]);
        setAnalysisReport(null);
        setError(null);
        setStep('upload');
    }

    const renderUploadStep = () => (
        <div className="space-y-6">
            <p className="text-slate-600 text-center">
                Select between {MIN_PHOTOS} and {MAX_PHOTOS} photos you're considering. Our AI will analyze them and suggest the best one to be your main profile picture!
            </p>
            <div 
                className="w-full border-2 border-dashed border-dusty-rose rounded-lg p-8 text-center bg-cream/30 cursor-pointer hover:bg-cream/60 transition-colors"
                onClick={triggerFileInput}
            >
                <CameraIcon className="w-12 h-12 mx-auto text-rose-gold" />
                <p className="mt-2 font-semibold text-deep-teal">Click to upload photos</p>
                <p className="text-sm text-slate-500">or drag and drop</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/png, image/jpeg"
                    className="hidden"
                />
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            {imagePreviews.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-deep-teal">Selected Photos ({selectedFiles.length}/{MAX_PHOTOS}):</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                        {imagePreviews.map((src, index) => (
                            <img key={index} src={src} alt={`Preview ${index}`} className="w-full aspect-square object-cover rounded-lg shadow-sm" />
                        ))}
                    </div>
                     <div className="text-center">
                        <Button variant="ghost" onClick={() => setSelectedFiles([])} leftIcon={<TrashIcon className="w-5 h-5"/>}>Clear Selection</Button>
                    </div>
                </div>
            )}
        </div>
    );
    
    const renderAnalyzingStep = () => (
        <div className="flex flex-col items-center justify-center text-center p-8 h-full min-h-[400px]">
            <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
            <p className="mt-4 text-xl font-semibold text-deep-teal">Our AI is analyzing your photos...</p>
            <p className="text-slate-500">This might take a moment.</p>
        </div>
    );
    
    const AnalysisItem: React.FC<{ icon: React.ReactNode, children: React.ReactNode, variant: 'pro' | 'con' }> = ({ icon, children, variant }) => (
        <li className="flex items-start gap-2 text-sm">
            <span className={`flex-shrink-0 mt-0.5 ${variant === 'pro' ? 'text-green-500' : 'text-red-500'}`}>{icon}</span>
            <span className="text-slate-700">{children}</span>
        </li>
    );

    const renderResultsStep = () => {
        if (!analysisReport) return null;
        
        return (
            <div className="space-y-6">
                <div className="p-4 bg-cream rounded-lg text-center">
                    <h3 className="text-xl font-bold font-serif text-deep-teal">AI Recommendation</h3>
                    <p className="mt-1 text-slate-700">{analysisReport.overallRecommendation}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {imagePreviews.map((src, index) => {
                        const analysis = analysisReport.analyses[index];
                        const isBest = index === analysisReport.bestPhotoIndex;
                        return (
                            <div key={index} className={`bg-white p-4 rounded-xl shadow-md border-2 ${isBest ? 'border-rose-gold' : 'border-transparent'}`}>
                                <div className="relative">
                                    <img src={src} alt={`Analyzed photo ${index}`} className="w-full aspect-square object-cover rounded-lg" />
                                    {isBest && (
                                        <div className="absolute top-2 right-2 bg-rose-gold text-white px-3 py-1 text-sm font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                                            <TrophyIcon className="w-4 h-4" />
                                            Best Photo
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-deep-teal">Photo {index + 1}</h4>
                                        <span className="font-bold text-lg text-rose-gold">{analysis.score}/100</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ul className="space-y-1.5">
                                            {analysis.pros.map((pro, i) => (
                                                <AnalysisItem key={i} icon={<CheckCircleIcon className="w-4 h-4"/>} variant="pro">{pro}</AnalysisItem>
                                            ))}
                                        </ul>
                                         <ul className="space-y-1.5">
                                            {analysis.cons.map((con, i) => (
                                                <AnalysisItem key={i} icon={<XCircleIcon className="w-4 h-4"/>} variant="con">{con}</AnalysisItem>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">AI Photo Analyzer</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto bg-slate-50/50 flex-grow">
                    {step === 'upload' && renderUploadStep()}
                    {step === 'analyzing' && renderAnalyzingStep()}
                    {step === 'results' && renderResultsStep()}
                </div>

                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    {step === 'upload' && (
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button
                                onClick={handleAnalyze}
                                disabled={selectedFiles.length < MIN_PHOTOS || selectedFiles.length > MAX_PHOTOS}
                                leftIcon={<SparklesIcon className="w-5 h-5"/>}
                            >
                                Analyze Photos
                            </Button>
                        </>
                    )}
                    {step === 'results' && (
                        <>
                            <Button variant="secondary" onClick={reset}>Analyze More</Button>
                            <Button variant="primary" onClick={onClose}>Done</Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}