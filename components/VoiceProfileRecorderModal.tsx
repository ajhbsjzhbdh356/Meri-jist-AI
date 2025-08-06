import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, MicrophoneIcon, StopIcon, TrashIcon } from './IconComponents';
import { transcribeAudio } from '../services/geminiService';
import VoiceVisualizer from './VoiceVisualizer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

const MAX_RECORDING_TIME_SECONDS = 30;

interface VoiceProfileRecorderModalProps {
  onClose: () => void;
  onSave: (data: { voiceProfileUrl: string, voiceProfileTranscription: string }) => void;
}

export const VoiceProfileRecorderModal: React.FC<VoiceProfileRecorderModalProps> = ({ onClose, onSave }) => {
    const {
        isRecording,
        mediaStream,
        recordedAudioUrl,
        recordedAudioBlob,
        startRecording,
        stopRecording,
        deleteRecording,
    } = useAudioRecorder();
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(MAX_RECORDING_TIME_SECONDS);
    
    // Timer effect
    useEffect(() => {
        if (!isRecording) {
            setTimeLeft(MAX_RECORDING_TIME_SECONDS);
            return;
        }

        if (timeLeft === 0) {
            stopRecording();
            return;
        }

        const intervalId = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [isRecording, timeLeft, stopRecording]);

    const handleStartRecording = () => {
        deleteRecording(); // Clear previous recording if any
        startRecording();
    };

    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string)?.split(',')[1];
                if(base64) resolve(base64);
                else reject(new Error("Failed to convert blob to base64"));
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

    const handleSaveRecording = async () => {
        if (!recordedAudioBlob || !recordedAudioUrl) return;
        setIsProcessing(true);
        try {
            const audioBase64 = await blobToBase64(recordedAudioBlob);
            const transcription = await transcribeAudio(audioBase64, recordedAudioBlob.type);
            onSave({
                voiceProfileUrl: recordedAudioUrl,
                voiceProfileTranscription: transcription,
            });
            onClose();
        } catch(e) {
            console.error(e);
            alert("Sorry, there was an error processing your audio. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const renderInitialView = () => (
        <div className="text-center py-8">
            <p className="text-slate-600 mb-6 max-w-md mx-auto">Record a short audio clip (up to 30 seconds) to let your personality shine. You can talk about your passions, what you're looking for, or just say hello!</p>
            <Button
                onClick={handleStartRecording}
                leftIcon={<MicrophoneIcon className="w-6 h-6"/>}
                className="!px-8 !py-4 !text-lg"
            >
                Start Recording
            </Button>
        </div>
    );
    
    const renderRecordingView = () => (
        <div className="text-center py-8 space-y-6">
            <p className="text-xl font-semibold text-deep-teal">Recording...</p>
            <VoiceVisualizer mediaStream={mediaStream} isRecording={isRecording} />
            <p className="text-3xl font-bold text-rose-gold font-mono">{timeLeft}s</p>
            <Button
                onClick={stopRecording}
                leftIcon={<StopIcon className="w-6 h-6"/>}
                className="!px-8 !py-4 !text-lg bg-red-600 hover:bg-red-700 shadow-red-500/30"
            >
                Stop Recording
            </Button>
        </div>
    );
    
    const renderPreviewView = () => (
        <div className="py-8 space-y-6">
            <p className="text-slate-600 text-center">Here's your recording. Listen back, and if you're happy, save it to your profile.</p>
             <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-center gap-3 border border-slate-200">
                <audio controls src={recordedAudioUrl!} className="w-full"></audio>
            </div>
            <div className="flex justify-center gap-4">
                <Button variant="secondary" onClick={deleteRecording}>
                    Record Again
                </Button>
                 <Button onClick={handleSaveRecording}>
                    Save to Profile
                </Button>
            </div>
        </div>
    );

    const renderProcessingView = () => (
        <div className="flex flex-col items-center justify-center text-center p-8 h-full">
            <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
            <p className="mt-4 text-xl font-semibold text-deep-teal">AI is transcribing your intro...</p>
            <p className="text-slate-500">This will just take a moment.</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col relative">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">Record Voice Introduction</h2>
                    {!isProcessing && (
                         <button onClick={onClose} className="text-slate-500 hover:text-slate-800 z-10">
                            <CloseIcon />
                        </button>
                    )}
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow flex flex-col justify-center">
                    {isProcessing ? renderProcessingView() :
                     isRecording ? renderRecordingView() : 
                     recordedAudioUrl ? renderPreviewView() : 
                     renderInitialView()
                    }
                </div>
            </div>
        </div>
    );
};
