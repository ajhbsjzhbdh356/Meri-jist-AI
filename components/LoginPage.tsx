import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';

interface LoginPageProps {
    onSwitchToSignUp: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignUp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await login(email, password);
            // The AuthProvider will handle the redirect
        } catch (err: any) {
            setError(err.message || 'Failed to log in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold font-serif text-gray-800 text-center">Welcome Back</h2>
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-700 px-4 py-3 rounded-lg" role="alert">
                    <p>{error}</p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email-login" className="block text-sm font-semibold text-gray-500 mb-1">Email Address</label>
                    <input
                        id="email-login"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-gray-800"
                    />
                </div>
                <div>
                    <label htmlFor="password-login" className="block text-sm font-semibold text-gray-500 mb-1">Password</label>
                    <input
                        id="password-login"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-gray-800"
                    />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full !py-3">
                    {isLoading ? 'Logging In...' : 'Log In'}
                </Button>
            </form>
            <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <button onClick={onSwitchToSignUp} className="font-semibold text-brand-primary hover:underline">
                    Sign Up
                </button>
            </p>
        </div>
    );
};
