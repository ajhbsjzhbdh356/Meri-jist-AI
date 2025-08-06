
import React, { useState, useEffect } from 'react';
import { UserProfile, CompatibilityReport, TrustAndSafetyReport } from '../types';
import { generateCompatibilityReport, generateTrustAndSafetyReport } from '../services/geminiService';
import { Button } from './Button';
import { SparklesIcon, ShieldCheckIcon, CircularProgress, ExclamationTriangleIcon } from './IconComponents';

interface AIInsightsProps {
    currentUser: UserProfile;
    profile: UserProfile;
}

type CompatibilityState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; report: CompatibilityReport }
    | { status: 'error'; error: string };

type TrustReportState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; report: TrustAndSafetyReport }
    | { status: 'error'; error: string };

const TabButton: React.FC<{ isActive: boolean; onClick: () => void; children: React.ReactNode }> = ({ isActive, onClick, children }) => {
    const baseClasses = "flex-1 text-center py-2.5 font-semibold transition-colors duration-200 border-b-2";
    const activeClasses = "border-rose-gold text-rose-gold";
    const inactiveClasses = "border-transparent text-slate-500 hover:text-deep-teal hover:border-slate-300";

    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {children}
        </button>
    );
};

export const AIInsights: React.FC<AIInsightsProps> = ({ currentUser, profile }) => {
    const [compatibilityState, setCompatibilityState] = useState<CompatibilityState>({ status: 'idle' });
    const [trustReportState, setTrustReportState] = useState<TrustReportState>({ status: 'idle' });
    const [activeInsightTab, setActiveInsightTab] = useState<'compatibility' | 'trust'>('compatibility');

    useEffect(() => {
        setCompatibilityState({ status: 'idle' });
        setTrustReportState({ status: 'idle' });
        setActiveInsightTab('compatibility');
    }, [profile.id]);

    const handleCheckCompatibility = async () => {
        setCompatibilityState({ status: 'loading' });
        try {
            const report = await generateCompatibilityReport(currentUser, profile);
            setCompatibilityState({ status: 'success', report });
        } catch (error) {
            console.error("Failed to generate compatibility report", error);
            setCompatibilityState({
                status: 'error',
                error: "Sorry, the AI couldn't check compatibility right now. Please try again in a moment."
            });
        }
    };

    const handleCheckTrustScore = async () => {
        setTrustReportState({ status: 'loading' });
        try {
            const report = await generateTrustAndSafetyReport(profile);
            setTrustReportState({ status: 'success', report });
        } catch (error) {
            console.error("Failed to generate trust score report", error);
            setTrustReportState({
                status: 'error',
                error: "Sorry, the AI couldn't analyze the profile right now. Please try again in a moment."
            });
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md">
            <div className="flex">
                <TabButton
                    isActive={activeInsightTab === 'compatibility'}
                    onClick={() => setActiveInsightTab('compatibility')}
                >
                    AI Compatibility
                </TabButton>
                <TabButton
                    isActive={activeInsightTab === 'trust'}
                    onClick={() => setActiveInsightTab('trust')}
                >
                    Trust Score
                </TabButton>
            </div>
            <div className="p-6">
                {activeInsightTab === 'compatibility' && (() => {
                    switch (compatibilityState.status) {
                        case 'loading':
                            return (
                                <div className="flex flex-col items-center justify-center text-center p-4 min-h-[220px]">
                                    <SparklesIcon className="w-12 h-12 text-rose-gold animate-pulse" />
                                    <p className="mt-3 text-lg font-semibold text-deep-teal">Analyzing compatibility...</p>
                                </div>
                            );
                        case 'success':
                            const { report } = compatibilityState;
                            return (
                                <div className="flex flex-col items-center text-center min-h-[220px] justify-center">
                                    <CircularProgress className="w-32 h-32" progress={report.score} viewBoxSize={120} strokeWidth={10}>
                                        <div>
                                            <span className="text-3xl font-bold text-deep-teal">{report.score}</span>
                                            <span className="text-lg font-semibold text-deep-teal/80">%</span>
                                        </div>
                                    </CircularProgress>
                                    <p className="mt-4 text-slate-700">{report.reasoning}</p>
                                </div>
                            );
                        case 'error':
                            return (
                                <div className="text-center min-h-[220px] flex flex-col items-center justify-center p-4">
                                    <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg max-w-sm">
                                        <div className="flex items-start gap-3">
                                            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-bold">Analysis Failed</h4>
                                                <p className="text-sm mt-1 text-left">{compatibilityState.error}</p>
                                                <Button
                                                    variant="secondary"
                                                    onClick={handleCheckCompatibility}
                                                    className="!text-red-700 !border-red-500 hover:!bg-red-100 mt-3"
                                                >
                                                    Try Again
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        case 'idle':
                        default:
                            return (
                                <div className="text-center min-h-[220px] flex flex-col items-center justify-center">
                                    <p className="mb-4 text-slate-600">See how well you match with {profile.name}!</p>
                                    <Button onClick={handleCheckCompatibility} leftIcon={<SparklesIcon className="w-5 h-5" />}>
                                        Check with AI
                                    </Button>
                                </div>
                            );
                    }
                })()}
                {activeInsightTab === 'trust' && (() => {
                    switch (trustReportState.status) {
                        case 'loading':
                            return (
                                <div className="flex flex-col items-center justify-center text-center p-4 min-h-[220px]">
                                    <ShieldCheckIcon className="w-12 h-12 text-rose-gold animate-pulse" />
                                    <p className="mt-3 text-lg font-semibold text-deep-teal">Analyzing profile trust...</p>
                                </div>
                            );
                        case 'success':
                            const { report } = trustReportState;
                            return (
                                <div className="flex flex-col items-center text-center min-h-[220px] justify-center">
                                    <CircularProgress className="w-32 h-32" progress={report.score} viewBoxSize={120} strokeWidth={10}>
                                        <div>
                                            <span className="text-3xl font-bold text-deep-teal">{report.score}</span>
                                            <span className="text-lg font-semibold text-deep-teal/80">%</span>
                                        </div>
                                    </CircularProgress>
                                    <p className="mt-4 text-slate-700">{report.reason}</p>
                                </div>
                            );
                        case 'error':
                            return (
                                <div className="text-center min-h-[220px] flex flex-col items-center justify-center p-4">
                                    <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg max-w-sm">
                                        <div className="flex items-start gap-3">
                                            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-bold">Analysis Failed</h4>
                                                <p className="text-sm mt-1 text-left">{trustReportState.error}</p>
                                                <Button
                                                    variant="secondary"
                                                    onClick={handleCheckTrustScore}
                                                    className="!text-red-700 !border-red-500 hover:!bg-red-100 mt-3"
                                                >
                                                    Try Again
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        case 'idle':
                        default:
                            return (
                                <div className="text-center min-h-[220px] flex flex-col items-center justify-center">
                                    <p className="mb-4 text-slate-600">Get an AI-powered score based on profile completeness.</p>
                                    <Button onClick={handleCheckTrustScore} leftIcon={<ShieldCheckIcon className="w-5 h-5" />}>
                                        Check Trust Score
                                    </Button>
                                </div>
                            );
                    }
                })()}
            </div>
        </div>
    );
};
