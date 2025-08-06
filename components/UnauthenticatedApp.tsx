import React, { useState } from 'react';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';
import { HeartIcon } from './IconComponents';

export const UnauthenticatedApp: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8">
                <div className="flex items-center justify-center text-gray-800">
                    <HeartIcon className="w-10 h-10 text-brand-primary mr-3" />
                    <h1 className="text-5xl font-serif font-bold">
                    SoulMate <span className="text-brand-primary">AI</span>
                    </h1>
                </div>
                <p className="text-gray-500 mt-2">Find your perfect match with the power of AI.</p>
            </div>
            <div className="w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg">
                {isLoginView ? (
                    <LoginPage onSwitchToSignUp={() => setIsLoginView(false)} />
                ) : (
                    <SignUpPage onSwitchToLogin={() => setIsLoginView(true)} />
                )}
            </div>
        </div>
    );
};