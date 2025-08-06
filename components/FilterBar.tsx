

import React, { useState } from 'react';
import { Button } from './Button';
import { SearchIcon, SparklesIcon, XCircleIcon } from './IconComponents';
import { AIFilterCriteria } from '../types';

interface AISearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  activeFilters: AIFilterCriteria | null;
  isSearching: boolean;
}

const FilterPill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="bg-brand-primary/20 text-brand-primary font-semibold text-sm px-3 py-1.5 rounded-full flex items-center">
        {children}
    </div>
);


export const AISearchBar: React.FC<AISearchBarProps> = ({
  onSearch,
  onClear,
  activeFilters,
  isSearching
}) => {
  const [query, setQuery] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
        onSearch(query.trim());
    }
  };
  
  const hasActiveFilters = activeFilters && Object.keys(activeFilters).length > 0;

  return (
    <div
      className="bg-white/70 backdrop-blur-md rounded-2xl shadow-md p-4 mb-8 sticky top-24 z-30"
      aria-label="AI-powered profile search"
    >
        <form
            onSubmit={handleFormSubmit}
        >
            <label htmlFor="ai-search-filter" className="block text-lg font-semibold text-gray-700 mb-2 text-center">Describe who you're looking for</label>
            <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4" aria-hidden="true">
                        <SparklesIcon className="w-5 h-5 text-brand-primary"/>
                    </span>
                    <input
                        type="text"
                        id="ai-search-filter"
                        placeholder="e.g., a kind doctor in Mumbai who loves to travel"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full p-3 pl-12 bg-gray-50 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-base text-gray-700"
                        disabled={isSearching}
                    />
                </div>
                <Button type="submit" disabled={isSearching || !query.trim()} className="!rounded-full !p-3.5">
                    {isSearching ? <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <SearchIcon className="w-6 h-6"/>}
                </Button>
            </div>
        </form>
        {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-500">AI Filters:</span>
                    {activeFilters.keywords?.map(k => <FilterPill key={`k-${k}`}>Keyword: {k}</FilterPill>)}
                    {activeFilters.professions?.map(p => <FilterPill key={`p-${p}`}>Profession: {p}</FilterPill>)}
                    {activeFilters.cities?.map(c => <FilterPill key={`c-${c}`}>City: {c}</FilterPill>)}
                    {activeFilters.religion && <FilterPill>Religion: {activeFilters.religion}</FilterPill>}
                    {(activeFilters.minAge || activeFilters.maxAge) && (
                        <FilterPill>
                            Age: {activeFilters.minAge || '?'} - {activeFilters.maxAge || '?'}
                        </FilterPill>
                    )}
                     <button onClick={onClear} className="ml-auto text-sm font-semibold text-gray-500 hover:text-brand-primary flex items-center gap-1">
                        <XCircleIcon className="w-5 h-5"/>
                        Clear Filters
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};