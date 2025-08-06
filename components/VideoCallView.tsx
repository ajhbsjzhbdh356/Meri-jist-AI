import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, SharedMemory } from '../types';
import { generateVideoCallTopics, createVideoCallMemory } from '../services/geminiService';
import { Button } from './Button';
import { MicrophoneIcon, MicrophoneSlashIcon, VideoCameraIcon, PhoneXMarkIcon, SparklesIcon, CloseIcon, VideoCameraSlashIcon, CameraSparklesIcon } from './IconComponents';
import { useCamera } from '../hooks/useCamera';

interface VideoCallViewProps {
    currentUser: UserProfile;
    otherParticipant: UserProfile;
    onEndCall: (duration: number) => void;
    onAddMemory: (memoryData: Omit<SharedMemory, 'id'>) => void;
}

const VideoPlaceholder: React.FC<{ name: string, isCameraOff?: boolean }> = ({ name, isCameraOff }) => (
    <div className="w-full h-full bg-midnight-blue rounded-lg flex flex-col items-center justify-center text-white relative overflow-hidden">
        {isCameraOff ? (
            <VideoCameraSlashIcon className="w-16 h-16 opacity-50" />
        ) : (
            <img src="https://i.imgur.com/3oAlC4A.gif" className="absolute w-full h-full object-cover opacity-10" alt="background pattern"/>
        )}
        <div className="relative z-10 text-center p-2 bg-black/20 rounded-lg">
             <p className="font-semibold">{name}</p>
            <p className="text-sm opacity-70">{isCameraOff ? "Camera Off" : "Video Feed"}</p>
        </div>
    </div>
);

export const VideoCallView: React.FC<VideoCallViewProps> = ({ currentUser, otherParticipant, onEndCall, onAddMemory }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [duration, setDuration] = useState(0);
    const [isCoachOpen, setIsCoachOpen] = useState(false);
    const [coachTopics, setCoachTopics] = useState<string[]>([]);
    const [isFetchingTopics, setIsFetchingTopics] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [showCaptureNotification, setShowCaptureNotification] = useState(false);
    
    const localVideoElementRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { stream, error, getStream, stopStream, videoCallbackRef } = useCamera();

    const handleVideoRef = useCallback((node: HTMLVideoElement | null) => {
        localVideoElementRef.current = node;
        videoCallbackRef(node);
    }, [videoCallbackRef]);

    useEffect(() => {
        getStream();
        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
        
        return () => {
            clearInterval(timer);
            stopStream();
        };
    }, [getStream, stopStream]);

    useEffect(() => {
        if (stream) {
            stream.getVideoTracks().forEach(track => track.enabled = !isCameraOff);
            stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
        }
    }, [stream, isMuted, isCameraOff]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleGetTopics = async () => {
        setIsFetchingTopics(true);
        try {
            const topics = await generateVideoCallTopics(currentUser, otherParticipant);
            setCoachTopics(topics);
        } catch (error) {
            console.error("Failed to fetch video call topics", error);
            setCoachTopics(["Sorry, I couldn't think of any topics right now."]);
        } finally {
            setIsFetchingTopics(false);
        }
    };

    const handleCaptureMoment = async () => {
        if (!localVideoElementRef.current || !stream || isCapturing) return;
        
        setIsCapturing(true);

        const video = localVideoElementRef.current;
        const canvas = canvasRef.current;
        if (!canvas) {
            setIsCapturing(false);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setIsCapturing(false);
            return;
        }
        
        // Flip the image back to normal from its mirrored state
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        try {
            const memoryData = await createVideoCallMemory(base64Image, 'image/jpeg');
            onAddMemory(memoryData);
            setShowCaptureNotification(true);
            setTimeout(() => setShowCaptureNotification(false), 3000);
        } catch (error) {
            console.error("Failed to create video call memory", error);
        } finally {
            setIsCapturing(false);
        }
    };

    const handleEndCall = () => {
        stopStream();
        onEndCall(duration);
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {showCaptureNotification && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg z-20 animate-in fade-in slide-in-from-top-4">
                    Memory captured and added to your chat!
                </div>
            )}
            <div className="relative w-full h-full flex flex-col md:flex-row gap-4">
                {/* Main Video Area */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Remote Video */}
                    <div className="flex-1 relative">
                        <VideoPlaceholder name={otherParticipant.name} />
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded-md font-mono">{formatDuration(duration)}</div>
                    </div>
                    {/* Local Video */}
                    <div className="w-full md:w-1/4 h-32 md:h-auto md:aspect-[4/3] self-end rounded-lg overflow-hidden bg-midnight-blue relative">
                         {stream && !isCameraOff ? (
                            <video ref={handleVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                        ) : (
                            <VideoPlaceholder name={currentUser.name} isCameraOff={isCameraOff || !!error} />
                        )}
                        {error && <div className="absolute bottom-2 left-2 right-2 p-1 text-xs text-center bg-red-800/80 text-white rounded">{error}</div>}
                    </div>
                </div>

                {/* Coach Panel */}
                <div className={`relative bg-space-cadet rounded-xl shadow-lg transition-all duration-300 ease-in-out flex flex-col ${isCoachOpen ? 'w-full md:w-80 p-4' : 'w-16'}`}>
                    {isCoachOpen ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-ghost-white">AI Coach</h3>
                                <button onClick={() => setIsCoachOpen(false)} className="text-slate-gray hover:text-ghost-white"><CloseIcon /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                               {coachTopics.length === 0 && !isFetchingTopics && (
                                    <div className="text-center p-4">
                                         <p className="text-sm text-slate-gray mb-4">Stuck for words? Let AI suggest some conversation starters based on your profiles.</p>
                                        <Button onClick={handleGetTopics} leftIcon={<SparklesIcon />}>Get Topics</Button>
                                    </div>
                               )}
                               {isFetchingTopics && <p className="text-slate-gray text-center">Thinking...</p>}
                               {coachTopics.length > 0 && (
                                   <div className="space-y-2">
                                       <h4 className="font-semibold text-ghost-white">Conversation Starters:</h4>
                                       <ul className="list-disc list-inside text-sm text-slate-gray space-y-2 p-2">
                                           {coachTopics.map((topic, i) => <li key={i}>{topic}</li>)}
                                       </ul>
                                       <Button onClick={handleGetTopics} variant="secondary" className="w-full mt-4 !text-xs">Get More</Button>
                                   </div>
                               )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            <button onClick={() => setIsCoachOpen(true)} className="p-3 hover:bg-electric-pink/10 rounded-full text-electric-pink" title="Open AI Coach">
                                <SparklesIcon className="w-8 h-8"/>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center gap-4 bg-black/50 p-3 rounded-full">
                 <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30">
                    {isMuted ? <MicrophoneSlashIcon className="w-6 h-6"/> : <MicrophoneIcon className="w-6 h-6"/>}
                </button>
                 <button onClick={() => setIsCameraOff(!isCameraOff)} className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30">
                    {isCameraOff ? <VideoCameraSlashIcon className="w-6 h-6"/> : <VideoCameraIcon className="w-6 h-6"/>}
                </button>
                <button
                    onClick={handleCaptureMoment}
                    disabled={isCapturing || !stream || isCameraOff}
                    className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Capture a memory"
                >
                    {isCapturing ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <CameraSparklesIcon className="w-6 h-6"/>}
                </button>
                <button onClick={handleEndCall} className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transform hover:scale-110 transition-transform">
                    <PhoneXMarkIcon className="w-7 h-7"/>
                </button>
            </div>
        </div>
    );
};