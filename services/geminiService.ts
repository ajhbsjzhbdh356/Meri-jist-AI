import { GoogleGenAI, GenerateContentResponse, Type, GeneratedImage } from "@google/genai";
import { AIGeneratorType, UserProfile, CompatibilityReport, AIProfileReview, Message, DateIdea, ConversationTopic, ChatAnalysis, QuizResult, DailyBriefing, WebSource, PostDateAnalysis, AIPhotoAnalysisReport, SafetyAnalysisReport, TrustAndSafetyReport, LiveCoachingTip, AIFilterCriteria, ProactiveDateSuggestion, PracticeScenario, ConversationPracticeReport, PersonalizedDateIdea, Conversation, BlindDateRevealReport, VibeCheckReport, TwoTruthsGame, FirstMessageAuditReport, ConnectionCrest, FutureScenario, FutureScenarioReport, SharedMemory, MatchExplanation, ConnectionNudge, RelationshipNorthStarReport, DatingPatternReport, GiftIdea, WeeklyGoal, ConversationVibe, ProfileGlowUpSuggestion, DateBucketListItem, SharedValue, CoupleQuizQuestion, CoupleQuiz, DatePlan, DateVenue, JournalEntry, JournalAnalysisReport, VideoCallReport, WhatIfScenario, WhatIfVibe, RPSChoice, RPSResult, CoupleJournalPrompt, GuessTheVibeScenario, VibeWeaverStorySegment, VibeWeaverReport, PeaceKeeperReport, CoupleGoal, FakeProfile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash';

const getPrompt = (type: AIGeneratorType, keywords: string): string => {
    switch (type) {
        case AIGeneratorType.BIO:
            return `Based on these keywords: "${keywords}", write a warm, engaging, and slightly humorous matrimonial profile bio of about 100 words. Make the person sound approachable, genuine, and confident. Do not use hashtags.`;
        case AIGeneratorType.STORY:
            return `Based on these notes: "${keywords}", write a compelling and heartfelt "My Story" section for a matrimonial profile. Weave the details into a smooth narrative of about 250-300 words that is optimistic and highlights their best qualities, values, and aspirations. Start the story in an engaging way.`;
        case AIGeneratorType.CAPTION:
            return `Based on this description of a photo: "${keywords}", generate 3 short, positive, and charming captions for a matrimonial profile picture. Keep each caption under 15 words. Separate them with a newline.`;
        default:
            return keywords;
    }
}


export const generateAIContent = async (type: AIGeneratorType, keywords: string): Promise<string> => {
    try {
        const prompt = getPrompt(type, keywords);
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.7,
                topP: 1,
                topK: 32
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating AI content:", error);
        throw error;
    }
};

export const generateContentFromAudio = async (type: AIGeneratorType, audioBase64: string, mimeType: string): Promise<string> => {
    try {
        const audioPart = {
            inlineData: {
                data: audioBase64,
                mimeType,
            },
        };

        const textPrompt = `The following audio contains a person describing themselves for their matrimonial profile. First, transcribe the audio. Then, based on the transcription, write a compelling and warm profile ${type.toLowerCase()} for them.
        For a BIO, it should be about 100 words. For a STORY, it should be a narrative of 250-300 words.
        The tone should be genuine, confident, and approachable.`;
        
        const textPart = {
            text: textPrompt
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: { parts: [audioPart, textPart] },
            config: {
                temperature: 0.7,
                topP: 1,
                topK: 32
            }
        });
        
        return response.text;

    } catch (error) {
        console.error("Error generating AI content from audio:", error);
        throw error;
    }
};

const fileToGenerativePart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64,
            mimeType
        },
    };
};

export const generateAIContentFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = fileToGenerativePart(base64Image, mimeType);
        const textPart = {
            text: "Describe this image for a photo caption on a matrimonial profile. The person in the photo is the user. Be positive, warm, and charming. Make it short, under 15 words."
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, textPart] },
            config: { temperature: 0.5 }
        });
        
        return response.text;

    } catch (error) {
        console.error("Error generating AI content from image:", error);
        throw error;
    }
};

export const glowUpPhoto = async (base64Image: string, mimeType: string): Promise<string> => {
    // Step 1: Describe the image in detail
    const imagePartForDescription = {
        inlineData: { data: base64Image, mimeType },
    };
    const descriptionPrompt = "Describe this photo for a dating profile in extreme detail. Describe the person's appearance (hair color, style, clothing), their pose and expression, the background, and the overall mood. Be factual and descriptive. This description will be used to create a new, enhanced image.";
    
    const descriptionResponse = await ai.models.generateContent({
        model, // gemini-2.5-flash
        contents: { parts: [imagePartForDescription, { text: descriptionPrompt }] },
    });
    const detailedDescription = descriptionResponse.text;

    // Step 2: Generate a new image from the description
    const generationPrompt = `A vibrant, professional, high-quality, photorealistic portrait. The subject is looking at the camera with a friendly and approachable expression. The style should be flattering and well-lit. Based on this detailed description: "${detailedDescription}"`;

    const imageResponse = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: generationPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '4:3',
        },
    });

    if (!imageResponse.generatedImages || imageResponse.generatedImages.length === 0) {
        throw new Error("Image generation failed to produce an image.");
    }
    
    return imageResponse.generatedImages[0].image.imageBytes;
};

export const generateProfileSummary = async (profile: UserProfile): Promise<string> => {
    const prompt = `Summarize this matrimonial profile in a friendly, concise paragraph (around 50 words). Highlight their key personality traits and what they're looking for. Profile: ${JSON.stringify(profile)}`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generatePartnerPreferences = async (profile: UserProfile): Promise<UserProfile['partnerPreferences']> => {
    const prompt = `Based on this user's profile, suggest reasonable partner preferences for age range, religion, and profession. Profile: ${JSON.stringify(profile)}. Respond with ONLY a JSON object in the format: {"ageRange": "X-Y", "religion": "...", "profession": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text);
};

export const generateProfileReview = async (profile: UserProfile): Promise<AIProfileReview> => {
    const prompt = `Review this matrimonial profile. Provide an overall score out of 100. Give constructive feedback on the bio, story, and photos. The feedback should be encouraging and actionable. Profile: ${JSON.stringify(profile)}. Respond with ONLY a JSON object in the format: {"overallScore": number, "bioFeedback": "...", "storyFeedback": "...", "photoFeedback": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" }});
    return JSON.parse(response.text) as AIProfileReview;
};

export const generateIcebreakers = async (currentUser: UserProfile, otherProfile: UserProfile): Promise<string> => {
    const prompt = `Generate 3 creative and personalized icebreaker messages for ${currentUser.name} to send to ${otherProfile.name}. Base them on their shared interests and profiles. My Profile: ${JSON.stringify(currentUser)}. Their Profile: ${JSON.stringify(otherProfile)}. Separate each icebreaker with a newline.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const getDailyPicks = async (currentUser: UserProfile, otherUsers: UserProfile[]): Promise<number[]> => {
    const prompt = `From the list of users, select the top 3 most compatible matches for the current user. Consider their bio, interests, and preferences. Current User: ${JSON.stringify(currentUser)}. Other Users: ${JSON.stringify(otherUsers.map(u => ({id: u.id, bio: u.bio, interests: u.interestTags, preferences: u.partnerPreferences})))}. Respond with ONLY a JSON array of user IDs, like [id1, id2, id3].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as number[];
};

export const parseSearchQuery = async (query: string): Promise<AIFilterCriteria> => {
    const prompt = `Parse this search query into a structured filter object. Extract keywords, professions, cities, religion, and an age range. Query: "${query}". Respond with ONLY a JSON object in the format: {"keywords": [], "professions": [], "cities": [], "religion": "", "minAge": number, "maxAge": number}. If a field isn't mentioned, omit it or leave it empty.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as AIFilterCriteria;
};

export const findBlindDateMatch = async (currentUser: UserProfile, availableUsers: UserProfile[]): Promise<{ matchId: number | null, introMessage: string }> => {
    const prompt = `Find the most unexpectedly compatible match for the Current User from the list of Available Users based on deeper personality traits, not just superficial interests. Current User: ${JSON.stringify(currentUser)}. Available Users: ${JSON.stringify(availableUsers)}. Then, write a fun, mysterious intro message from the AI to both users to kick off their blind date chat. Respond with ONLY a JSON object in the format: {"matchId": number, "introMessage": "..."}. If no suitable match is found, return "matchId": null.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text);
};

export const getHomeScreenData = async (currentUser: UserProfile, conversations: Conversation[]): Promise<{ greeting: string; briefing: DailyBriefing; weeklyGoal: Omit<WeeklyGoal, 'isComplete'> }> => {
    const prompt = `
    Based on this user's profile and conversation activity, generate a personalized home screen briefing.
    User Profile: ${JSON.stringify(currentUser)}
    Number of conversations started: ${conversations.length}

    Respond with ONLY a JSON object in the specified format.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    greeting: {
                        type: Type.STRING,
                        description: `A warm, friendly, and slightly different greeting for the user named ${currentUser.name}. Examples: "Welcome back, ${currentUser.name}!", "Good to see you again, ${currentUser.name}!".`
                    },
                    briefing: {
                        type: Type.OBJECT,
                        properties: {
                            profileTip: {
                                type: Type.STRING,
                                description: "One actionable profile tip based on their profile."
                            },
                            conversationStarter: {
                                type: Type.STRING,
                                description: "One interesting conversation starter."
                            }
                        },
                        required: ["profileTip", "conversationStarter"]
                    },
                    weeklyGoal: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            emoji: { type: Type.STRING },
                            featureTarget: {
                                type: Type.STRING,
                                enum: ['CHATS', 'COACH', 'MATCHES', 'PROFILE']
                            }
                        },
                        required: ["title", "description", "emoji", "featureTarget"]
                    }
                },
                required: ["greeting", "briefing", "weeklyGoal"]
            }
        }
    });

    return JSON.parse(response.text) as { greeting: string; briefing: DailyBriefing; weeklyGoal: Omit<WeeklyGoal, 'isComplete'> };
};

export interface InitialAppData {
    greeting: string;
    briefing: DailyBriefing;
    weeklyGoal: Omit<WeeklyGoal, 'isComplete'>;
    dailyPickIds: number[];
}

export const getInitialAppData = async (currentUser: UserProfile, conversations: Conversation[], otherUsers: UserProfile[]): Promise<InitialAppData> => {
    const otherUsersSummary = otherUsers.map(u => ({id: u.id, bio: u.bio, interests: u.interestTags, preferences: u.partnerPreferences}));
    
    const prompt = `
    Based on the user's profile and activity, generate a personalized home screen briefing and select up to 3 compatible daily picks from the available users list.

    Current User: ${JSON.stringify(currentUser)}
    Number of conversations started: ${conversations.length}
    Available Other Users for Picks: ${JSON.stringify(otherUsersSummary)}

    Respond with ONLY a JSON object in the specified format. If there are no other users, or no suitable picks, return an empty array for dailyPickIds.
    `;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    greeting: {
                        type: Type.STRING,
                        description: `A warm, friendly, and slightly different greeting for the user named ${currentUser.name}.`
                    },
                    briefing: {
                        type: Type.OBJECT,
                        properties: {
                            profileTip: { type: Type.STRING },
                            conversationStarter: { type: Type.STRING }
                        },
                        required: ["profileTip", "conversationStarter"]
                    },
                    weeklyGoal: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            emoji: { type: Type.STRING },
                            featureTarget: {
                                type: Type.STRING,
                                enum: ['CHATS', 'COACH', 'MATCHES', 'PROFILE']
                            }
                        },
                        required: ["title", "description", "emoji", "featureTarget"]
                    },
                    dailyPickIds: {
                        type: Type.ARRAY,
                        items: { type: Type.INTEGER },
                        description: "An array of up to 3 user IDs for the most compatible daily picks. Can be empty."
                    }
                },
                required: ["greeting", "briefing", "weeklyGoal", "dailyPickIds"]
            }
        }
    });

    return JSON.parse(response.text) as InitialAppData;
};


export const explainMatch = async (currentUser: UserProfile, otherProfile: UserProfile): Promise<MatchExplanation> => {
    const prompt = `Explain why ${otherProfile.name} is a good potential match for ${currentUser.name}. Analyze both profiles to find points of compatibility in lifestyle, values, and interests. Create a catchy headline for the match. My Profile: ${JSON.stringify(currentUser)}. Their Profile: ${JSON.stringify(otherProfile)}. Respond with ONLY a JSON object in the format: {"headline": "...", "detailedReasoning": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as MatchExplanation;
}

export const generateConnectionNudges = async (conversations: Conversation[], allProfiles: UserProfile[], currentUser: UserProfile): Promise<ConnectionNudge[]> => {
    const prompt = `Analyze these conversations. Identify up to 2 promising chats that have gone quiet (stalled for 3+ days, but had a good start). For each, create a thoughtful, non-pushy suggestion to revive the conversation. Current User ID: ${currentUser.id}. Profiles: ${JSON.stringify(allProfiles)}. Conversations: ${JSON.stringify(conversations)}. Respond with ONLY a JSON array in the format: [{"conversationId": "...", "suggestion": "...", "otherUserName": "..."}]. If no chats fit, return an empty array.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as ConnectionNudge[];
}

export const planDateWithConcierge = async (idea: string, location: string, time: string): Promise<DatePlan> => {
    try {
        const prompt = `Find 3 real, highly-rated local venues for a date in ${location} around ${time}. The date idea is: "${idea}". Respond with ONLY a JSON array of objects in the format: [{"name": "...", "description": "...", "address": "..."}]. Do not include any other text or markdown.`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const webSources: WebSource[] = [];
        const sourceMap = new Map<string, WebSource>();
        if (groundingMetadata?.groundingChunks) {
            for (const sourceChunk of groundingMetadata.groundingChunks) {
                if (sourceChunk.web?.uri && !sourceMap.has(sourceChunk.web.uri)) {
                    const newSource: WebSource = {
                        uri: sourceChunk.web.uri,
                        title: sourceChunk.web.title || sourceChunk.web.uri
                    };
                    sourceMap.set(newSource.uri, newSource);
                    webSources.push(newSource);
                }
            }
        }
        
        let jsonString = response.text.trim();
        const startIndex = jsonString.indexOf('[');
        const endIndex = jsonString.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1) {
            jsonString = jsonString.substring(startIndex, endIndex + 1);
        } else {
             throw new Error("AI response was not in the expected format.");
        }
        
        const venues: DateVenue[] = JSON.parse(jsonString);
        
        return { venues, sources: webSources };
    } catch (error) {
        console.error("Error planning date with concierge:", error);
        throw new Error("The AI concierge couldn't find any venues right now. Please try a different search.");
    }
};

export const generateWhatIfScenario = async (currentUser: UserProfile, otherProfile: UserProfile, vibe: WhatIfVibe): Promise<WhatIfScenario> => {
    const prompt = `Based on these two profiles, create a short, fun, and slightly romantic "what if" story about a hypothetical first meeting or date. 
    The tone should be charming and imaginative, with a specific vibe of "${vibe.name} ${vibe.emoji}". The story should reflect this vibe.
    My Profile: ${JSON.stringify({ name: currentUser.name, interests: currentUser.interestTags, bio: currentUser.bio })}
    Their Profile: ${JSON.stringify({ name: otherProfile.name, interests: otherProfile.interestTags, bio: otherProfile.bio })}
    
    Respond ONLY with a JSON object in the specified format. The story should be about 100-120 words. The emoji should match the vibe of the story. The title should be catchy.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    emoji: { type: Type.STRING, description: "A single emoji that captures the vibe of the story." },
                    title: { type: Type.STRING, description: "A catchy, short title for the story." },
                    story: { type: Type.STRING, description: "The what-if story, around 100-120 words." }
                },
                required: ["emoji", "title", "story"]
            }
        }
    });

    const scenario = JSON.parse(response.text) as Omit<WhatIfScenario, 'vibe'>;
    return { ...scenario, vibe };
};

export const continueWhatIfStory = async (existingStory: string, vibe: WhatIfVibe): Promise<string> => {
    const prompt = `You are a creative and romantic storyteller. Continue the following story in a fun and engaging way, adding just one or two more paragraphs.
    Maintain the original charming vibe of "${vibe.name} ${vibe.emoji}". Do not repeat the initial story. Just provide the next part of the story.

    Here is the story so far:
    ---
    ${existingStory}
    ---
    
    What happens next?`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.8,
                topP: 1,
                topK: 32
            }
        });
        
        return `\n\n${response.text}`;
    } catch (error) {
        console.error("Error continuing What If story:", error);
        throw error;
    }
};

export const playRPS = async (userChoice: RPSChoice): Promise<{ aiChoice: RPSChoice; result: RPSResult }> => {
    // This function is implemented locally to avoid excessive API calls and prevent rate-limiting.
    return new Promise(resolve => {
        const choices: RPSChoice[] = ['rock', 'paper', 'scissors'];
        const aiChoice = choices[Math.floor(Math.random() * choices.length)];

        let result: RPSResult;
        if (userChoice === aiChoice) {
            result = 'draw';
        } else if (
            (userChoice === 'rock' && aiChoice === 'scissors') ||
            (userChoice === 'scissors' && aiChoice === 'paper') ||
            (userChoice === 'paper' && aiChoice === 'rock')
        ) {
            result = 'win';
        } else {
            result = 'lose';
        }

        // Simulate a small delay to feel like the AI is "thinking"
        setTimeout(() => {
            resolve({ aiChoice, result });
        }, 300);
    });
};

export const generateGuessTheVibeScenario = async (currentUser: UserProfile, otherUsers: UserProfile[]): Promise<GuessTheVibeScenario> => {
    if (otherUsers.length === 0) {
        throw new Error("No other users available to create a scenario.");
    }

    const otherProfile = otherUsers[Math.floor(Math.random() * otherUsers.length)];

    const prompt = `
        You are a creative writer for a dating app game called "Guess the Vibe".
        Your task is to create a scenario based on two user profiles.
        Current User: ${JSON.stringify({ name: currentUser.name, interests: currentUser.interestTags, profession: currentUser.profession })}
        Other User: ${JSON.stringify({ name: otherProfile.name, interests: otherProfile.interestTags, profession: otherProfile.profession })}

        Based on these profiles, please generate:
        1. A short, one or two-sentence summary of a hypothetical, early-stage conversation between them.
        2. A "correct vibe" that accurately describes this conversation (e.g., "Playful & Witty", "Deep & Thoughtful", "Curious & Inquisitive", "Adventurous & Bold").
        3. An array of 4 "vibe options". This array must include the correct vibe and three other plausible but incorrect "distractor" vibes. The correct vibe should be randomly placed in the array.
        
        Respond ONLY with a JSON object in the specified format.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    conversationSummary: {
                        type: Type.STRING,
                        description: "A short summary of a hypothetical conversation."
                    },
                    correctVibe: {
                        type: Type.STRING,
                        description: "The correct vibe of the conversation."
                    },
                    vibeOptions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array of 4 vibe options, including the correct one."
                    }
                },
                required: ["conversationSummary", "correctVibe", "vibeOptions"]
            }
        }
    });

    const scenarioData = JSON.parse(response.text) as Omit<GuessTheVibeScenario, 'otherProfileId'>;
    
    if (scenarioData.vibeOptions.length !== 4) {
        throw new Error("AI generated an invalid number of vibe options.");
    }
    if (!scenarioData.vibeOptions.includes(scenarioData.correctVibe)) {
        scenarioData.vibeOptions[Math.floor(Math.random() * 4)] = scenarioData.correctVibe;
    }


    return {
        ...scenarioData,
        otherProfileId: otherProfile.id,
    };
};

export const generateVibeWeaverScenario = async (
    user1: UserProfile,
    user2: UserProfile,
    storyHistory: { user1Choice: string, user2Choice: string, story: string }[]
): Promise<VibeWeaverStorySegment> => {
    const historySummary = storyHistory.map(turn => `Previously: ${turn.story}\n${user1.name} chose: "${turn.user1Choice}". ${user2.name} chose: "${turn.user2Choice}".`).join('\n\n');
    
    const prompt = `
        You are a creative storyteller for a dating app game called "Vibe Weaver".
        Two users, ${user1.name} and ${user2.name}, are weaving a collaborative story.
        Their profiles:
        - ${user1.name}: ${user1.bio} (Interests: ${user1.interestTags?.join(', ')})
        - ${user2.name}: ${user2.bio} (Interests: ${user2.interestTags?.join(', ')})
        
        Story so far:
        ${historySummary}

        Based on this, generate the NEXT short paragraph of the story (2-3 sentences). The story should feel romantic, fun, or intriguing.
        Then, provide two distinct choices for the user to make. Each choice must have a corresponding personality trait ('Adventurous', 'Cautious', 'Romantic', 'Pragmatic', 'Humorous', 'Serious').

        Respond ONLY with a JSON object in the specified format.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    storyText: { type: Type.STRING },
                    choices: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING },
                                trait: { type: Type.STRING, enum: ['Adventurous', 'Cautious', 'Romantic', 'Pragmatic', 'Humorous', 'Serious'] }
                            },
                            required: ["text", "trait"]
                        }
                    }
                },
                required: ["storyText", "choices"]
            }
        }
    });

    const result = JSON.parse(response.text) as VibeWeaverStorySegment;
    if (result.choices.length !== 2) {
        throw new Error("AI did not generate exactly two choices.");
    }
    return result;
};

export const analyzeVibeWeaverResults = async (
    user1: UserProfile,
    user2: UserProfile,
    choices: { user1Trait: string, user2Trait: string }[]
): Promise<VibeWeaverReport> => {
    const prompt = `
        Analyze the compatibility of two users, ${user1.name} and ${user2.name}, based on their choices in a story game.
        Here are the traits they exhibited over 3 rounds:
        - Round 1: ${user1.name} was ${choices[0].user1Trait}, ${user2.name} was ${choices[0].user2Trait}.
        - Round 2: ${user1.name} was ${choices[1].user1Trait}, ${user2.name} was ${choices[1].user2Trait}.
        - Round 3: ${user1.name} was ${choices[2].user1Trait}, ${user2.name} was ${choices[2].user2Trait}.

        Based on this pattern of choices, please generate:
        1. A catchy "Vibe Tapestry" title for their dynamic (e.g., "The Spontaneous Explorers", "The Thoughtful Harmonizers").
        2. A short, insightful analysis of their compatibility style, highlighting how they complement or align with each other.
        3. A creative conversation starter they can use to talk about their shared story.

        Respond ONLY with a JSON object in the specified format.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    analysis: { type: Type.STRING },
                    conversationStarter: { type: Type.STRING }
                },
                required: ["title", "analysis", "conversationStarter"]
            }
        }
    });

    return JSON.parse(response.text) as VibeWeaverReport;
};

export const generateCoupleComic = async (currentUser: UserProfile, otherProfile: UserProfile, scenario: string): Promise<string> => {
    
    const detailedPrompt = `Generate a single image containing a 3-panel comic strip, arranged vertically.
    The style must be a simple, cute, flat color webcomic style with charming characters and clean lines.

    Characters:
    - Character 1 (${currentUser.name}): Based on this profile: ${JSON.stringify({ profession: currentUser.profession, interests: currentUser.interestTags })}. Depict them in a stylized, simple way.
    - Character 2 (${otherProfile.name}): Based on this profile: ${JSON.stringify({ profession: otherProfile.profession, interests: otherProfile.interestTags })}. Depict them in a stylized, simple way.

    Scenario: ${scenario}

    Based on the scenario, create a short, sweet, 3-part story.
    For example, if the scenario is "a picnic that gets rained on", the panels could be:
    - Panel 1: The two characters happily setting up a picnic under a sunny sky.
    - Panel 2: A single, large raindrop falls on the character's nose. They look up, surprised.
    - Panel 3: They are now huddled under a blanket, sharing a sandwich, as rain falls around them. They are both smiling.

    Create a similar 3-panel narrative for the user-provided scenario. The comic should have a heartwarming or humorous tone. No dialogue text or speech bubbles in the image. The story should be told visually.
    The final output should be a single, cohesive image.`;
    
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: detailedPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '9:16',
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed to produce an image.");
    }
    
    return response.generatedImages[0].image.imageBytes;
};

export const generatePeaceKeeperResponse = async (whatHappened: string, whatIWantToSay: string): Promise<PeaceKeeperReport> => {
    const prompt = `
        You are a relationship counselor AI named Peace Keeper. A user is in a conflict with their partner and needs help de-escalating.
        
        The situation: "${whatHappened}"
        What the user wants to say: "${whatIWantToSay}"

        Your task is to provide helpful, non-confrontational communication tools. Respond ONLY with a JSON object in the specified format.

        1.  **reframedMessage**: Rewrite the user's message using "I" statements. Focus on expressing feelings without blaming the partner. The tone should be calm, vulnerable, and aimed at opening a dialogue, not winning an argument.
        2.  **talkingPoints**: Provide 2-3 bullet points of advice for the user on how to approach this conversation. These should be actionable tips like "Find a calm time to talk" or "Listen to their side without interrupting."
        3.  **partnerPerspective**: Write a short paragraph that gently suggests what the partner might be feeling or thinking. This should foster empathy. Frame it as a possibility, e.g., "It's possible your partner might be feeling..."
    `;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    reframedMessage: { type: Type.STRING },
                    talkingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    partnerPerspective: { type: Type.STRING }
                },
                required: ['reframedMessage', 'talkingPoints', 'partnerPerspective']
            }
        }
    });

    return JSON.parse(response.text) as PeaceKeeperReport;
};

export const generateGoalEmoji = async (goalTitle: string): Promise<string> => {
    const prompt = `Generate a single, relevant emoji for this couple's goal: "${goalTitle}". Respond with ONLY the emoji.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text.trim();
};

export const generateGoalSuggestions = async (user1: UserProfile, user2: UserProfile, conversation: Conversation): Promise<Omit<CoupleGoal, 'id' | 'isComplete' | 'suggestedBy'>[]> => {
    const prompt = `Based on the profiles of ${user1.name} and ${user2.name} and their recent conversation, suggest 3 diverse, actionable, and fun goals for them to accomplish together. For each goal, provide a title and a single relevant emoji. The goals should be things a couple can work towards, like "Learn a new recipe together" or "Plan a weekend trip".
    
    User 1 Profile: ${JSON.stringify({ interests: user1.interestTags, profession: user1.profession })}
    User 2 Profile: ${JSON.stringify({ interests: user2.interestTags, profession: user2.profession })}
    Conversation Snippet: ${JSON.stringify(conversation.messages.slice(-10).map(m => m.text))}
    
    Respond ONLY with a JSON array in the format: [{"title": "...", "emoji": "..."}, ...].`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        emoji: { type: Type.STRING }
                    },
                    required: ["title", "emoji"]
                }
            }
        }
    });

    return JSON.parse(response.text) as Omit<CoupleGoal, 'id' | 'isComplete' | 'suggestedBy'>[];
};

export const generateFakeProfile = async (inspirationProfile: UserProfile): Promise<FakeProfile> => {
    const prompt = `
    Based on this real dating profile, create a *plausible but completely fictional* new profile for a game.
    The goal is to create a profile that is hard to distinguish from a real person.
    It should be different from the inspiration profile, but have a similar level of detail and realism.
    Inspiration Profile: ${JSON.stringify({
        name: inspirationProfile.name,
        age: inspirationProfile.age,
        city: inspirationProfile.city,
        profession: inspirationProfile.profession,
        bio: inspirationProfile.bio,
        interestTags: inspirationProfile.interestTags,
    })}

    Generate the following fields for the new fictional profile:
    - name: A common but different first and last name.
    - age: A similar age, +/- 5 years.
    - city: A different major city in the same country.
    - profession: A different but plausible profession.
    - bio: A short, engaging bio (around 30 words) that sounds like a real person wrote it.
    - story: A longer story (around 100 words) that elaborates on their personality and what they are looking for.
    - interestTags: An array of 5-7 plausible interest tags.
    - avatarPrompt: A detailed prompt for generating a photorealistic portrait for this fictional person. E.g., "Photorealistic portrait of a 32-year-old Indian software engineer named Priya, smiling warmly, with glasses and shoulder-length black hair, in a casual setting like a cafe."

    Respond ONLY with a JSON object in the specified format.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    age: { type: Type.INTEGER },
                    city: { type: Type.STRING },
                    profession: { type: Type.STRING },
                    bio: { type: Type.STRING },
                    story: { type: Type.STRING },
                    interestTags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    avatarPrompt: { type: Type.STRING }
                },
                required: ["name", "age", "city", "profession", "bio", "story", "interestTags", "avatarPrompt"]
            }
        }
    });

    return JSON.parse(response.text) as FakeProfile;
};


export const generateChatReply = async (messages: Message[]): Promise<string> => {
    const prompt = `Given this chat history, suggest three distinct, thoughtful replies for the user. Keep them short and engaging. History: ${JSON.stringify(messages.slice(-5))}. Separate replies with a newline.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const rewriteMessage = async (messages: Message[], originalMessage: string, tone: string): Promise<string> => {
    const prompt = `Rewrite this message: "${originalMessage}" to have a more "${tone}" tone. Consider the recent chat history: ${JSON.stringify(messages.slice(-3))}. Respond with only the rewritten message.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generateReplyFromAudio = async (messages: Message[], audioBase64: string, mimeType: string): Promise<string> => {
    const audioPart = { inlineData: { data: audioBase64, mimeType } };
    const textPart = { text: `A user sent this audio message in response to a chat. First, transcribe it. Then, based on the transcription and chat history, suggest three potential text replies. History: ${JSON.stringify(messages.slice(-3))}. Separate replies with a newline.` };
    const response = await ai.models.generateContent({ model, contents: { parts: [audioPart, textPart] } });
    return response.text;
};

export const analyzeMessageForSafety = async (message: string): Promise<SafetyAnalysisReport> => {
    const prompt = `Analyze this message for safety in a dating app context. Is it inappropriate, aggressive, or a scam? Message: "${message}". Respond with ONLY a JSON object: {"isSafe": boolean, "reason": "..."}. The reason should be brief.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text);
};

export const getLiveChatCoachingTip = async (messages: Message[]): Promise<LiveCoachingTip> => {
    const prompt = `Act as a dating coach. Based on this chat history, provide one concise, actionable tip for the user. This could be an opportunity to ask a question, share something, or a suggestion to improve communication. History: ${JSON.stringify(messages.slice(-6))}. Respond with ONLY a JSON object: {"tip": "...", "category": "SUGGESTION"}. Category can be OPPORTUNITY, SUGGESTION, or ENCOURAGEMENT.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text);
};

export const getProactiveDateSuggestion = async (messages: Message[], currentUser: UserProfile, otherUser: UserProfile): Promise<ProactiveDateSuggestion> => {
    const prompt = `Analyze this chat history between ${currentUser.name} and ${otherUser.name}. Has the conversation reached a point where it would be natural and appropriate for ${currentUser.name} to suggest a date? The conversation should be positive and have progressed beyond initial pleasantries. History: ${JSON.stringify(messages)}. Respond with ONLY a JSON object: {"shouldSuggest": boolean, "reason": "...", "suggestionText": "..."}. The suggestion text should be a natural message ${currentUser.name} could send.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text);
};

export const generateVibeCheckQuestion = async (messages: Message[]): Promise<{ question: string }> => {
    const prompt = `Based on this recent conversation history, generate one fun, non-generic, open-ended "Vibe Check" question for two people to answer privately to see if they're on the same wavelength. The question should be about values, humor, or preferences. Conversation: ${JSON.stringify(messages.slice(-6))}. Respond ONLY with a JSON object: {"question": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text);
};

export const analyzeVibeCheckAnswers = async (question: string, answer1: string, answer2: string): Promise<VibeCheckReport> => {
    const prompt = `Two users were asked the question: "${question}". User 1 answered: "${answer1}". User 2 answered: "${answer2}". Analyze their answers for compatibility. Provide a "harmony score" from 0-100. Write a brief analysis of their alignment. Suggest a good follow-up icebreaker. Respond ONLY with JSON: {"harmonyScore": number, "analysis": "...", "nextIcebreaker": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as VibeCheckReport;
};

export const generateDateIdeas = async (currentUser: UserProfile, otherProfile: UserProfile): Promise<DateIdea[]> => {
    const prompt = `Based on these two user profiles, generate 3 diverse date ideas. User 1: ${JSON.stringify({ interests: currentUser.interestTags, city: currentUser.city })}. User 2: ${JSON.stringify({ interests: otherProfile.interestTags, city: otherProfile.city })}. For each idea, provide a title, a short description, and a category from this list: "Casual", "Adventurous", "Creative", "Foodie", "Relaxing", "Intellectual". Respond with ONLY a JSON array in the format: [{"title": "...", "description": "...", "category": "..."}].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as DateIdea[];
};

export const generateConversationTopics = async (currentUser: UserProfile): Promise<ConversationTopic[]> => {
    const prompt = `Based on this user's profile, generate 3 interesting and open-ended conversation topics they could use to start a chat. For each topic, provide the topic itself and a short reasoning for why it's a good fit for them. Profile: ${JSON.stringify(currentUser)}. Respond with ONLY a JSON array in the format: [{"topic": "...", "reasoning": "..."}].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as ConversationTopic[];
};

export const analyzeConversation = async (messages: Message[]): Promise<ChatAnalysis> => {
    const prompt = `Analyze this conversation from a dating app. Provide: 1. A one-word "vibe" (e.g., Playful, Deep, Formal). 2. A single emoji for that vibe. 3. A list of key topics discussed. 4. A suggestion for the user to improve the chat. 5. An analysis of communication styles for both users. Respond with ONLY a JSON object in the format: {"vibe": "...", "vibeEmoji": "...", "keyTopics": [...], "coachSuggestion": "...", "communicationStyles": {"user1Style": "...", "user2Style": "...", "analysis": "..."}}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as ChatAnalysis;
};

export const generateQuizAnalysis = async (answers: Record<string, string>): Promise<QuizResult> => {
    const prompt = `A user has answered a relationship quiz. Based on their answers, generate a "profile title" (e.g., "The Adventurous Partner"), a short analysis of their relationship style, and 3 actionable tips for their dating journey. Answers: ${JSON.stringify(answers)}. Respond with ONLY a JSON object: {"profileTitle": "...", "analysis": "...", "tips": ["...", "...", "..."]}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as QuizResult;
};

export const getDatingSafetyTips = async (query: string): Promise<{ text: string; sources: WebSource[] }> => {
    const prompt = `A user is asking for dating safety advice. Their query is: "${query}". Provide a helpful, concise, and safe response using Google Search. Summarize the key tips.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    
    const webSources: WebSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map(chunk => chunk.web && { uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri })
        .filter((source): source is WebSource => source !== undefined) || [];

    return { text: response.text, sources: webSources };
};

export const analyzePostDateDebrief = async (mainDescription: string, enjoyedMost: string, feltOff: string): Promise<PostDateAnalysis> => {
    const prompt = `Analyze a user's post-date debrief. Description: "${mainDescription}". What they enjoyed: "${enjoyedMost}". What felt off: "${feltOff}". Provide a "vibe" (e.g., "Sparkling Chemistry"), a single emoji for the vibe, a list of green flags, a list of red flags (or things to consider), and a suggested next step. Respond with ONLY a JSON object: {"vibe": "...", "vibeEmoji": "...", "greenFlags": [...], "redFlags": [...], "nextStepSuggestion": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as PostDateAnalysis;
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
    const audioPart = { inlineData: { data: audioBase64, mimeType } };
    const textPart = { text: "Transcribe this audio. Respond with only the transcription text." };
    const response = await ai.models.generateContent({ model, contents: { parts: [audioPart, textPart] } });
    return response.text;
};

export const generatePracticeChatReply = async (history: { role: 'user' | 'model'; parts: { text: string }[] }[], scenario: string, persona: string): Promise<string> => {
    const prompt = `You are an AI role-playing as a potential match in a dating app practice scenario. Your persona is: "${persona}". The scenario is: "${scenario}". Continue the conversation naturally based on the history. Respond as your persona. Chat History: ${JSON.stringify(history)}`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const analyzePracticeConversation = async (history: { role: 'user' | 'model'; parts: { text: string }[] }[], scenario: PracticeScenario): Promise<ConversationPracticeReport> => {
    const prompt = `Analyze this practice conversation. Scenario: "${scenario}". Provide a list of things that went well, a list of things to consider or improve, and a summary of the user's performance. Respond with ONLY a JSON object: {"whatWentWell": [...], "thingsToConsider": [...], "summary": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as ConversationPracticeReport;
};

export const generatePersonalizedDateIdeas = async (interests: string, budget: string, location: string): Promise<PersonalizedDateIdea[]> => {
    const prompt = `Generate 3 personalized date ideas. Interests/Vibe: "${interests}". Budget: "${budget}". Location: "${location}". For each idea, provide a title, description, category, and estimated cost. Respond with ONLY a JSON array: [{"title": "...", "description": "...", "category": "...", "estimatedCost": "..."}].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as PersonalizedDateIdea[];
};

export const generateAvatar = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({ model: 'imagen-3.0-generate-002', prompt });
    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed.");
    }
    return response.generatedImages[0].image.imageBytes;
};

export const generateInterestTags = async (profile: UserProfile): Promise<string[]> => {
    const prompt = `Based on this user's profile, suggest 5-7 relevant interest tags. Profile: ${JSON.stringify(profile)}. Respond with ONLY a JSON array of strings: ["tag1", "tag2", ...].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as string[];
};

export const generateCompatibilityReport = async (currentUser: UserProfile, profile: UserProfile): Promise<CompatibilityReport> => {
    const prompt = `Analyze the compatibility between these two profiles. Provide a compatibility score from 0-100 and a brief reasoning. User 1: ${JSON.stringify(currentUser)}. User 2: ${JSON.stringify(profile)}. Respond with ONLY a JSON object: {"score": number, "reasoning": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as CompatibilityReport;
};

export const generateTrustAndSafetyReport = async (profile: UserProfile): Promise<TrustAndSafetyReport> => {
    const prompt = `Analyze this profile for a trust and safety score from 0-100 based on completeness (bio, story, photos, prompts). Provide a brief reason. Profile: ${JSON.stringify(profile)}. Respond with ONLY a JSON object: {"score": number, "reason": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as TrustAndSafetyReport;
};

export const generateDreamDateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({ model: 'imagen-3.0-generate-002', prompt: `An illustration of a dream date scenario: ${prompt}`, config: { aspectRatio: "16:9" } });
    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed.");
    }
    return response.generatedImages[0].image.imageBytes;
};

export const auditFirstMessage = async (matchContext: string, userMessage: string): Promise<FirstMessageAuditReport> => {
    const prompt = `Audit this first message for a dating app. Match's context: "${matchContext}". User's message: "${userMessage}". Provide a score out of 10, what works, suggestions, and 3 alternative messages. Respond with ONLY a JSON object: {"score": number, "whatWorks": [...], "suggestions": [...], "alternatives": [...]}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as FirstMessageAuditReport;
};

export const analyzeProfilePhotos = async (imageParts: { base64: string, mimeType: string }[]): Promise<AIPhotoAnalysisReport> => {
    const prompt = `Analyze these profile photos. For each photo, provide a score (0-100), a list of pros, and a list of cons. Also, determine the best overall photo index and a summary recommendation. Respond with ONLY a JSON object: {"bestPhotoIndex": number, "overallRecommendation": "...", "analyses": [{"score": number, "pros": [...], "cons": [...]}, ...]}.`;
    const contents = { parts: [...imageParts.map(p => fileToGenerativePart(p.base64, p.mimeType)), { text: prompt }] };
    const response = await ai.models.generateContent({ model, contents, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as AIPhotoAnalysisReport;
};

export const generateBlindDateRevealReport = async (conversation: Conversation, currentUser: UserProfile, otherParticipant: UserProfile): Promise<BlindDateRevealReport> => {
    const prompt = `This is a blind date reveal. Analyze the conversation and profiles. Provide a compatibility score (0-100), conversation highlights, shared interests, and a next icebreaker. Conversation: ${JSON.stringify(conversation.messages)}. User 1: ${JSON.stringify(currentUser)}. User 2: ${JSON.stringify(otherParticipant)}. Respond with ONLY a JSON object: {"compatibilityScore": number, "conversationHighlights": [...], "sharedInterests": [...], "nextIcebreaker": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as BlindDateRevealReport;
};

export const analyzeFutureScenario = async (history: { role: 'user' | 'model'; parts: { text: string }[] }[], scenario: FutureScenario): Promise<FutureScenarioReport> => {
    const prompt = `Analyze this role-play scenario conversation about "${scenario.title}". Provide key takeaways, an analysis of the user's communication style, their collaborative spirit, and a summary. Conversation: ${JSON.stringify(history)}. Respond with ONLY a JSON object: {"keyTakeaways": [...], "communicationStyle": "...", "collaborativeSpirit": "...", "summary": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as FutureScenarioReport;
};

export const getTwoTruthsAICommentary = async (statements: string[], lie: string, guess: string, wasCorrect: boolean): Promise<string> => {
    const prompt = `Generate a short, fun, one-sentence AI commentary for a game of Two Truths and a Lie. The user guessed "${guess}", and the actual lie was "${lie}". The guess was ${wasCorrect ? 'correct' : 'incorrect'}.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generateConnectionCrest = async (user1: UserProfile, user2: UserProfile, conversation: Conversation): Promise<ConnectionCrest> => {
    const prompt = `Create a symbolic "Connection Crest" for two users based on their profiles and conversation. Generate an array of 2-3 simple SVG path objects (d and fill color) that can be layered, and a short description of what the crest represents. User 1: ${JSON.stringify(user1)}. User 2: ${JSON.stringify(user2)}. Conversation: ${JSON.stringify(conversation.messages.slice(-10))}. Respond with ONLY a JSON object: {"svgPaths": [{"d": "...", "fill": "..."}, ...], "description": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as ConnectionCrest;
};

export const extractSharedMemories = async (messages: Message[], userName1: string, userName2: string): Promise<Omit<SharedMemory, 'id'>[]> => {
    const prompt = `From this conversation between ${userName1} and ${userName2}, extract up to 3 key "shared memories" or inside jokes. For each, provide a short title, a one-sentence description, and a single emoji. Conversation: ${JSON.stringify(messages)}. Respond with ONLY a JSON array: [{"title": "...", "description": "...", "emoji": "..."}, ...].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as Omit<SharedMemory, 'id'>[];
};

export const generateRelationshipNorthStar = async (answers: Record<string, string>): Promise<RelationshipNorthStarReport> => {
    const prompt = `Based on these quiz answers, define a user's "Relationship North Star." Provide a title for their relationship style, their core desire, 3 guiding values, and a summary of what they offer and seek in a partner. Answers: ${JSON.stringify(answers)}. Respond with ONLY a JSON object: {"title": "...", "coreDesire": "...", "guidingValues": [...], "whatYouOffer": "...", "whatYouSeek": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as RelationshipNorthStarReport;
};

export const analyzeDatingPatterns = async (currentUser: UserProfile, likedProfiles: UserProfile[], conversations: Conversation[]): Promise<DatingPatternReport> => {
    const prompt = `Analyze this user's dating patterns based on their profile, liked profiles, and conversation snippets. Identify their "Attraction Blueprint" (who they like), "Conversation Flow" (how they chat), an "Unseen Pattern" they might not be aware of, and a coach recommendation. User: ${JSON.stringify(currentUser)}. Liked: ${JSON.stringify(likedProfiles)}. Conversations: ${JSON.stringify(conversations.slice(0, 3).map(c => c.messages.slice(0, 4)))}. Respond with ONLY a JSON object: {"attractionBlueprint": "...", "conversationFlow": "...", "unseenPattern": "...", "coachRecommendation": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as DatingPatternReport;
};

export const generateGiftIdeas = async (currentUser: UserProfile, otherProfile: UserProfile, conversation: Conversation, occasion: string, budget: string, notes: string): Promise<GiftIdea[]> => {
    const prompt = `Suggest 3 gift ideas for ${otherProfile.name} from ${currentUser.name} for the occasion: "${occasion}". Budget: ${budget}. User notes: "${notes}". Analyze their profiles and conversation for clues. For each idea, provide a name, description, reasoning, and estimated cost. Respond with ONLY a JSON array: [{"name": "...", "description": "...", "reasoning": "...", "estimatedCost": "..."}, ...].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as GiftIdea[];
};

export const generateProfileGlowUpSuggestions = async (profile: UserProfile): Promise<ProfileGlowUpSuggestion[]> => {
    const prompt = `Review this user's profile (bio, story, and prompts). Provide up to 3 "Glow-Up" suggestions. For each, specify the type (BIO, STORY, or PROMPT), the original text, a suggested improved text, and the reason for the change. If suggesting for a prompt, include the original question. Profile: ${JSON.stringify(profile)}. Respond with ONLY a JSON array: [{"type": "...", "promptQuestion": "...", "originalText": "...", "suggestedText": "...", "reason": "..."}, ...].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as ProfileGlowUpSuggestion[];
};

export const analyzeConversationVibe = async (messages: Message[]): Promise<ConversationVibe> => {
    const prompt = `Analyze the "vibe" of this conversation. Determine the dominant vibe from 'Playful', 'Deep', 'Curious', 'Warm', 'Formal', 'Neutral'. Provide an intensity score from 0.0 to 1.0. Also suggest a color palette of 3 hex codes that represent this vibe. Conversation: ${JSON.stringify(messages.slice(-8))}. Respond with ONLY a JSON object: {"dominantVibe": "...", "intensity": number, "colorPalette": ["#...", "#...", "#..."]}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as ConversationVibe;
};

export const suggestDateIdeasFromChat = async (chatHistory: string): Promise<{title: string, description: string}[]> => {
    const prompt = `Based on this chat history, suggest 2 unique date ideas that reflect the users' conversations and personalities. For each, provide a title and a short description. History: "${chatHistory}". Respond with ONLY a JSON array: [{"title": "...", "description": "..."}, ...].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as {title: string, description: string}[];
};

export const generateDateIdeaDescription = async (title: string): Promise<string> => {
    const prompt = `Write a short, appealing, one-sentence description for a date idea titled: "${title}".`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generateDateItinerary = async (title: string, user1: UserProfile, user2: UserProfile): Promise<string> => {
    const prompt = `Create a simple, fun, 3-step itinerary for a date titled "${title}" for ${user1.name} and ${user2.name}. Consider their profiles. Respond with a short, bulleted list (using *). Profile 1: ${JSON.stringify(user1)}. Profile 2: ${JSON.stringify(user2)}.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generateRelationshipCheckInPrompt = async (chatHistory: string): Promise<string> => {
    const prompt = `Based on this recent chat history, generate one gentle, open-ended question for a relationship check-in. The goal is to foster deeper connection. History: "${chatHistory}". Respond with ONLY the question text.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generateSharedValues = async (user1: UserProfile, user2: UserProfile, conversation: Conversation): Promise<SharedValue[]> => {
    const prompt = `Analyze the profiles of ${user1.name} and ${user2.name} and their conversation. Identify their top 2 shared values. For each value, provide the value name, a short reasoning, and a single emoji. Respond with ONLY a JSON array: [{"value": "...", "reasoning": "...", "emoji": "..."}, ...].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as SharedValue[];
};

export const generateCoupleQuizQuestions = async (user1: UserProfile, user2: UserProfile, conversation: Conversation): Promise<Omit<CoupleQuizQuestion, 'id' | 'responses'>[]> => {
    const prompt = `Create a fun, 3-question "Couple Quiz" for ${user1.name} and ${user2.name} based on their conversation and profiles. The questions should be about each other. For each question, provide the question text, 4 plausible options, and the correct answer text. Respond with ONLY a JSON array: [{"question": "...", "options": [...], "correctAnswer": "..."}, ...].`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as Omit<CoupleQuizQuestion, 'id' | 'responses'>[];
};

export const analyzeCoupleQuizResults = async (quiz: CoupleQuiz, name1: string, name2: string, id1: number, id2: number): Promise<string> => {
    const prompt = `Analyze the results of this couple's quiz. ${name1} scored ${quiz.scores[id1]}. ${name2} scored ${quiz.scores[id2]}. Provide a short, fun, and encouraging commentary on their results. Quiz: ${JSON.stringify(quiz)}.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const generateCoupleJournalPrompt = async (chatHistory: string): Promise<string> => {
    const prompt = `Based on this recent chat history, create one insightful and reflective journal prompt for a couple to answer privately. History: "${chatHistory}". Respond with ONLY the prompt text.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const analyzeCoupleJournalEntries = async (prompt: string, entry1: string, entry2: string): Promise<string> => {
    const promptText = `Two partners responded to the journal prompt: "${prompt}". Entry 1: "${entry1}". Entry 2: "${entry2}". Provide a short, insightful, and positive analysis of their combined entries, highlighting their connection.`;
    const response = await ai.models.generateContent({ model, contents: promptText });
    return response.text;
};

export const generateOurSongLyrics = async (user1: UserProfile, user2: UserProfile, conversation: Conversation): Promise<string> => {
    const prompt = `Write short, simple, and sweet song lyrics (verse-chorus-verse-chorus structure) about the connection between ${user1.name} and ${user2.name}, based on their profiles and conversation.`;
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const analyzeVideoCall = async (currentUser: UserProfile, otherParticipant: UserProfile, messages: Message[]): Promise<VideoCallReport> => {
    const prompt = `A video call just ended between ${currentUser.name} and ${otherParticipant.name}. Based on their chat history leading up to the call, generate a plausible post-call analysis. Provide a "vibe", a list of potential positive moments, and a next step suggestion. Respond with ONLY a JSON object: {"vibe": "...", "positiveMoments": [...], "nextStepSuggestion": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as VideoCallReport;
};

export const analyzeJournalEntries = async (entries: JournalEntry[], conversations: Conversation[], likedProfiles: UserProfile[]): Promise<JournalAnalysisReport> => {
    const prompt = `Analyze this user's journal entries in the context of their dating app activity. Identify key themes, emotional trends, an actionable insight for the user, and a specific insight connecting their journal to their dating life. Respond with ONLY a JSON object: {"keyThemes": [...], "emotionalTrend": "...", "actionableInsight": "...", "datingConnectionInsight": "..."}.`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as JournalAnalysisReport;
};

export const generateVideoCallTopics = async (currentUser: UserProfile, otherParticipant: UserProfile): Promise<string[]> => {
    const prompt = `Suggest 3 fun, open-ended conversation topics for a first video call between ${currentUser.name} and ${otherParticipant.name}, based on their profiles. Respond with ONLY a JSON array of strings: ["...", "...", "..."]`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as string[];
};

export const createVideoCallMemory = async (base64Image: string, mimeType: string): Promise<Omit<SharedMemory, 'id'>> => {
    const imagePart = fileToGenerativePart(base64Image, mimeType);
    const textPart = { text: `This is a screenshot from a video call on a dating app. The user wants to capture it as a "shared memory". Generate a short, sweet title for this memory and a single emoji. Respond with ONLY a JSON object: {"title": "...", "description": "A nice moment from our video call.", "emoji": "..."}.` };
    const response = await ai.models.generateContent({ model, contents: { parts: [imagePart, textPart] }, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text) as Omit<SharedMemory, 'id'>;
};

export const generateImageFromDesignBrief = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({ model: 'imagen-3.0-generate-002', prompt, config: { aspectRatio: "16:9" } });
    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed.");
    }
    return response.generatedImages[0].image.imageBytes;
};