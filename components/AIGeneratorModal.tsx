

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, MicrophoneIcon, StopIcon, TrashIcon } from './IconComponents';
import { AIGeneratorType } from '../types';
import { generateAIContent, generateContentFromAudio } from '../services/geminiService';
import VoiceVisualizer from './VoiceVisualizer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AIGeneratorModalProps {
  type: AIGeneratorType;
  onClose: () => void;
  onSave: (content: string) => void;
  initialKeywords?: string;
  title: string;
  description: string;
  placeholder: string;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ type, onClose, onSave, initialKeywords = '', title, description, placeholder }) => {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  
  const {
    isRecording,
    mediaStream,
    recordedAudioUrl,
    recordedAudioBlob,
    startRecording,
    stopRecording,
    deleteRecording,
  } = useAudioRecorder();

  const enableVoice = type === AIGeneratorType.BIO || type === AIGeneratorType.STORY;
  
  const handleStartRecording = () => {
    deleteRecording();
    setGeneratedContent('');
    setKeywords('');
    startRecording();
  };
  
  const handleGenerate = async () => {
    if (!keywords.trim()) return;
    setIsLoading(true);
    setGeneratedContent('');
    try {
      const content = await generateAIContent(type, keywords);
      setGeneratedContent(content);
    } catch (error) {
      console.error("AI Generation failed", error);
      setGeneratedContent("I'm having a little trouble thinking right now. Please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    // For captions, we only want to save the first one if multiple are generated
    const contentToSave = type === AIGeneratorType.CAPTION ? generatedContent.split('\n')[0] : generatedContent;
    onSave(contentToSave);
    onClose();
  };
  
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string)?.split(',')[1];
            if(base64) {
                resolve(base64);
            } else {
                reject(new Error("Failed to convert blob to base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
  }

  const handleGenerateFromAudio = async () => {
      if (!recordedAudioBlob) return;
      
      setIsLoading(true);
      setIsProcessingAudio(true);
      setGeneratedContent('');

      try {
          const audioBase64 = await blobToBase64(recordedAudioBlob);
          const content = await generateContentFromAudio(type, audioBase64, recordedAudioBlob.type);
          setGeneratedContent(content);
      } catch (error) {
          console.error("Audio generation failed", error);
          setGeneratedContent("Sorry, there was an error processing your audio. Please try again.");
      } finally {
          setIsLoading(false);
          setIsProcessingAudio(false);
          deleteRecording();
      }
  };

  const mainLoaderActive = isLoading || isProcessingAudio;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-brand-purple-dark">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-slate-600 mb-4">{description}</p>
          
          {!isRecording && (
            <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={placeholder}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent transition disabled:bg-slate-100"
                rows={4}
                disabled={isRecording || recordedAudioUrl !== null}
            />
          )}

          {isRecording && (
            <div className="my-4">
              <VoiceVisualizer mediaStream={mediaStream} isRecording={isRecording} />
              <p className="text-center text-brand-purple-dark font-semibold mt-2">Recording... Say a few words about yourself.</p>
            </div>
          )}
          
          <div className="mt-4 text-center">
            <Button onClick={handleGenerate} disabled={mainLoaderActive || !keywords.trim() || isRecording || recordedAudioUrl !== null} leftIcon={<SparklesIcon className="w-5 h-5"/>}>
              {isLoading ? 'Generating...' : 'Generate from Text'}
            </Button>
          </div>

          {enableVoice && (
            <>
                <div className="my-4 flex items-center gap-4">
                    <hr className="flex-grow border-slate-200" />
                    <span className="text-slate-500 font-semibold">OR</span>
                    <hr className="flex-grow border-slate-200" />
                </div>

                <div className="text-center">
                    <Button 
                        variant="secondary"
                        onClick={isRecording ? stopRecording : handleStartRecording} 
                        leftIcon={isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5"/>}
                        className={isRecording ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 animate-pulse' : ''}
                        disabled={mainLoaderActive}
                    >
                        {isRecording ? 'Stop Recording' : 'Generate with Voice'}
                    </Button>
                </div>
                
                {recordedAudioUrl && !isProcessingAudio && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center gap-3 border border-slate-200">
                        <audio controls src={recordedAudioUrl} className="flex-1 h-10"></audio>
                        <Button onClick={handleGenerateFromAudio} disabled={isProcessingAudio}>
                            {isProcessingAudio ? 'Generating...' : 'Use this Audio'}
                        </Button>
                        <button type="button" onClick={deleteRecording} className="p-2 text-slate-500 hover:text-red-600 rounded-full">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                )}
            </>
          )}

          {mainLoaderActive && (
            <div className="mt-6 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg">
                <SparklesIcon className="w-12 h-12 text-brand-secondary animate-pulse" />
                <p className="mt-4 text-lg font-semibold text-brand-purple-dark">{isProcessingAudio ? 'AI is listening and writing...' : 'Our AI is writing for you...'}</p>
                <p className="text-slate-500">This might take a moment.</p>
            </div>
          )}

          {generatedContent && (
            <div className="mt-6">
              <h3 className="font-bold text-lg text-brand-purple-dark mb-2">AI Generated Suggestion:</h3>
              <div className="bg-cream p-4 rounded-lg border border-dusty-rose/50 whitespace-pre-wrap font-sans">
                 {type === AIGeneratorType.CAPTION 
                    ? generatedContent.split('\n').map((line, i) => (
                        <button key={i} onClick={() => { onSave(line); onClose(); }} className="block text-left w-full p-2 hover:bg-brand-secondary/10 rounded-md transition-colors">{line}</button>
                    ))
                    : <p>{generatedContent}</p>
                 }
              </div>
            </div>
          )}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {generatedContent && type !== AIGeneratorType.CAPTION && (
            <Button onClick={handleSave}>Use This</Button>
          )}
        </div>
      </div>
    </div>
  );
};