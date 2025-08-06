import React from 'react';
import { ConversationVibe as ConversationVibeType } from '../types';

interface ConversationVibeProps {
  vibe: ConversationVibeType | null;
}

const VibeShape: React.FC<{ color: string; intensity: number; index: number; total: number }> = ({ color, intensity, index, total }) => {
    const size = 100 + intensity * 150;
    const animationDuration = 10 - intensity * 5; // Slower for low intensity
    const animationDelay = (index * (animationDuration / total)) * -1;
    const opacity = 0.4 + intensity * 0.3;

    const styles: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        opacity: opacity,
        animation: `pulse ${animationDuration}s infinite ease-in-out`,
        animationDelay: `${animationDelay}s`,
        transition: 'background-color 1s ease, opacity 1s ease',
    };

    return <div className="absolute top-1/2 left-1/2 rounded-full" style={styles}></div>;
};

export const ConversationVibe: React.FC<ConversationVibeProps> = ({ vibe }) => {
    if (!vibe) {
        return null;
    }

    return (
        <div className="relative h-20 w-full overflow-hidden bg-cream/10 border-b border-slate-200">
             <style>
                {`
                    @keyframes pulse {
                        0%, 100% { transform: translate(-50%, -50%) scale(0.8); }
                        50% { transform: translate(-50%, -50%) scale(1.1); }
                    }
                `}
            </style>
            <div className="absolute inset-0 filter blur-2xl">
                {vibe.colorPalette.map((color, index) => (
                    <VibeShape
                        key={index}
                        color={color}
                        intensity={vibe.intensity}
                        index={index}
                        total={vibe.colorPalette.length}
                    />
                ))}
            </div>
             <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                <p className="font-semibold text-deep-teal/70 text-sm drop-shadow-lg">
                    Conversation Vibe: <span className="font-bold">{vibe.dominantVibe}</span>
                </p>
            </div>
        </div>
    );
};
