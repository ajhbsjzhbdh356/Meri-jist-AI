
import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
    const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecordingInternal = useCallback(async () => {
        if (isRecording) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                setRecordedAudioBlob(audioBlob);
                setRecordedAudioUrl(audioUrl);
                stream.getTracks().forEach(track => track.stop());
                setMediaStream(null);
                setIsRecording(false);
            };
            
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            throw err; // Re-throw to be handled by the component
        }
    }, [isRecording]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            // isRecording will be set to false in the onstop handler
        }
    }, []);
    
    const deleteRecording = useCallback(() => {
        if (recordedAudioUrl) {
            URL.revokeObjectURL(recordedAudioUrl);
        }
        setRecordedAudioUrl(null);
        setRecordedAudioBlob(null);
    }, [recordedAudioUrl]);
    
    // Cleanup effect
    useEffect(() => {
        return () => {
            if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
            mediaStream?.getTracks().forEach(track => track.stop());
        }
    }, [recordedAudioUrl, mediaStream]);
    
    return {
        isRecording,
        mediaStream,
        recordedAudioUrl,
        recordedAudioBlob,
        startRecording: async () => {
            try {
                await startRecordingInternal();
            } catch (err) {
                alert("Could not access microphone. Please check your browser permissions.");
            }
        },
        stopRecording,
        deleteRecording,
    };
};
