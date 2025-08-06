
import React, { useState } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, LinkIcon, SearchIcon, ShieldCheckIcon } from './IconComponents';
import { getDatingSafetyTips } from '../services/geminiService';
import { WebSource } from '../types';

interface DatingSafetyModalProps {
  onClose: () => void;
}

export const DatingSafetyModal: React.FC<DatingSafetyModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ text: string; sources: WebSource[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || isLoading) return;
    setSearchedQuery(searchQuery);
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await getDatingSafetyTips(searchQuery);
      setResult(response);
    } catch (e: any) {
      setError(e.message || "Sorry, I couldn't fetch safety tips right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };
  
  const handleGeneralTips = () => {
      const generalQuery = "General tips for meeting someone from a dating app for the first time";
      setQuery(generalQuery);
      handleSearch(generalQuery);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6 text-rose-gold" />
            AI Dating Safety Assistant
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
            <p className="text-slate-600">Your safety is our priority. Ask for specific advice or get general tips for meeting someone new. Our AI will use Google Search to provide up-to-date information.</p>
            <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Good public places for a first date in Delhi"
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition"
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !query.trim()} leftIcon={<SearchIcon />}>
                    Search
                </Button>
            </form>
            <div className="text-center">
                 <Button variant="secondary" onClick={handleGeneralTips} disabled={isLoading}>Get General First-Date Tips</Button>
            </div>
            
            <div className="mt-4">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[250px]">
                        <SparklesIcon className="w-16 h-16 text-rose-gold animate-pulse" />
                        <p className="mt-4 text-xl font-semibold text-deep-teal">Searching for the latest safety advice...</p>
                    </div>
                )}
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                        <p className="font-bold">An Error Occurred</p>
                        <p>{error}</p>
                    </div>
                )}
                {result && (
                    <div className="p-6 bg-cream/60 rounded-lg border border-dusty-rose/30 space-y-4">
                        <h3 className="text-xl font-bold font-serif text-deep-teal">Safety Tips for: "{searchedQuery}"</h3>
                        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{result.text}</p>
                        {result.sources.length > 0 && (
                            <div className="pt-4 border-t border-dusty-rose">
                                <h4 className="font-semibold text-deep-teal mb-2">Sources from Google Search:</h4>
                                <ul className="space-y-2">
                                    {result.sources.map((source, index) => (
                                        <li key={index}>
                                            <a 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="inline-flex items-center gap-2 text-sm text-rose-gold hover:underline"
                                            >
                                                <LinkIcon className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{source.title}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
        
        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end">
          <Button variant="primary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};
