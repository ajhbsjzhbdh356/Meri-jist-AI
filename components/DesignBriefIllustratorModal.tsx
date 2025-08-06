import React, { useState } from 'react';
import { Button } from './Button';
import { SparklesIcon, CloseIcon, DocumentTextIcon } from './IconComponents';
import { generateImageFromDesignBrief } from '../services/geminiService';

interface DesignBriefIllustratorModalProps {
  onClose: () => void;
}

const DEFAULT_PROMPT = `Objective: Create a hero illustration for a dating app's primary user interface. The concept, "Beat Swipe," merges rhythmic, music-themed elements with the core swiping mechanic. The final asset must be vibrant, clean, and suitable for both web and mobile platforms, targeting a tech-savvy audience (ages 18-30).

1. Core Concept & Subject:
 * Primary Subject: A central, dynamic action depicting a user's hand swiping right on a stylized heart icon.
 * Thematic Elements: The action must be surrounded by visual representations of a "beat" or "pulse" (e.g., soundwaves, subtle radiating circles) and musical notes.
 * Secondary Subjects: Floating, slightly-angled user profile cards in the background and foreground to create depth. The cards should feature diverse, abstract, or playful avatars (e.g., interests like hiking, music, art) rather than realistic faces.

2. Composition & Framing:
 * Layout: Dynamic asymmetrical composition. The main swipe action should be the primary focal point, positioned slightly off-center to follow the rule of thirds.
 * Perspective: 2.5D isometric perspective. Give the elements a sense of depth and dimension without being fully 3D.
 * Depth: Utilize a shallow depth of field. The central heart and hand should be in sharp focus, while the surrounding profile cards are slightly out of focus (Gaussian blur) to draw attention to the main action.
 * Motion: The swipe action should be visualized with clean motion lines or a subtle ghosting effect. The profile cards should appear to be in mid-air, frozen in a moment of sorting.

3. Style & Aesthetics:
 * Primary Style: Flat 2.0 / Corporate Memphis style vector illustration. Emphasize clean shapes, bold outlines, and a friendly, approachable aesthetic.
 * Inspiration: Draw inspiration from top-tier UI/UX illustrations found on platforms like Dribbble and Behance. Think Dropbox, Google, or Slack's illustration style.
 * Linework: Use consistent, crisp vector lines with a uniform stroke weight. Outlines should be slightly darker than the fill colors to create definition.
 * Texturing: No photorealistic textures. Apply subtle grain or noise overlay to the background to add texture and avoid a sterile, flat look.

4. Color & Lighting:
 * Palette: A vibrant, triadic color scheme. Base colors should be energetic and optimistic (e.g., #FF3D7F Magenta, #3D7FFF Blue, #FFC13D Yellow). Use analogous shades for gradients.
 * Gradients: Employ smooth, multi-step gradients in the background (e.g., a radial gradient from magenta to orange) to create a sense of light and energy.
 * Lighting: Simulate a soft, ambient light source coming from the top-left. Use subtle, long shadows on the elements to enhance the 2.5D effect. No harsh or complex lighting.
 * Negative Space: Ensure ample negative space to prevent a cluttered feel and allow the illustration to breathe.

5. Technical Specifications & Output:
 * Rendering: Crisp, anti-aliased edges for all vector shapes.
 * Negative Prompt (Exclusions): Avoid photorealism, human faces with detailed features, dark or muted colors, overly complex details, hard shadows, and skeuomorphic design elements. The final image should feel digital and modern.`;

const ImageSkeleton: React.FC = () => (
    <div className="w-full aspect-video bg-slate-200 rounded-lg animate-pulse flex flex-col items-center justify-center">
        <SparklesIcon className="w-16 h-16 text-rose-gold/50" />
        <p className="mt-4 text-lg font-semibold text-deep-teal/60">AI is illustrating your design brief...</p>
    </div>
);


export const DesignBriefIllustratorModal: React.FC<DesignBriefIllustratorModalProps> = ({ onClose }) => {
    const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const base64Bytes = await generateImageFromDesignBrief(prompt);
            setGeneratedImage(base64Bytes);
        } catch (err: any) {
            setError(err.message || "An error occurred while generating your image. The model might be too busy. Please try again.");
            console.error(err);
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h2 className="text-2xl font-bold font-serif text-deep-teal flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-rose-gold"/>
                        Design Brief Illustrator
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <CloseIcon />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                    <div className="space-y-4 flex flex-col">
                         <p className="text-slate-600">Use this advanced tool to generate a detailed illustration from a design brief. Edit the example or paste your own.</p>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-gold focus:border-transparent transition flex-grow"
                        />
                        <div className="mt-auto pt-4 text-center">
                            <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} leftIcon={<SparklesIcon className="w-5 h-5"/>}>
                                {isLoading ? 'Generating...' : (generatedImage ? 'Generate Again' : 'Generate with AI')}
                            </Button>
                        </div>
                    </div>
                    <div>
                         {isLoading ? (
                            <ImageSkeleton />
                        ) : error ? (
                            <div className="w-full aspect-video bg-red-50 border border-red-200 text-red-700 rounded-lg flex flex-col items-center justify-center p-4">
                                <h4 className="font-bold">Generation Failed</h4>
                                <p className="text-sm text-center mt-2">{error}</p>
                            </div>
                        ) : generatedImage ? (
                            <img
                                src={`data:image/jpeg;base64,${generatedImage}`}
                                alt="AI Generated from Design Brief"
                                className="w-full aspect-video object-contain rounded-lg shadow-md bg-slate-100"
                            />
                        ) : (
                             <div className="w-full aspect-video bg-slate-50 border border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-4">
                                <p className="text-slate-500">Your generated illustration will appear here.</p>
                             </div>
                        )}
                    </div>
                </div>

                <div className="p-6 mt-auto border-t border-slate-200 flex justify-end gap-4">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};