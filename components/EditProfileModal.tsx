

import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { CloseIcon, SparklesIcon } from './IconComponents';
import { generatePartnerPreferences } from '../services/geminiService';

interface EditProfileModalProps {
  profile: UserProfile;
  section: 'basic' | 'preferences';
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => void;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1">{children}</label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition" />
);

// Define discriminated union for state
type BasicData = Pick<UserProfile, 'name' | 'age' | 'height' | 'city' | 'profession' | 'religion'>;
type PreferencesData = UserProfile['partnerPreferences'];

type FormState = 
    | { type: 'basic', data: BasicData }
    | { type: 'preferences', data: PreferencesData }


export const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, section, onClose, onSave }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>(() => {
    if (section === 'basic') {
      return {
        type: 'basic',
        data: {
          name: profile.name,
          age: profile.age,
          height: profile.height,
          city: profile.city,
          profession: profile.profession,
          religion: profile.religion,
        }
      };
    } else {
      return { 
        type: 'preferences',
        data: { ...profile.partnerPreferences } 
      };
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormState(prevState => {
        if (prevState.type === 'basic') {
            return {
                ...prevState,
                data: {
                    ...prevState.data,
                    [name]: name === 'age' ? parseInt(value) || 0 : value
                }
            };
        }
        if (prevState.type === 'preferences') {
            return {
                ...prevState,
                data: {
                    ...prevState.data,
                    [name]: value
                }
            }
        }
        return prevState;
    });
  };
  
  const handleSave = () => {
    if (formState.type === 'basic') {
        onSave(formState.data);
    } else {
        onSave({ partnerPreferences: formState.data });
    }
    onClose();
  };

  const handleSuggestPreferences = async () => {
    setIsLoading(true);
    try {
        const suggestions = await generatePartnerPreferences(profile);
        setFormState(prevState => {
            if (prevState.type === 'preferences') {
                return {
                    ...prevState,
                    data: suggestions
                };
            }
            return prevState;
        });
    } catch (error) {
        console.error("Could not suggest preferences", error);
        alert("Sorry, the AI couldn't generate suggestions right now. Please try again later.");
    } finally {
        setIsLoading(false);
    }
  };

  const title = section === 'basic' ? 'Edit Basic Info' : 'Edit Partner Preferences';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-deep-teal">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
            {formState.type === 'basic' ? (
                <>
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input type="text" id="name" name="name" value={formState.data.name} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="age">Age</Label>
                        <Input type="number" id="age" name="age" value={formState.data.age} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="height">Height</Label>
                        <Input type="text" id="height" name="height" value={formState.data.height} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="city">City</Label>
                        <Input type="text" id="city" name="city" value={formState.data.city} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="profession">Profession</Label>
                        <Input type="text" id="profession" name="profession" value={formState.data.profession} onChange={handleChange} />
                    </div>
                    <div>
                        <Label htmlFor="religion">Religion</Label>
                        <Input type="text" id="religion" name="religion" value={formState.data.religion} onChange={handleChange} />
                    </div>
                </>
            ) : (
                <fieldset disabled={isLoading}>
                    <div className="text-center mb-4 border-b border-slate-200 pb-4">
                        <p className="text-sm text-slate-600 mb-3">Not sure what you're looking for? Let our AI suggest preferences based on your profile.</p>
                        <Button
                            variant="secondary"
                            onClick={handleSuggestPreferences}
                            disabled={isLoading}
                            leftIcon={<SparklesIcon className="w-5 h-5" />}
                        >
                            {isLoading ? 'Thinking...' : 'Suggest with AI'}
                        </Button>
                    </div>
                    <div>
                        <Label htmlFor="ageRange">Age Range</Label>
                        <Input type="text" id="ageRange" name="ageRange" value={formState.data.ageRange} onChange={handleChange} placeholder="e.g., 28-35"/>
                    </div>
                    <div>
                        <Label htmlFor="religion">Religion</Label>
                        <Input type="text" id="religion" name="religion" value={formState.data.religion} onChange={handleChange} placeholder="e.g., Hindu, Any" />
                    </div>
                     <div>
                        <Label htmlFor="profession">Profession</Label>
                        <Input type="text" id="profession" name="profession" value={formState.data.profession} onChange={handleChange} placeholder="e.g., Doctor, Engineer" />
                    </div>
                </fieldset>
            )}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};