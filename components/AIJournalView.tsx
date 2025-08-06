import React, { useState } from 'react';
import { JournalEntry, JournalAnalysisReport, Conversation, UserProfile } from '../types';
import { Button } from './Button';
import { BookOpenIcon, PlusIcon, SparklesIcon, TrashIcon, CloseIcon, LightBulbIcon, ChartBarIcon, DocumentTextIcon, LinkIcon } from './IconComponents';
import { analyzeJournalEntries } from '../services/geminiService';

interface AIJournalViewProps {
    entries: JournalEntry[];
    onAddEntry: (content: string) => void;
    onDeleteEntry: (id: string) => void;
    conversations: Conversation[];
    likedProfiles: UserProfile[];
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const EntryModal: React.FC<{
    onClose: () => void;
    onSave: (content: string) => void;
}> = ({ onClose, onSave }) => {
    const [content, setContent] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">New Journal Entry</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write about your thoughts, feelings, or recent dates..."
                        className="w-full h-64 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                        autoFocus
                    />
                </div>
                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => { onSave(content); onClose(); }} disabled={!content.trim()}>Save Entry</Button>
                </div>
            </div>
        </div>
    );
};

const AnalysisModal: React.FC<{
    onClose: () => void;
    entries: JournalEntry[];
    conversations: Conversation[];
    likedProfiles: UserProfile[];
}> = ({ onClose, entries, conversations, likedProfiles }) => {
    const [report, setReport] = useState<JournalAnalysisReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        const getAnalysis = async () => {
            setIsLoading(true);
            try {
                const result = await analyzeJournalEntries(entries, conversations, likedProfiles);
                setReport(result);
            } catch (err) {
                setError("Sorry, the AI couldn't analyze your journal right now. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        getAnalysis();
    }, [entries, conversations, likedProfiles]);

    const ResultCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
        <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
          <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 text-rose-gold">{icon}</div>
              <h4 className="font-semibold text-deep-teal">{title}</h4>
          </div>
          <div className="pl-9 text-slate-700">{children}</div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal">Your AI Journal Insights</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800"><CloseIcon /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
                            <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                            <p className="mt-4 text-xl font-semibold text-deep-teal">AI is reflecting on your journey...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">{error}</div>
                    ) : report && (
                        <div className="space-y-5">
                            <ResultCard icon={<DocumentTextIcon className="w-6 h-6" />} title="Key Themes">
                                <ul className="list-disc list-inside">
                                    {report.keyThemes.map((theme, i) => <li key={i}>{theme}</li>)}
                                </ul>
                            </ResultCard>
                             <ResultCard icon={<ChartBarIcon className="w-6 h-6" />} title="Emotional Trend">
                                <p>{report.emotionalTrend}</p>
                            </ResultCard>
                             <ResultCard icon={<LightBulbIcon className="w-6 h-6" />} title="Actionable Insight">
                                <p className="font-semibold">{report.actionableInsight}</p>
                            </ResultCard>
                            {report.datingConnectionInsight && (
                                <ResultCard icon={<LinkIcon className="w-6 h-6" />} title="Connecting to Your Dating Life">
                                    <p className="font-semibold">{report.datingConnectionInsight}</p>
                                </ResultCard>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
                    <Button variant="primary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

const JournalEntryCard: React.FC<{ entry: JournalEntry; onDelete: () => void; }> = ({ entry, onDelete }) => (
    <div className="bg-white/80 p-6 rounded-lg shadow-md border border-slate-200 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="flex justify-between items-center mb-3">
            <p className="font-semibold text-deep-teal">{formatDate(entry.date)}</p>
            <button onClick={onDelete} className="text-slate-400 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5"/></button>
        </div>
        <p className="text-slate-700 whitespace-pre-wrap">{entry.content}</p>
    </div>
);


export const AIJournalView: React.FC<AIJournalViewProps> = ({ entries, onAddEntry, onDeleteEntry, conversations, likedProfiles }) => {
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);

    const canAnalyze = entries.length >= 3;

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            {isEntryModalOpen && <EntryModal onClose={() => setIsEntryModalOpen(false)} onSave={onAddEntry} />}
            {isAnalysisModalOpen && <AnalysisModal onClose={() => setIsAnalysisModalOpen(false)} entries={entries} conversations={conversations} likedProfiles={likedProfiles} />}
            
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold font-serif text-deep-teal flex items-center justify-center gap-3">
                    <BookOpenIcon className="w-9 h-9"/>
                    My Dating Journal
                </h2>
                <p className="text-slate-500 mt-2 max-w-2xl mx-auto">A private space to reflect on your journey. Your entries are only visible to you.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
                <Button onClick={() => setIsEntryModalOpen(true)} leftIcon={<PlusIcon />}>Add New Entry</Button>
                <Button
                    variant="secondary"
                    onClick={() => setIsAnalysisModalOpen(true)}
                    disabled={!canAnalyze}
                    leftIcon={<SparklesIcon />}
                    title={!canAnalyze ? 'Write at least 3 entries to unlock AI insights' : ''}
                >
                    Get AI Insights
                </Button>
            </div>

            {entries.length > 0 ? (
                <div className="max-w-3xl mx-auto space-y-6">
                    {entries.map(entry => (
                        <JournalEntryCard key={entry.id} entry={entry} onDelete={() => onDeleteEntry(entry.id)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-6 bg-white/50 rounded-2xl">
                    <BookOpenIcon className="w-16 h-16 mx-auto text-slate-300"/>
                    <h3 className="mt-4 text-2xl font-bold font-serif text-deep-teal">Your Journal is Empty</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">Click "Add New Entry" to start recording your thoughts and feelings.</p>
                </div>
            )}
        </div>
    );
};