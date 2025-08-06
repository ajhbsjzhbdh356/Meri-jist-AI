
import { useState, useEffect, useCallback } from 'react';
import { Conversation, UserProfile, VibeCheck, VibeCheckReport } from '../types';
import { generateVibeCheckQuestion, analyzeVibeCheckAnswers } from '../services/geminiService';

interface UseVibeCheckProps {
    conversation: Conversation;
    currentUser: UserProfile;
    onUpdateConversation: (updates: Partial<Conversation>) => void;
    onSendSystemMessage: (messageContent: { text: string }) => void;
}

export const useVibeCheck = ({ conversation, currentUser, onUpdateConversation, onSendSystemMessage }: UseVibeCheckProps) => {
    const [isVibeCheckLoading, setIsVibeCheckLoading] = useState(false);
    const [isVibeCheckAnalyzing, setIsVibeCheckAnalyzing] = useState(false);

    const initiateVibeCheck = useCallback(async () => {
        if (conversation.vibeCheck && conversation.vibeCheck.state === 'asking') return;
        setIsVibeCheckLoading(true);
        try {
            const { question } = await generateVibeCheckQuestion(conversation.messages);
            const newVibeCheck: VibeCheck = {
                id: `vc-${Date.now()}`,
                state: 'asking',
                question,
                responses: {},
                initiatedBy: currentUser.id,
            };
            onUpdateConversation({ vibeCheck: newVibeCheck });
        } catch (error) {
            console.error("Failed to start Vibe Check", error);
            onSendSystemMessage({ text: "Sorry, I couldn't start a Vibe Check right now. The AI might be busy." });
        } finally {
            setIsVibeCheckLoading(false);
        }
    }, [conversation.messages, conversation.vibeCheck, currentUser.id, onUpdateConversation, onSendSystemMessage]);

    const submitVibeCheckAnswer = useCallback((answer: string) => {
        if (!conversation.vibeCheck) return;
        const newResponses = {
            ...conversation.vibeCheck.responses,
            [currentUser.id]: answer
        };
        const updatedVibeCheck: VibeCheck = {
            ...conversation.vibeCheck,
            responses: newResponses,
        };
        onUpdateConversation({ vibeCheck: updatedVibeCheck });
    }, [conversation.vibeCheck, currentUser.id, onUpdateConversation]);

    useEffect(() => {
        const vibeCheck = conversation.vibeCheck;
        if (vibeCheck && vibeCheck.state === 'asking' && Object.keys(vibeCheck.responses).length === 2 && !isVibeCheckAnalyzing) {
            const analyze = async () => {
                setIsVibeCheckAnalyzing(true);
                try {
                    const participantIds = Object.keys(vibeCheck.responses).map(id => parseInt(id, 10));
                    const report = await analyzeVibeCheckAnswers(
                        vibeCheck.question,
                        vibeCheck.responses[participantIds[0]],
                        vibeCheck.responses[participantIds[1]]
                    );
                    onUpdateConversation({
                        vibeCheck: {
                            ...vibeCheck,
                            state: 'completed',
                            report: report
                        }
                    });
                } catch (error) {
                    console.error("Failed to analyze vibe check answers", error);
                    onUpdateConversation({ vibeCheck: undefined });
                    onSendSystemMessage({ text: "Sorry, there was an error analyzing the Vibe Check. Let's try that again later." });
                } finally {
                    setIsVibeCheckAnalyzing(false);
                }
            };
            analyze();
        }
    }, [conversation.vibeCheck, isVibeCheckAnalyzing, onUpdateConversation, onSendSystemMessage]);

    return {
        isVibeCheckLoading,
        isVibeCheckAnalyzing,
        initiateVibeCheck,
        submitVibeCheckAnswer,
    };
};
