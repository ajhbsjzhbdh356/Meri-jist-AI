

import React, { useState, useEffect } from 'react';
import { UserProfile, AIProfileReview } from '../types';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, CircularProgress } from './IconComponents';
import { generateProfileReview } from '../services/geminiService';

interface AIReviewModalProps {
  profile: UserProfile;
  onClose: () => void;
}

const FeedbackSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
    <div>
        <h4 className="text-xl font-bold font-serif text-brand-purple-dark mb-2">{title}</h4>
        <div className="bg-cream/60 p-4 rounded-lg border border-dusty-rose/30">
            <p className="text-slate-700">{children}</p>
        </div>
    </div>
);

export const AIReviewModal: React.FC<AIReviewModalProps> = ({ profile, onClose }) => {
  const [review, setReview] = useState<AIProfileReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReview = async () => {
      setIsLoading(true);
      try {
        const result = await generateProfileReview(profile);
        setReview(result);
      } catch (error) {
        console.error("Failed to generate profile review", error);
        setReview({
            overallScore: 0,
            bioFeedback: "Could not generate feedback at this time. The AI might be busy, please try again later.",
            storyFeedback: "Could not generate feedback at this time.",
            photoFeedback: "Could not generate feedback at this time."
        });
      }
      setIsLoading(false);
    };

    fetchReview();
  }, [profile]);


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold font-serif text-brand-purple-dark">AI Profile Review</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-lg min-h-[400px]">
                <SparklesIcon className="w-16 h-16 text-brand-secondary animate-pulse" />
                <p className="mt-4 text-xl font-semibold text-brand-purple-dark">Our AI dating coach is reviewing your profile...</p>
                <p className="text-slate-500">This will just take a moment.</p>
            </div>
          )}

          {!isLoading && review && (
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center">
                    <CircularProgress className="w-40 h-40" progress={review.overallScore} viewBoxSize={140} strokeWidth={12}>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-brand-purple-dark">{review.overallScore}</span>
                            <span className="text-sm font-semibold text-slate-500">Profile Score</span>
                        </div>
                    </CircularProgress>
                    <p className="mt-4 max-w-md text-slate-600">This score reflects your profile's potential to attract meaningful connections. Here's how you can make it even stronger!</p>
                </div>

                <FeedbackSection title="On Your Bio">
                    {review.bioFeedback}
                </FeedbackSection>
                
                <FeedbackSection title="On Your Story">
                    {review.storyFeedback}
                </FeedbackSection>

                <FeedbackSection title="On Your Photos">
                    {review.photoFeedback}
                </FeedbackSection>

            </div>
          )}

        </div>

        <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
          <Button variant="primary" onClick={onClose}>Got it, thanks!</Button>
        </div>
      </div>
    </div>
  );
};