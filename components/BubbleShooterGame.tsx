import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './Button';

// Type Definitions
interface Bubble {
    id: number;
    row: number;
    col: number;
    color: string;
}

interface FlyingBubble {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
}

interface AnimatedBubble extends Bubble {
    animationState: 'popping' | 'dropping';
    startTime: number;
}

interface BubbleShooterGameProps {
    onGameEnd: (score: number) => void;
}

// --- Game Constants ---
const BUBBLE_RADIUS = 18;
const GRID_ROWS = 14;
const GRID_COLS = 16;
const COLORS = ['#F72585', '#4361EE', '#4CC9F0', '#FCA311', '#70E000'];
const ROW_HEIGHT = BUBBLE_RADIUS * Math.sqrt(3);
const GAME_WIDTH = (GRID_COLS + 0.5) * BUBBLE_RADIUS * 2;
const GAME_HEIGHT = (GRID_ROWS + 1) * ROW_HEIGHT;
const SHOOTER_X = GAME_WIDTH / 2;
const SHOOTER_Y = GAME_HEIGHT - BUBBLE_RADIUS * 2;
const DANGER_LINE_Y = GAME_HEIGHT - ROW_HEIGHT * 2.5;
const SHOTS_BEFORE_NEW_ROW = 5;

// --- Helper Components & Functions ---

// Bubble SVG component for a more polished look
const BubbleComponent: React.FC<{
    x: number; y: number; color: string;
    radius?: number; style?: React.CSSProperties;
    isJiggling?: boolean; isShooter?: boolean;
}> = ({ x, y, color, radius = BUBBLE_RADIUS, style, isJiggling, isShooter }) => {
    const classNames = [
        isJiggling ? 'jiggle' : '',
        isShooter ? 'boing-in' : ''
    ].filter(Boolean).join(' ');

    return (
        <g transform={`translate(${x}, ${y})`} style={style} className={classNames} filter="url(#bubbleShadow)">
            <defs>
                <radialGradient id={`grad-${color.replace('#', '')}`}>
                    <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.4)' }} />
                    <stop offset="100%" style={{ stopColor: 'rgba(255,255,255,0)' }} />
                </radialGradient>
            </defs>
            <circle cx="0" cy="0" r={radius} fill={color} stroke="#0002" strokeWidth="1" />
            <circle cx="-5" cy="-5" r={radius * 0.9} fill={`url(#grad-${color.replace('#', '')})`} />
        </g>
    );
};

// Get pixel coordinates for a bubble in the hex grid
const getBubbleXY = (row: number, col: number) => {
    const x = col * BUBBLE_RADIUS * 2 + (row % 2) * BUBBLE_RADIUS + BUBBLE_RADIUS;
    const y = row * ROW_HEIGHT + BUBBLE_RADIUS;
    return { x, y };
};

// --- Pure Helper Functions ---
const getNeighbors = (bubble: {row: number, col: number}, allBubbles: Bubble[]): Bubble[] => {
    const neighbors: Bubble[] = [];
    const parity = bubble.row % 2; // 0 for even, 1 for odd
    const directions = [
        { dr: -1, dc: parity === 0 ? -1 : 0 }, { dr: -1, dc: parity === 0 ? 0 : 1 }, // Top-left, Top-right
        { dr: 0, dc: -1 }, { dr: 0, dc: 1 }, // Left, Right
        { dr: 1, dc: parity === 0 ? -1 : 0 }, { dr: 1, dc: parity === 0 ? 0 : 1 }, // Bottom-left, Bottom-right
    ];

    for (const dir of directions) {
        const neighbor = allBubbles.find(b => b.row === bubble.row + dir.dr && b.col === bubble.col + dir.dc);
        if (neighbor) {
            neighbors.push(neighbor);
        }
    }
    return neighbors;
};

const findNearestCell = (x: number, y: number, bubbles: Bubble[]) => {
    let bestCell = { row: -1, col: -1, dist: Infinity };
    for (let row = 0; row < GRID_ROWS; row++) {
        const cols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
        for (let col = 0; col < cols; col++) {
            const isOccupied = bubbles.some(b => b.row === row && b.col === col);
            if (!isOccupied) {
                const { x: cellX, y: cellY } = getBubbleXY(row, col);
                const dist = Math.sqrt((x - cellX)**2 + (y - cellY)**2);
                
                // A cell is valid only if it's in the top row or adjacent to an existing bubble
                let hasNeighbor = row === 0;
                if (!hasNeighbor) {
                    if (getNeighbors({row, col}, bubbles).length > 0) {
                        hasNeighbor = true;
                    }
                }
                
                if (dist < bestCell.dist && hasNeighbor) {
                    bestCell = { row, col, dist };
                }
            }
        }
    }
    if (bestCell.row !== -1) {
        return { row: bestCell.row, col: bestCell.col };
    }
    return null;
};


// --- Main Game Component ---

export const BubbleShooterGame: React.FC<BubbleShooterGameProps> = ({ onGameEnd }) => {
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [shooterBubble, setShooterBubble] = useState<Bubble | null>(null);
    const [nextBubble, setNextBubble] = useState<Bubble | null>(null);
    const [flyingBubble, setFlyingBubble] = useState<FlyingBubble | null>(null);
    const [animatedBubbles, setAnimatedBubbles] = useState<AnimatedBubble[]>([]);
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver'>('ready');
    const [score, setScore] = useState(0);
    const [aimAngle, setAimAngle] = useState(0);
    const [shotsLeftForRow, setShotsLeftForRow] = useState(SHOTS_BEFORE_NEW_ROW);
    const [jigglingBubbleIds, setJigglingBubbleIds] = useState<Set<number>>(new Set());

    const gameAreaRef = useRef<SVGSVGElement>(null);
    const animationFrameId = useRef<number | undefined>(undefined);

    // --- Game Setup and State Management ---

    const createInitialBubbles = useCallback(() => {
        const initialBubbles: Bubble[] = [];
        for (let row = 0; row < 6; row++) {
            const cols = row % 2 === 0 ? GRID_COLS : GRID_COLS - 1;
            for (let col = 0; col < cols; col++) {
                initialBubbles.push({
                    id: Math.random(),
                    row,
                    col,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                });
            }
        }
        return initialBubbles;
    }, []);

    const createNewShooterBubble = useCallback((): Bubble => {
        const gridColors = [...new Set(bubbles.map(b => b.color))];
        const availableColors = gridColors.length > 0 ? gridColors : COLORS;
        const color = availableColors[Math.floor(Math.random() * availableColors.length)];
        return { id: Math.random(), row: -1, col: -1, color };
    }, [bubbles]);
    
    const startGame = useCallback(() => {
        setScore(0);
        const newBubbles = createInitialBubbles();
        setBubbles(newBubbles);
        // Temporarily create a shooter bubble with all colors available, as state hasn't updated yet.
        const initialShooterColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        setShooterBubble({ id: Math.random(), row: -1, col: -1, color: initialShooterColor });
        setNextBubble({ id: Math.random(), row: -1, col: -1, color: initialShooterColor });
        
        setShotsLeftForRow(SHOTS_BEFORE_NEW_ROW);
        setGameState('playing');
        setFlyingBubble(null);
        setAnimatedBubbles([]);
    }, [createInitialBubbles]);

    useEffect(() => {
        if (gameState === 'gameOver') {
            onGameEnd(score);
        }
    }, [gameState, score, onGameEnd]);
    
    useEffect(() => {
        if (gameState === 'playing' && shooterBubble?.row === -1 && nextBubble?.row === -1) {
             setShooterBubble(createNewShooterBubble());
             setNextBubble(createNewShooterBubble());
        }
    }, [bubbles, gameState, createNewShooterBubble, shooterBubble, nextBubble]);

    // Cleanup animated bubbles
    useEffect(() => {
        if (animatedBubbles.length === 0) return;
        const now = Date.now();
        const activeAnimations = animatedBubbles.filter(ab => now - ab.startTime < 1000); // Increased duration for dropping
        if (activeAnimations.length < animatedBubbles.length) {
            const timer = setTimeout(() => setAnimatedBubbles(activeAnimations), 1000);
            return () => clearTimeout(timer);
        }
    }, [animatedBubbles]);


    // --- Aiming and Shooting Logic ---

    const handleMouseMove = (e: React.MouseEvent) => {
        if (gameState !== 'playing' || !gameAreaRef.current) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const dx = x - SHOOTER_X;
        const dy = y - SHOOTER_Y;
        let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
        
        if (angle < -80) angle = -80;
        if (angle > 80) angle = 80;
        setAimAngle(angle);
    };

    const handleShoot = () => {
        if (gameState !== 'playing' || !shooterBubble || flyingBubble) return;

        const angleRad = (aimAngle - 90) * (Math.PI / 180);
        setFlyingBubble({
            id: shooterBubble.id,
            x: SHOOTER_X,
            y: SHOOTER_Y,
            vx: Math.cos(angleRad) * 12,
            vy: Math.sin(angleRad) * 12,
            color: shooterBubble.color,
        });

        setShooterBubble(nextBubble);
        setNextBubble(createNewShooterBubble());
        setShotsLeftForRow(prev => prev - 1);
    };
    
    const checkGameState = useCallback((currentBubbles: Bubble[]) => {
        if (currentBubbles.length === 0) {
            setScore(s => s + 500); // Clear screen bonus
            setTimeout(() => setBubbles(createInitialBubbles()), 500);
            return;
        }

        for (const bubble of currentBubbles) {
            const { y } = getBubbleXY(bubble.row, bubble.col);
            if (y + BUBBLE_RADIUS > DANGER_LINE_Y) {
                setGameState('gameOver');
                return;
            }
        }
    }, [createInitialBubbles]);

    const checkAndDropFloating = useCallback((currentBubbles: Bubble[]) => {
        const connectedToCeiling = new Set<number>();
        const toCheck = currentBubbles.filter(b => b.row === 0);
        toCheck.forEach(b => connectedToCeiling.add(b.id));

        let i = 0;
        while(i < toCheck.length) {
            const current = toCheck[i++];
            getNeighbors(current, currentBubbles).forEach(neighbor => {
                if(!connectedToCeiling.has(neighbor.id)) {
                    connectedToCeiling.add(neighbor.id);
                    toCheck.push(neighbor);
                }
            });
        }
        
        const floatingBubbles = currentBubbles.filter(b => !connectedToCeiling.has(b.id));
        if (floatingBubbles.length > 0) {
            const remainingBubbles = currentBubbles.filter(b => connectedToCeiling.has(b.id));
            setAnimatedBubbles(prev => [...prev, ...floatingBubbles.map((b): AnimatedBubble => ({...b, animationState: 'dropping', startTime: Date.now()}))]);
            setScore(s => s + floatingBubbles.length * 20 + Math.pow(floatingBubbles.length, 2));
            setBubbles(remainingBubbles);
            checkGameState(remainingBubbles);
        } else {
            setBubbles(currentBubbles);
            checkGameState(currentBubbles);
        }
    }, [checkGameState]);

    const snapBubble = useCallback((x: number, y: number, color: string) => {
        const bestCell = findNearestCell(x, y, bubbles);

        if (!bestCell) { 
            setGameState('gameOver');
            return;
        }

        const newBubble: Bubble = { id: Math.random(), row: bestCell.row, col: bestCell.col, color };
        let newBubbles = [...bubbles, newBubble];

        // Jiggle neighbors on land
        const neighbors = getNeighbors(newBubble, newBubbles);
        const neighborIds = new Set(neighbors.map(n => n.id));
        setJigglingBubbleIds(neighborIds);
        setTimeout(() => setJigglingBubbleIds(new Set()), 300);

        const toCheck = [newBubble];
        const matched = new Set([newBubble]);
        const visited = new Set([newBubble.id]);

        while(toCheck.length > 0) {
            const current = toCheck.pop()!;
            getNeighbors(current, newBubbles).forEach(neighbor => {
                if(neighbor.color === color && !visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    matched.add(neighbor);
                    toCheck.push(neighbor);
                }
            });
        }
        
        if (matched.size >= 3) {
            const matchedIds = new Set([...matched].map(b => b.id));
            const remainingBubbles = newBubbles.filter(b => !matchedIds.has(b.id));
            const poppedBubbles = newBubbles.filter(b => matchedIds.has(b.id));

            setAnimatedBubbles(prev => [...prev, ...poppedBubbles.map((b): AnimatedBubble => ({...b, animationState: 'popping', startTime: Date.now()}))]);
            setScore(s => s + poppedBubbles.length * 10);
            checkAndDropFloating(remainingBubbles);
        } else {
            setBubbles(newBubbles);
            checkGameState(newBubbles);
        }
    }, [bubbles, checkAndDropFloating, checkGameState]);
    
    // --- Game Loop and Collision ---
    
    const gameLoop = useCallback(() => {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        if (!flyingBubble) return;

        let { x, y, vx, vy, ...rest } = flyingBubble;
        x += vx;
        y += vy;

        if (x < BUBBLE_RADIUS || x > GAME_WIDTH - BUBBLE_RADIUS) {
            vx = -vx;
            x += vx;
        }

        if (y < BUBBLE_RADIUS) {
            setFlyingBubble(null);
            snapBubble(x, BUBBLE_RADIUS, rest.color);
            return;
        }

        for (const bubble of bubbles) {
            const { x: bx, y: by } = getBubbleXY(bubble.row, bubble.col);
            const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
            if (dist < BUBBLE_RADIUS * 2) {
                setFlyingBubble(null);
                snapBubble(flyingBubble.x, flyingBubble.y, rest.color);
                return;
            }
        }

        setFlyingBubble({ x, y, vx, vy, ...rest });
    }, [flyingBubble, bubbles, snapBubble]);

    useEffect(() => {
        if (flyingBubble) {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [flyingBubble, gameLoop]);
    
    // --- Game Progression ---
    
    const addNewRow = useCallback(() => {
        setBubbles(currentBubbles => {
            const shiftedBubbles = currentBubbles.map(b => ({...b, row: b.row + 1}));
            const newRow: Bubble[] = [];
            const cols = GRID_COLS;
            const gridColors = [...new Set(currentBubbles.map(b => b.color))];
            const availableColors = gridColors.length > 0 ? gridColors : COLORS;
            for (let col = 0; col < cols; col++) {
                newRow.push({
                    id: Math.random(),
                    row: 0,
                    col,
                    color: availableColors[Math.floor(Math.random() * availableColors.length)],
                });
            }
            const newBubbleState = [...shiftedBubbles, ...newRow];
            checkGameState(newBubbleState); // Check the new state immediately
            return newBubbleState;
        });
    }, [checkGameState]);

    useEffect(() => {
        if (gameState === 'playing' && shotsLeftForRow <= 0) {
            addNewRow();
            setShotsLeftForRow(SHOTS_BEFORE_NEW_ROW);
        }
    }, [shotsLeftForRow, gameState, addNewRow]);
    
    // --- Render Logic ---

    const renderAimingLine = () => {
        if (gameState !== 'playing' || flyingBubble || !shooterBubble) return null;

        const pathPoints = [];
        let currentX = SHOOTER_X;
        let currentY = SHOOTER_Y - BUBBLE_RADIUS;
        pathPoints.push(`M ${currentX},${currentY}`);

        let angleRad = (aimAngle - 90) * (Math.PI / 180);
        let dx = Math.cos(angleRad);
        let dy = Math.sin(angleRad);

        const MAX_BOUNCES = 1;
        for (let bounce = 0; bounce <= MAX_BOUNCES; bounce++) {
            let min_t = Infinity;
            let endPoint = { x: 0, y: 0 };
            let hitType: 'bubble' | 'wall' | 'top' | 'none' = 'none';

            // 1. Find closest bubble intersection 't'
            let t_bubble = Infinity;
            for (const bubble of bubbles) {
                const { x: bx, y: by } = getBubbleXY(bubble.row, bubble.col);
                const ocX = currentX - bx;
                const ocY = currentY - by;
                
                const a = dx * dx + dy * dy;
                const b = 2 * (dx * ocX + dy * ocY);
                const c = (ocX * ocX + ocY * ocY) - (BUBBLE_RADIUS * 2) ** 2;
                
                const discriminant = b * b - 4 * a * c;
                if (discriminant >= 0) {
                    const t = (-b - Math.sqrt(discriminant)) / (2 * a);
                    if (t > 0.1) {
                        t_bubble = Math.min(t_bubble, t);
                    }
                }
            }
            
            if (t_bubble < Infinity) {
                min_t = t_bubble;
                endPoint = { x: currentX + t_bubble * dx, y: currentY + t_bubble * dy };
                hitType = 'bubble';
            }

            // 2. Find wall intersection 't'
            if (Math.abs(dx) > 0.01) {
                const wallX = dx > 0 ? GAME_WIDTH - BUBBLE_RADIUS : BUBBLE_RADIUS;
                const t_wall = (wallX - currentX) / dx;
                if (t_wall > 0 && t_wall < min_t) {
                    min_t = t_wall;
                    endPoint = { x: wallX, y: currentY + t_wall * dy };
                    hitType = 'wall';
                }
            }
            
            // 3. Find top intersection 't'
            const t_top = (BUBBLE_RADIUS - currentY) / dy; // hit ceiling
            if (t_top > 0 && t_top < min_t) {
                min_t = t_top;
                endPoint = { x: currentX + t_top * dx, y: BUBBLE_RADIUS };
                hitType = 'top';
            }

            // 4. Draw segment and decide next action
            if (hitType !== 'none') {
                 pathPoints.push(`L ${endPoint.x},${endPoint.y}`);
            }

            if (hitType === 'bubble' || hitType === 'top') {
                break; // Stop drawing
            }
            
            if (hitType === 'wall') {
                if (bounce < MAX_BOUNCES) {
                    currentX = endPoint.x;
                    currentY = endPoint.y;
                    dx = -dx; // Bounce
                } else {
                     break; // Stop after max bounces
                }
            } else {
                // Fallback to prevent an infinite line if no collision is detected
                const finalX = currentX + dx * GAME_HEIGHT * 2;
                const finalY = currentY + dy * GAME_HEIGHT * 2;
                pathPoints.push(`L ${finalX},${finalY}`);
                break;
            }
        }

        const pathD = pathPoints.join(' ');

        return (
            <path
                d={pathD}
                stroke={shooterBubble.color}
                strokeWidth="4"
                fill="none"
                opacity={0.7}
                strokeDasharray="8, 8"
            />
        );
    };


    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-transparent rounded-xl p-2 md:p-4">
            <div className="flex justify-between items-center w-full max-w-lg mb-2 text-gray-700 font-bold px-2">
                <span>Score: {score}</span>
                <span>Shots left: {shotsLeftForRow}</span>
            </div>
            <div className="relative" style={{ width: GAME_WIDTH, height: GAME_HEIGHT, maxWidth: '100%' }}>
                <svg
                    ref={gameAreaRef}
                    viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`}
                    className="w-full h-full bg-brand-secondary/10 rounded-lg"
                    onMouseMove={handleMouseMove}
                    onClick={handleShoot}
                    style={{ cursor: gameState === 'playing' ? 'crosshair' : 'default' }}
                >
                    <defs>
                        <filter id="bubbleShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
                        </filter>
                    </defs>
                    <style>
                        {`
                            @keyframes boing {
                                0% { transform: scale(0.9); }
                                70% { transform: scale(1.02); }
                                100% { transform: scale(1.0); }
                            }
                            .boing-in {
                                animation: boing 0.2s ease-out;
                            }

                            @keyframes jiggle {
                                0%, 100% { transform: translate(0, 0) rotate(0); }
                                25% { transform: translate(2px, -1px) rotate(2deg); }
                                75% { transform: translate(-2px, -1px) rotate(-2deg); }
                            }
                            .jiggle {
                                animation: jiggle 0.3s ease-in-out;
                            }
                        `}
                    </style>
                    <line x1="0" y1={DANGER_LINE_Y} x2={GAME_WIDTH} y2={DANGER_LINE_Y} stroke="rgba(255, 107, 107, 0.5)" strokeWidth="2" strokeDasharray="10, 10" />
                    {renderAimingLine()}
                    {bubbles.map(b => <BubbleComponent key={b.id} x={getBubbleXY(b.row, b.col).x} y={getBubbleXY(b.row, b.col).y} color={b.color} isJiggling={jigglingBubbleIds.has(b.id)} />)}
                    {animatedBubbles.map(b => {
                        const elapsedMs = Date.now() - b.startTime;
                        if (b.animationState === 'popping') {
                            const { x, y } = getBubbleXY(b.row, b.col);
                            const duration = 300; // ms
                            const progress = Math.min(elapsedMs / duration, 1);
                            const scale = 1 - progress;
                            const opacity = 1 - progress;
                            const style: React.CSSProperties = {
                                opacity: opacity,
                            };
                            const radius = BUBBLE_RADIUS * scale;
                            return <BubbleComponent key={b.id} x={x} y={y} color={b.color} style={style} radius={radius} />;
                        }
                        
                        // Drop animation
                        const elapsed = elapsedMs / 1000;
                        const style: React.CSSProperties = { transition: 'none' };
                        const yOffset = elapsed * 500 + 150 * elapsed * elapsed; // Gravity
                        style.transform = `translateY(${yOffset}px)`;
                        style.opacity = Math.max(0, 1 - elapsed);

                        return <BubbleComponent key={b.id} x={getBubbleXY(b.row, b.col).x} y={getBubbleXY(b.row, b.col).y} color={b.color} style={style} />;
                    })}

                    {flyingBubble && <BubbleComponent x={flyingBubble.x} y={flyingBubble.y} color={flyingBubble.color} />}
                    <g transform={`translate(${SHOOTER_X}, ${SHOOTER_Y})`}>
                        {shooterBubble && <BubbleComponent key={shooterBubble.id} x={0} y={0} color={shooterBubble.color} isShooter />}
                        {nextBubble && <BubbleComponent key={nextBubble.id} x={-BUBBLE_RADIUS * 3} y={0} color={nextBubble.color} radius={BUBBLE_RADIUS * 0.7} isShooter/>}
                    </g>
                </svg>
                {gameState !== 'playing' && (
                    <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center text-gray-800 text-center p-4 z-10">
                        {gameState === 'ready' && (
                            <>
                                <h3 className="text-3xl font-bold font-serif mb-4">Bubble Pop!</h3>
                                <p className="mb-6 max-w-xs">Clear bubbles by matching 3 or more. Don't let them cross the red line!</p>
                                <Button onClick={startGame}>Start Game</Button>
                            </>
                        )}
                        {gameState === 'gameOver' && (
                            <>
                                <h3 className="text-3xl font-bold font-serif mb-4">Game Over</h3>
                                <p className="text-xl mb-6">You scored {score} points!</p>
                                <Button onClick={startGame}>Play Again</Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};