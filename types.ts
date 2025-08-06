

export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'win' | 'lose' | 'draw';

export interface Photo {
  id: number;
  url: string;
  caption: string;
}

export interface Prompt {
  id: number;
  question: string;
  answer: string;
}

export type DynamicBadgeType = 'GREAT_CHATTER' | 'VERIFIED_PROFILER' | 'PROMPT_PRO';

export interface DynamicBadge {
    type: DynamicBadgeType;
    text: string;
    description: string;
}

export type PurchasableBadgeId = 'GEM' | 'LAUREL' | 'SHOOTING_STAR';

export interface PurchasableBadge {
    id: PurchasableBadgeId;
    name: string;
    cost: number;
    icon: React.ComponentType<{ className?: string }>;
}

export interface UserProfile {
  id: number;
  name: string;
  age: number;
  city: string;
  profession: string;
  religion: string;
  height: string;
  profilePicture: string;
  bio: string;
  story: string;
  voiceProfileUrl?: string;
  voiceProfileTranscription?: string;
  photos: Photo[];
  prompts?: Prompt[];
  dynamicBadge?: DynamicBadge;
  partnerPreferences: {
    ageRange: string;
    religion: string;
    profession: string;
  };
  interestTags?: string[];
  points: number;
  ownedBadges?: PurchasableBadgeId[];
  equippedBadge?: PurchasableBadgeId;
}

export enum AIGeneratorType {
    BIO = 'BIO',
    STORY = 'STORY',
    CAPTION = 'CAPTION'
}

export interface CompatibilityReport {
  score: number;
  reasoning: string;
}

export interface MatchExplanation {
    headline: string;
    detailedReasoning: string;
}

export interface AIProfileReview {
  overallScore: number;
  bioFeedback: string;
  storyFeedback: string;
  photoFeedback: string;
}

export interface Message {
  senderId: number; // 0 for AI
  text?: string;
  audioUrl?: string;
  imageUrl?: string;
  timestamp: string; // ISO string
  isFlagged?: boolean;
  flaggedReason?: string;
  isRead?: boolean;
  revealReport?: BlindDateRevealReport;
}

export interface VibeCheckReport {
  harmonyScore: number;
  analysis: string;
  nextIcebreaker: string;
}

export interface VibeCheck {
  id: string; // unique ID for the check
  state: 'asking' | 'completed';
  question: string;
  responses: { [userId: number]: string }; // Store answers privately
  report?: VibeCheckReport;
  initiatedBy: number;
}

export interface TwoTruthsGame {
  id: string;
  state: 'guessing' | 'completed';
  initiatorId: number;
  guesserId: number;
  statements: string[];
  lieIndex: number;
  guess: number | null; // index of the guess
  aiCommentary?: string;
}

export interface ConnectionCrest {
    svgPaths: { d: string; fill: string; }[];
    description: string;
}

export interface SharedValue {
  value: string;
  reasoning: string;
  emoji: string;
}

export interface SharedMemory {
  id: string;
  title: string;
  description: string;
  emoji: string;
}

export interface RelationshipCheckIn {
  id: string;
  question: string;
  state: 'pending' | 'completed';
  responses: { [userId: number]: string };
}

export interface DateBucketListItem {
  id: string;
  title: string;
  description: string;
  suggestedBy: 'ai' | number; // user ID, or 'ai'
  votes: number[]; // User IDs who voted for this idea
  itinerary?: string;
}

export interface CoupleQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  responses: { [userId: number]: string }; // User's selected answer text
}

export interface CoupleQuiz {
  id: string;
  state: 'answering' | 'completed';
  questions: CoupleQuizQuestion[];
  initiatorId: number;
  aiCommentary?: string;
  scores: { [userId: number]: number };
}

export interface CoupleJournalPrompt {
  id: string;
  prompt: string;
  state: 'writing' | 'revealed';
  entries: { [userId: number]: string };
  aiInsight?: string;
}

export interface CoupleGoal {
  id: string;
  title: string;
  emoji: string;
  isComplete: boolean;
  suggestedBy: 'ai' | number; // user ID or 'ai'
}

export interface CoupleCanvas {
  unlocked: boolean;
  dateBucketList: DateBucketListItem[];
  dreamDatePromptFragments?: { userId: number; text: string; }[];
  dreamDateImage?: string; // base64 string
  checkIns?: RelationshipCheckIn[];
  sharedValues?: SharedValue[];
  quizzes?: CoupleQuiz[];
  journalPrompts?: CoupleJournalPrompt[];
  ourSongLyrics?: string;
  coupleGoals?: CoupleGoal[];
}

export interface VideoCallState {
  status: 'none' | 'requesting' | 'active' | 'ended';
  initiatorId?: number;
  duration?: number; // in seconds
}

export interface VideoCallReport {
  vibe: string;
  positiveMoments: string[];
  nextStepSuggestion: string;
}

export interface Conversation {
  id: string; // e.g., "1-2" for a chat between user 1 and 2
  participantIds: number[];
  messages: Message[];
  isSafeModeEnabled?: boolean;
  isBlindDate?: boolean;
  blindDateState?: 'active' | 'revealed';
  vibeCheck?: VibeCheck;
  twoTruthsGame?: TwoTruthsGame;
  connectionCrest?: ConnectionCrest;
  memories?: SharedMemory[];
  coupleCanvas?: CoupleCanvas;
  videoCallState?: VideoCallState;
  lastVideoCallReport?: VideoCallReport;
}

export interface ConnectionNudge {
    conversationId: string;
    suggestion: string;
    otherUserName: string;
}

export interface WebSource {
    uri: string;
    title: string;
}

export interface CoachQuickReply {
    text: string;
    action: 'open_modal' | 'send_message';
    payload: string; // modal name or message text
}

export interface CoachMessage {
    sender: 'user' | 'ai';
    text: string;
    isLoading?: boolean;
    sources?: WebSource[];
    quickReplies?: CoachQuickReply[];
}

export interface DateIdea {
  title: string;
  description: string;
  category: string; // e.g., "Casual", "Adventurous", "Creative", "Foodie"
}

export interface PersonalizedDateIdea {
  title: string;
  description: string;
  category: string;
  estimatedCost: string;
}

export interface DateVenue {
  name: string;
  description: string;
  address: string;
}

export interface DatePlan {
  venues: DateVenue[];
  sources: WebSource[];
}

export interface ConversationTopic {
  topic: string;
  reasoning: string;
}

export interface ChatAnalysis {
  vibe: string;
  vibeEmoji: string;
  keyTopics: string[];
  coachSuggestion: string;
  communicationStyles: {
    user1Style: string;
    user2Style: string;
    analysis: string;
  };
}

export interface QuizResult {
  profileTitle: string;
  analysis: string;
  tips: string[];
}

export interface DailyBriefing {
  profileTip: string;
  conversationStarter: string;
}

export interface PostDateAnalysis {
  vibe: string;
  vibeEmoji: string;
  greenFlags: string[];
  redFlags: string[];
  nextStepSuggestion: string;
}

export interface PhotoAnalysis {
  score: number;
  pros: string[];
  cons: string[];
}

export interface AIPhotoAnalysisReport {
    bestPhotoIndex: number;
    overallRecommendation: string;
    analyses: PhotoAnalysis[];
}

export interface SafetyAnalysisReport {
  isSafe: boolean;
  reason: string;
}

export interface TrustAndSafetyReport {
  score: number;
  reason:string;
}

export interface LiveCoachingTip {
  tip: string;
  category: 'OPPORTUNITY' | 'SUGGESTION' | 'ENCOURAGEMENT';
}

export interface ProactiveDateSuggestion {
  shouldSuggest: boolean;
  reason: string;
  suggestionText: string;
}

export interface AIFilterCriteria {
  keywords?: string[]; // General keywords, interests, personality traits
  professions?: string[];
  cities?: string[];
  religion?: string;
  minAge?: number;
  maxAge?: number;
}

export enum PracticeScenario {
    ICEBREAKER = 'Starting a conversation',
    ASKING_OUT = 'Asking for a first date',
    RELATIONSHIP_GOALS = 'Discussing relationship goals',
    DISAGREEMENT = 'Handling a disagreement',
}

export interface ConversationPracticeReport {
    whatWentWell: string[];
    thingsToConsider: string[];
    summary: string;
}

export interface BlindDateRevealReport {
  compatibilityScore: number;
  conversationHighlights: string[];
  sharedInterests: string[];
  nextIcebreaker: string;
}

export interface ConversationVibe {
    dominantVibe: 'Playful' | 'Deep' | 'Curious' | 'Warm' | 'Formal' | 'Neutral';
    intensity: number; // 0.0 to 1.0
    colorPalette: string[]; // array of 3 hex colors
}

export interface FirstMessageAuditReport {
  score: number;
  whatWorks: string[];
  suggestions: string[];
  alternatives: string[];
}

export enum FutureScenarioCategory {
  PLANNING = 'Planning Together',
  DREAMING = 'Dreaming Big',
  CHALLENGES = 'Navigating Challenges',
}

export interface FutureScenario {
    title: string;
    description: string;
    category: FutureScenarioCategory;
    persona: string;
    initialPrompt: string;
}

export interface FutureScenarioReport {
    keyTakeaways: string[];
    communicationStyle: string;
    collaborativeSpirit: string;
    summary: string;
}

export interface RelationshipNorthStarReport {
  title: string;
  coreDesire: string;
  guidingValues: string[];
  whatYouOffer: string;
  whatYouSeek: string;
}

export interface DatingPatternReport {
  attractionBlueprint: string;
  conversationFlow: string;
  unseenPattern: string;
  coachRecommendation: string;
}

export interface GiftIdea {
  name: string;
  description: string;
  reasoning: string;
  estimatedCost: string; // e.g., "$", "$$", "$$$"
}

export interface WeeklyGoal {
  title: string;
  description: string;
  emoji: string;
  featureTarget: 'CHATS' | 'COACH' | 'MATCHES' | 'PROFILE';
  isComplete: boolean;
}

export interface ProfileGlowUpSuggestion {
  type: 'BIO' | 'STORY' | 'PROMPT';
  promptQuestion?: string; // Only for type 'PROMPT'
  originalText: string;
  suggestedText: string;
  reason: string;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO string
  content: string;
}

export interface JournalAnalysisReport {
  keyThemes: string[];
  emotionalTrend: string;
  actionableInsight: string;
  datingConnectionInsight?: string;
}

export type WhatIfVibe = {
  name: string;
  emoji: string;
};

export interface WhatIfScenario {
  emoji: string;
  title: string;
  story: string;
  vibe?: WhatIfVibe;
}

export interface GuessTheVibeScenario {
  conversationSummary: string;
  correctVibe: string;
  vibeOptions: string[];
  otherProfileId: number;
}

export interface VibeWeaverChoice {
  text: string;
  trait: 'Adventurous' | 'Cautious' | 'Romantic' | 'Pragmatic' | 'Humorous' | 'Serious';
}

export interface VibeWeaverStorySegment {
  storyText: string;
  choices: [VibeWeaverChoice, VibeWeaverChoice];
}

export interface VibeWeaverReport {
    title: string; // e.g., "The Spontaneous Explorers"
    analysis: string;
    conversationStarter: string;
}

export interface PeaceKeeperReport {
  reframedMessage: string;
  talkingPoints: string[];
  partnerPerspective: string;
}

export interface FakeProfile {
    name: string;
    age: number;
    city: string;
    profession: string;
    bio: string;
    story: string;
    interestTags: string[];
    avatarPrompt: string;
}