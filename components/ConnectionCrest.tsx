
import React from 'react';
import { ConnectionCrest } from '../types';
import { SparklesIcon } from './IconComponents';

interface ConnectionCrestProps {
    crest: ConnectionCrest;
}

export const ConnectionCrestComponent: React.FC<ConnectionCrestProps> = ({ crest }) => {
    if (!crest || !crest.svgPaths) return null;

    return (
        <div className="my-4 p-4 bg-gradient-to-br from-cream to-rose-gold/10 rounded-2xl border-2 border-rose-gold/20 shadow-lg text-center animate-in fade-in duration-500">
            <div className="flex items-center justify-center gap-2 mb-2">
                 <SparklesIcon className="w-6 h-6 text-rose-gold" />
                 <h3 className="text-xl font-bold font-serif text-deep-teal">Connection Crest Unlocked!</h3>
            </div>
            <div className="flex justify-center my-3">
                 <svg width="80" height="80" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {crest.svgPaths.map((path, index) => (
                        <path key={index} d={path.d} fill={path.fill} />
                    ))}
                </svg>
            </div>
            <p className="text-sm text-slate-700 max-w-md mx-auto">{crest.description}</p>
        </div>
    );
};
