import React, { useState } from 'react';
import { Button } from './Button';
import { CloseIcon, SparklesIcon, MicrophoneIcon, StopIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from './IconComponents';
import { PostDateAnalysis } from '../types';
import { analyzePostDateDebrief, transcribeAudio } from '../services/geminiService';
import VoiceVisualizer from './VoiceVisualizer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface PostDateDebriefModalProps {
  onClose: () => void;
}

const DEBRIEF_STEPS = [
  {
    title: "How did the date go?",
    placeholder: "Tell me everything! What did you do, how was the conversation, what was the general vibe?",
    key: "mainDescription"
  },
  {
    title: "What did you enjoy the most?",
    placeholder: "Think about a moment that made you smile, a topic you loved discussing, or something they did that you appreciated.",
    key: "enjoyedMost"
  },
  {
    title: "Did anything feel off?",
    placeholder: "This is a space for honesty. Was there anything that made you feel uncomfortable or gave you pause? (It's okay if not!)",
    key: "feltOff"
  },
];

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
            className="bg-rose-gold h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);


export const PostDateDebriefModal: React.FC<PostDateDebriefModalProps> = ({ onClose }) => {
    const [step, setStep] = useState(0); // 0-2 for questions, 3 for loading, 4 for results
    const [answers, setAnswers] = useState<Record<string, string>>({ mainDescription: '', enjoyedMost: '', feltOff: ''});
    const [result, setResult] = useState<PostDateAnalysis | null>(null);

    // Audio recording state from hook
    const {
        isRecording,
        mediaStream,
        recordedAudioUrl,
        recordedAudioBlob,
        startRecording,
        stopRecording,
        deleteRecording,
    } = useAudioRecorder();

    const [isTranscribing, setIsTranscribing] = useState(false);
    
    const handleNext = () => {
        if (step < DEBRIEF_STEPS.length - 1) {
            setStep(step + 1);
        }
    };
    
    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };
    
    const handleAnswerChange = (key: string, value: string) => {
        setAnswers(prev => ({...prev, [key]: value}));
    }

    const handleSubmit = async () => {
        setStep(3); // Show loading screen
        try {
            const analysisResult = await analyzePostDateDebrief(
                answers.mainDescription,
                answers.enjoyedMost,
                answers.feltOff
            );
            setResult(analysisResult);
        } catch(error) {
            console.error("Failed to analyze post-date debrief:", error);
            setResult({
                vibe: "Analysis Error",
                vibeEmoji: "🤔",
                greenFlags: [],
                redFlags: ["There was an issue analyzing your input. Please try again."],
                nextStepSuggestion: "I'm having a little trouble analyzing your debrief right now. Please check your connection and try again in a moment."
            });
        }
        setStep(4); // Show results screen
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

    const handleTranscribeAudio = async () => {
        if (!recordedAudioBlob) return;
        setIsTranscribing(true);
        try {
            const audioBase64 = await blobToBase64(recordedAudioBlob);
            const transcription = await transcribeAudio(audioBase64, recordedAudioBlob.type);
            handleAnswerChange('mainDescription', transcription);
        } catch(e) {
            console.error(e);
            handleAnswerChange('mainDescription', "Sorry, there was an error processing your audio.");
        } finally {
            setIsTranscribing(false);
            deleteRecording();
        }
    };

    const progressPercentage = ((step + 1) / DEBRIEF_STEPS.length) * 100;
    const isLastQuestion = step === DEBRIEF_STEPS.length - 1;

    const renderQuestions = () => {
        const currentStep = DEBRIEF_STEPS[step];
        const currentAnswer = answers[currentStep.key];
        const isMainDescriptionStep = currentStep.key === 'mainDescription';

        return (
            <>
                <div className="p-6 border-b border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-2xl font-bold font-serif text-deep-teal">Post-Date Debrief</h2>
                        <span className="font-semibold text-slate-500">{step + 1} / {DEBRIEF_STEPS.length}</span>
                    </div>
                    <ProgressBar progress={progressPercentage} />
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <h3 className="text-xl font-semibold text-center text-slate-800">{currentStep.title}</h3>
                    {isRecording ? (
                        <div className="my-4">
                            <VoiceVisualizer mediaStream={mediaStream} isRecording={isRecording} />
                            <p className="text-center text-deep-teal font-semibold mt-2">Recording...</p>
                        </div>
                    ) : (
                        <textarea
                            value={currentAnswer}
                            onChange={(e) => handleAnswerChange(currentStep.key, e.target.value)}
                            placeholder={currentStep.placeholder}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition disabled:bg-slate-100"
                            rows={isMainDescriptionStep ? 7 : 4}
                            disabled={isRecording || recordedAudioUrl !== null}
                        />
                    )}
                    
                    {isMainDescriptionStep && (
                        <>
                             <div className="my-2 flex items-center gap-4">
                                <hr className="flex-grow border-slate-200" />
                                <span className="text-slate-500 font-semibold">OR</span>
                                <hr className="flex-grow border-slate-200" />
                            </div>
                            <div className="text-center">
                                <Button 
                                    variant="secondary"
                                    onClick={isRecording ? stopRecording : startRecording} 
                                    leftIcon={isRecording ? <StopIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5"/>}
                                    className={isRecording ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200 animate-pulse' : ''}
                                    disabled={isTranscribing}
                                >
                                    {isRecording ? 'Stop Recording' : 'Record with Voice'}
                                </Button>
                            </div>
                            {recordedAudioUrl && (
                                <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center gap-3 border border-slate-200">
                                    <audio controls src={recordedAudioUrl} className="flex-1 h-10"></audio>
                                    <Button onClick={handleTranscribeAudio} disabled={isTranscribing}>
                                        {isTranscribing ? 'Transcribing...' : 'Use this Audio'}
                                    </Button>
                                    <button type="button" onClick={deleteRecording} className="p-2 text-slate-500 hover:text-red-600 rounded-full">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
                 <div className="p-6 mt-auto border-t border-slate-200 flex justify-between items-center">
                    <Button variant="ghost" onClick={handleBack} disabled={step === 0}>Back</Button>
                    {isLastQuestion ? (
                        <Button onClick={handleSubmit} disabled={!currentAnswer.trim()}>Get My Analysis</Button>
                    ) : (
                        <Button onClick={handleNext} disabled={!currentAnswer.trim()}>Next</Button>
                    )}
                </div>
            </>
        )
    };
    
    const renderLoading = () => (
        <div className="flex flex-col items-center justify-center text-center p-8 h-full">
            <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
            <p className="mt-4 text-xl font-semibold text-deep-teal">AI is reflecting on your date...</p>
            <p className="text-slate-500">Your personalized debrief is on its way.</p>
        </div>
    );
    
    const AnalysisItem: React.FC<{icon: React.ReactNode, children: React.ReactNode}> = ({icon, children}) => (
        <li className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex-shrink-0 mt-0.5">{icon}</div>
            <span className="text-slate-700">{children}</span>
        </li>
    );

    const renderResults = () => {
        if (!result) return renderLoading();
        return (
             <>
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal text-center">Your Post-Date Debrief</h2>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="text-center p-6 bg-cream rounded-xl">
                        <span className="text-5xl">{result.vibeEmoji}</span>
                        <h3 className="text-3xl font-bold font-serif text-rose-gold mt-2">{result.vibe}</h3>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-deep-teal mb-3">✅ Green Flags</h4>
                        <ul className="space-y-2">
                            {result.greenFlags.length > 0 ? (
                                result.greenFlags.map((flag, index) => (
                                    <AnalysisItem key={index} icon={<CheckCircleIcon className="w-6 h-6 text-green-500"/>}>{flag}</AnalysisItem>
                                ))
                            ) : (
                                <p className="text-slate-500 px-3">No specific green flags identified, which is perfectly okay!</p>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-deep-teal mb-3">🤔 Food for Thought</h4>
                        <ul className="space-y-2">
                             {result.redFlags.length > 0 ? (
                                result.redFlags.map((flag, index) => (
                                    <AnalysisItem key={index} icon={<XCircleIcon className="w-6 h-6 text-amber-500"/>}>{flag}</AnalysisItem>
                                ))
                            ) : (
                                <p className="text-slate-500 px-3">Nothing stood out as a point of concern. That's great news!</p>
                            )}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-deep-teal mb-3">💡 Suggested Next Step</h4>
                        <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-slate-800 font-medium">{result.nextStepSuggestion}</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="primary" onClick={onClose}>Done</Button>
                </div>
             </>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative">
                {step <= 2 && (
                    <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 z-10">
                        <CloseIcon />
                    </button>
                )}
                {step <= 2 && renderQuestions()}
                {step === 3 && renderLoading()}
                {step === 4 && renderResults()}
            </div>
        </div>
    );
};
