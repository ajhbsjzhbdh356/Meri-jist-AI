import { useState, useEffect, useCallback, useRef } from 'react';

export const useCamera = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const getStream = useCallback(async () => {
        if (stream) return; // Don't get a new stream if one exists
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(mediaStream);
            setError(null);
        } catch (err) {
            console.error("Error accessing camera/mic:", err);
            if (err instanceof DOMException) {
                if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                    setError("Camera/Mic permission denied. Please enable access in browser settings.");
                } else {
                    setError(`Error accessing media devices: ${err.message}`);
                }
            } else {
                 setError("An unknown error occurred while accessing media devices.");
            }
        }
    }, [stream]);

    const stopStream = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
        videoRef.current = node;
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);
    
    // Cleanup effect to ensure the stream is stopped when the component using the hook unmounts.
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);
    
    return { stream, error, getStream, stopStream, videoCallbackRef };
};
