import React, { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
  mediaStream: MediaStream | null;
  isRecording: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ mediaStream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    if (!mediaStream || !isRecording) {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Set canvas dimensions for high-DPI displays
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;
      
      const barColor = '#B76E79'; // rose-gold
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255.0) * canvas.height;
        
        canvasCtx.fillStyle = barColor;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        x += barWidth + (canvas.width / bufferLength / 2);
      }
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      source.disconnect();
      audioContext.close().catch(console.error);
    };
  }, [mediaStream, isRecording]);

  return <canvas ref={canvasRef} className="w-full h-16 bg-cream/60 rounded-lg" />;
};

export default VoiceVisualizer;
