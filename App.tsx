import React from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthenticatedApp } from './components/AuthenticatedApp';
import { UnauthenticatedApp } from './components/UnauthenticatedApp';
import { HeartIcon } from './components/IconComponents';

const App: React.FC = () => {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="flex items-center text-gray-800 mb-4">
            <HeartIcon className="w-12 h-12 text-brand-primary mr-3 animate-pulse" />
            <h1 className="text-5xl font-serif font-bold">
              SoulMate <span className="text-brand-primary">AI</span>
            </h1>
        </div>
        <p className="text-gray-500">Loading your profile...</p>
      </div>
    )
  }

  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
};

export default App;