import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';

interface SwipeableProfileCardProps {
  profile: UserProfile;
  onSwipe: (direction: 'left' | 'right') => void;
  onViewProfile: (id: number) => void;
  active: boolean;
}

const SWIPE_THRESHOLD = 120; // pixels to trigger a swipe
const MAX_ROTATION = 20; // degrees of rotation at the edge of the screen

export const SwipeableProfileCard: React.FC<SwipeableProfileCardProps> = ({ profile, onSwipe, onViewProfile, active }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [cardStyle, setCardStyle] = useState({});
    
    // Using a ref to track pointer down info to avoid re-renders on move
    const pointerDownInfo = useRef({ x: 0, y: 0, time: 0 });

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!active) return;
        setIsDragging(true);
        cardRef.current?.setPointerCapture(e.pointerId);
        pointerDownInfo.current = { x: e.clientX, y: e.clientY, time: Date.now() };
        setStartPos({ x: e.clientX, y: e.clientY }); // Keep this for rotation calculation
        setCardStyle({ transition: 'none' }); // Remove transition during drag for direct manipulation
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !active) return;
        const x = e.clientX - startPos.x;
        const y = e.clientY - startPos.y;
        setCurrentPos({ x, y });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!active || !isDragging) return;

        const upTime = Date.now();
        const dx = e.clientX - pointerDownInfo.current.x;
        const dy = e.clientY - pointerDownInfo.current.y;
        const duration = upTime - pointerDownInfo.current.time;

        setIsDragging(false);
        cardRef.current?.releasePointerCapture(e.pointerId);

        if (Math.abs(currentPos.x) > SWIPE_THRESHOLD) {
            const direction = currentPos.x > 0 ? 'right' : 'left';
            const flyOutX = (direction === 'right' ? 1 : -1) * (window.innerWidth / 2 + 200);
            const rotation = (currentPos.x / (window.innerWidth / 2)) * MAX_ROTATION;
            setCardStyle({
                transform: `translate(${flyOutX}px, ${currentPos.y * 1.5}px) rotate(${rotation * 2}deg)`,
                transition: 'transform 0.5s ease-out',
            });
            setTimeout(() => onSwipe(direction), 300);
        } else {
             // Check for a click gesture: minimal movement and short duration.
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && duration < 500) {
                 // Prevent this from firing if the button itself was clicked, letting the button's own onClick handle it.
                if (!(e.target as HTMLElement).closest('button')) {
                    onViewProfile(profile.id);
                }
            }
            // Animate back to center regardless of click
            setCurrentPos({ x: 0, y: 0 });
            setCardStyle({
                transform: 'translate(0px, 0px) rotate(0deg)',
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            });
        }
    };
    
    // Reset state if profile changes (e.g., on rewind)
    useEffect(() => {
        setCurrentPos({ x: 0, y: 0 });
        setCardStyle({
            transform: 'translate(0px, 0px) rotate(0deg)',
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        });
    }, [profile.id]);

    useEffect(() => {
        if (isDragging) {
            const rotation = (currentPos.x / (window.innerWidth / 2)) * MAX_ROTATION;
            setCardStyle({
                transform: `translate(${currentPos.x}px, ${currentPos.y}px) rotate(${rotation}deg)`,
                transition: 'none'
            });
        }
    }, [currentPos, isDragging]);
    
    const nopeOpacity = currentPos.x < 0 ? Math.min(Math.abs(currentPos.x) / SWIPE_THRESHOLD, 1) : 0;
    const likeOpacity = currentPos.x > 0 ? Math.min(currentPos.x / SWIPE_THRESHOLD, 1) : 0;
    
    const cardContent = (
        <div className="relative w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden">
            <img className="w-full h-full object-cover" src={profile.profilePicture} alt={profile.name} draggable="false" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 to-transparent"></div>
            
            <div 
                className="absolute top-8 left-8 text-brand-secondary border-4 border-brand-secondary rounded-lg px-6 py-2 text-4xl font-bold tracking-widest -rotate-20 transform transition-opacity"
                style={{ opacity: likeOpacity }}
            >
                LIKE
            </div>
             <div 
                className="absolute top-8 right-8 text-brand-primary border-4 border-brand-primary rounded-lg px-6 py-2 text-4xl font-bold tracking-widest rotate-20 transform transition-opacity"
                style={{ opacity: nopeOpacity }}
            >
                NOPE
            </div>

            <div className="absolute bottom-0 left-0 p-5 text-white w-full">
                <h3 className="text-3xl font-bold font-serif">{profile.name}, {profile.age}</h3>
                <p className="text-white/90 text-md mt-1">{profile.profession}</p>
                 {profile.interestTags && profile.interestTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {profile.interestTags.slice(0, 4).map(tag => (
                            <span key={tag} className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-white/80 text-sm mt-2 h-10 overflow-hidden">{profile.bio}</p>
                <button 
                    onClick={(e) => { if (!isDragging) { e.stopPropagation(); onViewProfile(profile.id); }}}
                    className="mt-3 w-full text-center py-2 bg-white/20 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/40 transition-colors"
                >
                    View Full Profile
                </button>
            </div>
        </div>
    );

    return (
        <div
            ref={cardRef}
            className={`w-full h-full ${active ? 'touch-none select-none cursor-grab active:cursor-grabbing' : 'select-none'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={cardStyle}
        >
          {cardContent}
        </div>
    );
};