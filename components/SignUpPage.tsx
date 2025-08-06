import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './Button';

interface SignUpPageProps {
    onSwitchToLogin: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({ onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await signup(name, email, password);
            // The AuthProvider will handle the redirect
        } catch (err: any) {
             if (err.code === 'auth/email-already-in-use') {
                 setError('This email is already in use. Please log in.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                 setError(err.message || 'Failed to sign up. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold font-serif text-gray-800 text-center">Create Account</h2>
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-700 px-4 py-3 rounded-lg" role="alert">
                    <p>{error}</p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name-signup" className="block text-sm font-semibold text-gray-500 mb-1">Full Name</label>
                    <input
                        id="name-signup"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ananya Sharma"
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-gray-800"
                    />
                </div>
                <div>
                    <label htmlFor="email-signup" className="block text-sm font-semibold text-gray-500 mb-1">Email Address</label>
                    <input
                        id="email-signup"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-gray-800"
                    />
                </div>
                <div>
                    <label htmlFor="password-signup" className="block text-sm font-semibold text-gray-500 mb-1">Password</label>
                    <input
                        id="password-signup"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition text-gray-800"
                    />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full !py-3">
                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Button>
            </form>
            <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button onClick={onSwitchToLogin} className="font-semibold text-brand-primary hover:underline">
                    Log In
                </button>
            </p>
        </div>
    );
};