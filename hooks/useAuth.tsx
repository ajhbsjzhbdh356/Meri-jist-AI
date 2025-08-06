import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import { auth } from '../firebaseConfig';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    User as FirebaseUser,
    updateProfile as updateFirebaseProfile
} from 'firebase/auth';

// This is a placeholder for your API service. It must be built on your backend.
const apiService = {
    // Fetches the UserProfile from your backend after Firebase auth is confirmed.
    // The backend should verify the Firebase ID token sent in the Authorization header.
    getUserProfile: async (token: string): Promise<UserProfile> => {
        const response = await fetch('/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            // This could happen if a user is in Firebase Auth but not your DB.
            // A robust app might handle this by creating a profile automatically.
            throw new Error('Failed to fetch user profile from your backend.');
        }
        return response.json();
    },
    // Creates a new user profile in your backend database after Firebase signup.
    createUserProfile: async (name: string, email: string, uid: string, token: string): Promise<UserProfile> => {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            // Send initial data to create a default profile in your DB
            body: JSON.stringify({ name, email, uid }) 
        });
        if (!response.ok) {
            throw new Error('Failed to create user profile in your backend.');
        }
        return response.json();
    }
}

interface AuthContextType {
    user: UserProfile | null;
    firebaseUser: FirebaseUser | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            setIsInitializing(true);
            if (fbUser) {
                setFirebaseUser(fbUser);
                try {
                    const token = await fbUser.getIdToken();
                    const userProfile = await apiService.getUserProfile(token);
                    setUser(userProfile);
                } catch (error) {
                    console.error("Auth state change error:", error);
                    setUser(null); 
                    await signOut(auth); // Log out if profile fetch fails
                }
            } else {
                setFirebaseUser(null);
                setUser(null);
            }
            setIsInitializing(false);
        });
        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        const userProfile = await apiService.getUserProfile(token);
        setUser(userProfile);
        setFirebaseUser(userCredential.user);
    }, []);

    const signup = useCallback(async (name: string, email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateFirebaseProfile(userCredential.user, { displayName: name });
        
        const token = await userCredential.user.getIdToken();
        const newUserProfile = await apiService.createUserProfile(name, email, userCredential.user.uid, token);
        setUser(newUserProfile);
        setFirebaseUser(userCredential.user);
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
        setUser(null);
        setFirebaseUser(null);
    }, []);

    const value = {
        user,
        firebaseUser,
        login,
        signup,
        logout,
        isInitializing
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
