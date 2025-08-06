import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, AIGeneratorType, Photo, Prompt, DynamicBadgeType, WhatIfScenario, WhatIfVibe, Conversation } from '../types';
import { Button } from './Button';
import { ArrowLeftIcon, EditIcon, SparklesIcon, CameraIcon, HeartIcon, HeartOutlineIcon, PaperAirplaneIcon, MicrophoneIcon, TrashIcon, PlayCircleIcon, PauseCircleIcon, TrophyIcon, ShieldCheckIcon, CloseIcon, ExclamationTriangleIcon, ChatBubbleBottomCenterTextIcon, PencilIcon, CameraSparklesIcon, BookHeartIcon } from './IconComponents';
import { AIGeneratorModal } from './AIGeneratorModal';
import { EditProfileModal } from './EditProfileModal';
import { generateAIContentFromImage, generateProfileSummary, generateWhatIfScenario } from '../services/geminiService';
import { AIReviewModal } from './AIReviewModal';
import { ProfileCompleteness } from './ProfileCompleteness';
import { AIAvatarGeneratorModal } from './AIAvatarGeneratorModal';
import { VoiceProfileRecorderModal } from './VoiceProfileRecorderModal';
import { InterestTagsSection } from './InterestTagsSection';
import { PromptSection } from './PromptSection';
import { EditPromptsModal } from './EditPromptsModal';
import { AIInsights } from './AIInsights';
import { AIProfileGlowUpModal } from './AIProfileGlowUpModal';
import { WhatIfModal } from './WhatIfModal';
import { getBadgeById } from './GameView';
import { PhotoGlowUpModal } from './PhotoGlowUpModal';
import { CoupleComicGeneratorModal } from './CoupleComicGeneratorModal';

interface ProfileDetailProps {
  profile: UserProfile;
  currentUser: UserProfile;
  onBack: () => void;
  onUpdateProfile: (id: number, updates: Partial<UserProfile>) => void;
  onUpdatePhoto: (profileId: number, photoId: number, updates: {caption: string}) => void;
  onAddPhoto: (profileId: number, photo: { url: string; caption: string; }) => void;
  isLiked: boolean;
  onLikeToggle: (id: number) => void;
  onStartChat: (profile: UserProfile) => void;
  conversations: Conversation[];
  allProfiles: UserProfile[];
  onShareComic: (otherUserId: number, imageBase64: string) => void;
}

type SummaryState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; summary: string }
    | { status: 'error'; error: string };

type WhatIfState = 
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; scenario: WhatIfScenario }
    | { status: 'error'; error: string; vibe: WhatIfVibe };
    
type ActiveModalState =
  | { name: 'closed' }
  | { name: 'aiGenerator'; config: { type: AIGeneratorType; photo?: Photo } }
  | { name: 'editProfile'; section: 'basic' | 'preferences' }
  | { name: 'aiReview' }
  | { name: 'aiAvatar' }
  | { name: 'voiceRecorder' }
  | { name: 'editPrompts' }
  | { name: 'aiGlowUp' }
  | { name: 'whatIf' }
  | { name: 'photoGlowUp'; photo: Photo }
  | { name: 'coupleComic' };
  
type ActiveTab = 'about' | 'story' | 'photos' | 'details';

const VIBES: WhatIfVibe[] = [
  { name: 'Cozy Cafe', emoji: '☕' },
  { name: 'Movie Meet-Cute', emoji: '🎬' },
  { name: 'Spontaneous Adventure', emoji: '✈️' },
  { name: 'Bookstore Romance', emoji: '📚' },
];

const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors duration-200
            ${isActive
                ? 'border-rose-gold text-rose-gold'
                : 'border-transparent text-slate-500 hover:text-deep-teal hover:border-slate-300'
            }
        `}
    >
        {label}
    </button>
);


const VoicePlayer: React.FC<{ url: string; transcription: string; name: string; isMyProfile: boolean; }> = ({ url, transcription, name, isMyProfile }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };
    
    const formatTime = (seconds: number) => {
        const floorSeconds = Math.floor(seconds);
        const m = Math.floor(floorSeconds / 60);
        const s = floorSeconds % 60;
        if (isNaN(m) || isNaN(s)) return '0:00';
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => setIsPlaying(false);
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onLoadedMetadata = () => setDuration(audio.duration);

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);

        // Reset player state when the URL changes.
        setIsPlaying(false);
        setCurrentTime(0);

        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        }
    }, [url]);
    
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const progressBar = e.currentTarget;
        const clickPosition = e.clientX - progressBar.getBoundingClientRect().left;
        const percentage = clickPosition / progressBar.offsetWidth;
        const newTime = duration * percentage;
        audioRef.current.currentTime = newTime;
    };

    const progress = (currentTime / duration) || 0;

    return (
        <div className="space-y-4">
            <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
            <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="text-rose-gold hover:text-rose-gold/80 transition-colors flex-shrink-0">
                    {isPlaying ? <PauseCircleIcon className="w-16 h-16"/> : <PlayCircleIcon className="w-16 h-16"/>}
                </button>
                <div className="flex-1">
                    <h4 className="font-semibold text-deep-teal">Voice Introduction</h4>
                    <p className="text-sm text-slate-500">Listen to {isMyProfile ? 'your' : `${name}'s`} voice and get to know them better.</p>
                     <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-slate-500 font-mono w-12 text-center">{formatTime(currentTime)}</span>
                        <div 
                            className="w-full h-4 bg-transparent cursor-pointer group relative flex items-center"
                            onClick={handleSeek}
                        >
                            <div className="w-full h-2 bg-slate-200 rounded-full">
                                <div 
                                    className="h-2 bg-rose-gold rounded-full"
                                    style={{ width: `${progress * 100}%` }}
                                ></div>
                            </div>
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-rose-gold shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ left: `${progress * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-sm text-slate-500 font-mono w-12 text-center">{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
            <div>
                <h5 className="font-semibold text-deep-teal mb-2">AI Transcription:</h5>
                <p className="text-slate-600 bg-cream/50 p-3 rounded-lg border border-dusty-rose/30 italic">"{transcription}"</p>
            </div>
        </div>
    );
};

const ProfileBadge: React.FC<{badge?: UserProfile['dynamicBadge']}> = ({ badge }) => {
    if (!badge) return null;
    
    const badgeIcons: Record<DynamicBadgeType, React.ReactNode> = {
        GREAT_CHATTER: <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-rose-gold" />,
        PROMPT_PRO: <PencilIcon className="w-8 h-8 text-rose-gold" />,
        VERIFIED_PROFILER: <ShieldCheckIcon className="w-8 h-8 text-rose-gold" />,
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold font-serif text-deep-teal mb-4">Achievements</h3>
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-2 bg-rose-gold/10 rounded-full">
                    {badgeIcons[badge.type]}
                </div>
                <div>
                    <h4 className="font-bold text-lg text-deep-teal">{badge.text}</h4>
                    <p className="text-slate-600 text-sm">{badge.description}</p>
                </div>
            </div>
        </div>
    )
}


export const ProfileDetail: React.FC<ProfileDetailProps> = ({ profile, currentUser, onBack, onUpdateProfile, onUpdatePhoto, onAddPhoto, isLiked, onLikeToggle, onStartChat, conversations, allProfiles, onShareComic }) => {
  const [activeModal, setActiveModal] = useState<ActiveModalState>({ name: 'closed' });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [summaryState, setSummaryState] = useState<SummaryState>({ status: 'idle' });
  const [whatIfState, setWhatIfState] = useState<WhatIfState>({ status: 'idle' });
  const [activeTab, setActiveTab] = useState<ActiveTab>('about');
  const [isVibePopoverOpen, setIsVibePopoverOpen] = useState(false);
  const vibeButtonRef = useRef<HTMLDivElement>(null);
  
  const isMyProfile = profile.id === currentUser.id;

  useEffect(() => {
    setSummaryState({ status: 'idle' });
    setWhatIfState({ status: 'idle' });
    setActiveTab('about');
  }, [profile.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (vibeButtonRef.current && !vibeButtonRef.current.contains(event.target as Node)) {
            setIsVibePopoverOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [vibeButtonRef]);

  const handleUpdate = (field: 'bio' | 'story') => (content: string) => {
    onUpdateProfile(profile.id, { [field]: content });
  };
  
  const handleCaptionUpdate = (photoId: number) => (caption: string) => {
    onUpdatePhoto(profile.id, photoId, { caption });
  };
  
  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    onUpdateProfile(profile.id, updates);
  };

  const handlePhotoUpdate = (photoId: number, newUrl: string) => {
    const newPhotos = profile.photos.map(p => p.id === photoId ? {...p, url: newUrl} : p);
    onUpdateProfile(profile.id, { photos: newPhotos });
  };
  
  const handlePromptsUpdate = (prompts: Prompt[]) => {
    onUpdateProfile(profile.id, { prompts });
  };

   const handleUpdatePromptAnswer = (question: string, newAnswer: string) => {
        const newPrompts = profile.prompts?.map(p =>
            p.question === question ? { ...p, answer: newAnswer } : p
        ) || [];
        onUpdateProfile(profile.id, { prompts: newPrompts });
    };

  const handleAvatarUpdate = (base64Image: string) => {
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;
    onUpdateProfile(profile.id, { profilePicture: imageUrl });
  };

  const handleVoiceUpdate = (data: { voiceProfileUrl: string, voiceProfileTranscription: string}) => {
    onUpdateProfile(profile.id, data);
  };

  const handleDeleteVoiceProfile = () => {
      if (window.confirm("Are you sure you want to delete your voice profile?")) {
          onUpdateProfile(profile.id, { voiceProfileUrl: undefined, voiceProfileTranscription: undefined });
      }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleGenerateSummary = async () => {
    setSummaryState({ status: 'loading' });
    try {
      const result = await generateProfileSummary(profile);
      setSummaryState({ status: 'success', summary: result });
    } catch (error) {
      console.error("Failed to generate summary", error);
      setSummaryState({ status: 'error', error: "Sorry, the AI couldn't generate a summary. Please try again later." });
    }
  };

  const handleGenerateWhatIf = async (vibe: WhatIfVibe) => {
    setIsVibePopoverOpen(false);
    setActiveModal({ name: 'whatIf' });
    setWhatIfState({ status: 'loading' });
    try {
      const scenario = await generateWhatIfScenario(currentUser, profile, vibe);
      setWhatIfState({ status: 'success', scenario });
    } catch (error) {
      console.error("Failed to generate What If scenario", error);
      setWhatIfState({ status: 'error', error: "The AI couldn't imagine a story right now. Maybe your connection is too unique! Please try again.", vibe });
    }
  };
  
  const handleRetryWhatIf = () => {
    if (whatIfState.status === 'success' && whatIfState.scenario.vibe) {
        handleGenerateWhatIf(whatIfState.scenario.vibe);
    } else if (whatIfState.status === 'error') {
        handleGenerateWhatIf(whatIfState.vibe);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLikeToggle(profile.id);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = (reader.result as string)?.split(',')[1];
      if (base64String) {
        try {
          const generatedCaption = await generateAIContentFromImage(base64String, file.type);
          const photoUrl = URL.createObjectURL(file);
          onAddPhoto(profile.id, { url: photoUrl, caption: generatedCaption });
        } catch (error) {
          console.error("Upload and captioning failed", error);
          const photoUrl = URL.createObjectURL(file);
          onAddPhoto(profile.id, { url: photoUrl, caption: "My new photo! Feel free to edit this caption." });
        } finally {
          setIsUploading(false);
        }
      } else {
        console.error("Failed to read file as base64");
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      setIsUploading(false);
    };
    event.target.value = '';
  };

  const renderActiveModal = () => {
    switch (activeModal.name) {
      case 'closed':
        return null;
      case 'coupleComic':
        return (
            <CoupleComicGeneratorModal
                onClose={() => setActiveModal({ name: 'closed' })}
                currentUser={currentUser}
                conversations={conversations}
                allProfiles={allProfiles}
                onShare={onShareComic}
                preselectedProfile={profile}
            />
        );
      case 'photoGlowUp':
        return isMyProfile ? <PhotoGlowUpModal
            photo={activeModal.photo}
            onClose={() => setActiveModal({ name: 'closed' })}
            onSave={(newUrl) => {
                handlePhotoUpdate(activeModal.photo.id, newUrl);
                setActiveModal({ name: 'closed' });
            }}
        /> : null;
      case 'whatIf':
        return (
          <WhatIfModal
            onClose={() => setActiveModal({ name: 'closed' })}
            onRetry={handleRetryWhatIf}
            isLoading={whatIfState.status === 'loading'}
            error={whatIfState.status === 'error' ? whatIfState.error : null}
            scenario={whatIfState.status === 'success' ? whatIfState.scenario : null}
          />
        );
      case 'aiGlowUp':
        return isMyProfile ? <AIProfileGlowUpModal
            profile={profile}
            onClose={() => setActiveModal({ name: 'closed' })}
            onUpdateProfile={handleProfileUpdate}
            onUpdatePrompt={handleUpdatePromptAnswer}
        /> : null;
      case 'editPrompts':
        return isMyProfile ? <EditPromptsModal 
          profile={profile} 
          onClose={() => setActiveModal({ name: 'closed' })} 
          onSave={handlePromptsUpdate} 
        /> : null;
      case 'voiceRecorder':
        return isMyProfile ? <VoiceProfileRecorderModal onClose={() => setActiveModal({ name: 'closed' })} onSave={handleVoiceUpdate} /> : null;
      case 'aiAvatar':
        return isMyProfile ? <AIAvatarGeneratorModal onClose={() => setActiveModal({ name: 'closed' })} onSave={handleAvatarUpdate} /> : null;
      case 'aiReview':
        return isMyProfile ? <AIReviewModal profile={profile} onClose={() => setActiveModal({ name: 'closed' })} /> : null;
      case 'editProfile':
        return isMyProfile ? <EditProfileModal profile={profile} section={activeModal.section} onClose={() => setActiveModal({ name: 'closed' })} onSave={handleProfileUpdate} /> : null;
      case 'aiGenerator':
        if (!isMyProfile) return null;
        const { type, photo } = activeModal.config;
        return (
          <AIGeneratorModal
            type={type}
            onClose={() => setActiveModal({ name: 'closed' })}
            onSave={
              type === AIGeneratorType.BIO ? handleUpdate('bio') :
              type === AIGeneratorType.STORY ? handleUpdate('story') :
              photo ? handleCaptionUpdate(photo.id) :
              () => {}
            }
            initialKeywords={
              type === AIGeneratorType.BIO ? 'adventurous, kind, love reading' :
              type === AIGeneratorType.STORY ? 'Grew up in a small town, values family, looking for a meaningful connection' :
              'A happy picture at a sunny beach'
            }
            title={
               type === AIGeneratorType.BIO ? 'AI Bio Writer' :
               type === AIGeneratorType.STORY ? 'AI Story Writer' :
               'AI Caption Writer'
            }
            description={
               type === AIGeneratorType.BIO ? 'Enter a few keywords about yourself, and let our AI write a beautiful bio for you.' :
               type === AIGeneratorType.STORY ? 'Share some notes about your life, values, or goals, and our AI will craft a compelling story.' :
               'Describe the photo and let AI suggest some catchy captions. Pick your favorite!'
            }
            placeholder={
               type === AIGeneratorType.BIO ? 'e.g., foodie, loves dogs, software engineer, enjoys hiking' :
               type === AIGeneratorType.STORY ? 'e.g., My family is important to me, I work hard...' :
               'e.g., Me smiling at a cafe in Paris'
            }
          />
        );
      default:
        return null;
    }
  };
  
  const DetailSection: React.FC<{ title: string; onEdit?: () => void; children: React.ReactNode; className?: string }> = ({ title, onEdit, children, className }) => (
    <div className={className}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold font-serif text-deep-teal">{title}</h3>
            {onEdit && (
                <Button variant="ghost" onClick={onEdit} leftIcon={<EditIcon />}>Edit</Button>
            )}
        </div>
        <div className="text-slate-700 space-y-2">
            {children}
        </div>
    </div>
);

  const equippedBadgeData = profile.equippedBadge ? getBadgeById(profile.equippedBadge) : null;
  const EquippedBadgeIcon = equippedBadgeData ? equippedBadgeData.icon : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {renderActiveModal()}
      
      <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeftIcon />} className="mb-6">Back to Matches</Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-md text-center">
             <div className="relative inline-block">
                <img src={profile.profilePicture} alt={profile.name} className="w-40 h-40 rounded-full mx-auto object-cover border-4 border-white shadow-lg" />
                {isMyProfile && (
                    <button
                        onClick={() => setActiveModal({ name: 'aiAvatar'})}
                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-full cursor-pointer group"
                        aria-label="Generate AI Avatar"
                    >
                        <SparklesIcon className="w-8 h-8 mb-1 transition-transform transform group-hover:scale-110"/>
                        <span className="font-semibold text-sm">AI Avatar</span>
                    </button>
                )}
            </div>
            <div className="flex justify-center items-center gap-2 mt-4">
                <h2 className="text-3xl font-bold font-serif text-deep-teal">{profile.name}</h2>
                {EquippedBadgeIcon && (
                    <div title={equippedBadgeData!.name}>
                        <div className="bg-gradient-to-br from-yellow-300 to-amber-500 p-1 rounded-full shadow-lg">
                            <EquippedBadgeIcon className="w-8 h-8 text-white" />
                        </div>
                    </div>
                )}
                {!isMyProfile && (
                    <button
                        onClick={handleLikeClick}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                        className="p-2 rounded-full hover:bg-rose-gold/10 transition-colors duration-200 transform hover:scale-110 active:scale-95"
                    >
                        {isLiked ? <HeartIcon className="w-7 h-7 text-rose-gold" /> : <HeartOutlineIcon className="w-7 h-7 text-deep-teal/60" />}
                    </button>
                )}
            </div>
            <p className="text-slate-500">{profile.profession}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                {!isMyProfile ? (
                    <>
                        <Button onClick={() => onStartChat(profile)} leftIcon={<PaperAirplaneIcon className="w-5 h-5"/>}>
                            Start Chat
                        </Button>
                        <Button onClick={() => setActiveModal({ name: 'coupleComic' })} leftIcon={<BookHeartIcon className="w-5 h-5"/>} variant="secondary">
                            Create Comic
                        </Button>
                        <div className="relative" ref={vibeButtonRef}>
                            <Button onClick={() => setIsVibePopoverOpen(p => !p)} leftIcon={<SparklesIcon className="w-5 h-5"/>} variant="secondary">
                                What If...?
                            </Button>
                            {isVibePopoverOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-30 p-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <p className="text-sm font-semibold text-deep-teal px-2 py-1">Choose a vibe:</p>
                                    <ul className="space-y-1">
                                        {VIBES.map(vibe => (
                                            <li key={vibe.name}>
                                                <button 
                                                    onClick={() => handleGenerateWhatIf(vibe)}
                                                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700"
                                                >
                                                    <span className="text-lg">{vibe.emoji}</span>
                                                    <span>{vibe.name}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Button onClick={() => setActiveModal({ name: 'aiGlowUp' })} leftIcon={<SparklesIcon className="w-5 h-5"/>}>
                            AI Glow-Up
                        </Button>
                        <Button onClick={() => setActiveModal({ name: 'aiReview' })} leftIcon={<SparklesIcon className="w-5 h-5"/>} variant="secondary">
                            Get AI Profile Review
                        </Button>
                    </>
                )}
            </div>
          </div>

          <ProfileBadge badge={profile.dynamicBadge} />

          {isMyProfile && (
            <ProfileCompleteness
              profile={profile}
              onEditBio={() => setActiveModal({ name: 'aiGenerator', config: { type: AIGeneratorType.BIO } })}
              onEditStory={() => setActiveModal({ name: 'aiGenerator', config: { type: AIGeneratorType.STORY } })}
              onAddPhoto={handleUploadClick}
            />
          )}
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <DetailSection title="Basic Info" onEdit={isMyProfile ? () => setActiveModal({ name: 'editProfile', section: 'basic' }) : undefined}>
                <p><strong>Age:</strong> {profile.age}</p>
                <p><strong>Height:</strong> {profile.height}</p>
                <p><strong>City:</strong> {profile.city}</p>
                <p><strong>Religion:</strong> {profile.religion}</p>
            </DetailSection>

            <DetailSection title="Looking For" onEdit={isMyProfile ? () => setActiveModal({ name: 'editProfile', section: 'preferences' }) : undefined} className="mt-8">
                <p><strong>Age:</strong> {profile.partnerPreferences.ageRange}</p>
                <p><strong>Religion:</strong> {profile.partnerPreferences.religion}</p>
                <p><strong>Profession:</strong> {profile.partnerPreferences.profession}</p>
            </DetailSection>
          </div>
          
          {!isMyProfile && (
            <AIInsights currentUser={currentUser} profile={profile} />
          )}

        </div>

        {/* Right Column with Tabs */}
        <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <TabButton label="About" isActive={activeTab === 'about'} onClick={() => setActiveTab('about')} />
                        <TabButton label="Story" isActive={activeTab === 'story'} onClick={() => setActiveTab('story')} />
                        <TabButton label="Photos" isActive={activeTab === 'photos'} onClick={() => setActiveTab('photos')} />
                        <TabButton label="Details" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
                    </nav>
                </div>
                <div className="pt-6">
                    {activeTab === 'about' && (
                        <div>
                            <DetailSection title="About Me" onEdit={isMyProfile ? () => setActiveModal({ name: 'aiGenerator', config: { type: AIGeneratorType.BIO } }) : undefined}>
                                <p className="whitespace-pre-wrap">{profile.bio}</p>
                                <div className="mt-4 pt-4 border-t border-slate-200/60">
                                    {(() => {
                                        switch (summaryState.status) {
                                            case 'loading':
                                                return (
                                                    <div className="p-4 bg-cream/60 rounded-lg border border-dusty-rose/30 animate-pulse">
                                                        <h4 className="font-semibold text-deep-teal mb-3 flex items-center gap-2">
                                                            <SparklesIcon className="w-5 h-5 text-rose-gold"/>
                                                            AI is summarizing...
                                                        </h4>
                                                        <div className="space-y-2">
                                                            <div className="h-4 bg-slate-300 rounded w-full"></div>
                                                            <div className="h-4 bg-slate-300 rounded w-full"></div>
                                                            <div className="h-4 bg-slate-300 rounded w-5/6"></div>
                                                        </div>
                                                    </div>
                                                );
                                            case 'success':
                                                return (
                                                    <div className="p-4 bg-cream/60 rounded-lg border border-dusty-rose/30">
                                                        <h4 className="font-semibold text-deep-teal mb-2 flex items-center gap-2">
                                                            <SparklesIcon className="w-5 h-5 text-rose-gold"/>
                                                            AI-Powered Summary
                                                        </h4>
                                                        <p className="text-slate-700 whitespace-pre-wrap">{summaryState.summary}</p>
                                                    </div>
                                                );
                                            case 'error':
                                                return (
                                                    <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg">
                                                        <div className="flex items-start gap-3">
                                                            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                                                            <div>
                                                                <h4 className="font-bold">Summary Failed</h4>
                                                                <p className="text-sm mt-1">{summaryState.error}</p>
                                                                <Button 
                                                                    variant="secondary" 
                                                                    onClick={handleGenerateSummary} 
                                                                    className="!text-red-700 !border-red-500 hover:!bg-red-100 mt-3"
                                                                >
                                                                    Try Again
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            case 'idle':
                                            default:
                                                return (
                                                    <div className="text-center">
                                                        <Button 
                                                            variant="secondary" 
                                                            onClick={handleGenerateSummary} 
                                                            leftIcon={<SparklesIcon className="w-5 h-5"/>}
                                                            className="w-full"
                                                        >
                                                            Get AI Summary
                                                        </Button>
                                                    </div>
                                                );
                                        }
                                    })()}
                                </div>
                            </DetailSection>
                        </div>
                    )}
                    {activeTab === 'story' && (
                        <DetailSection title="My Story" onEdit={isMyProfile ? () => setActiveModal({ name: 'aiGenerator', config: { type: AIGeneratorType.STORY } }) : undefined}>
                            <p className="whitespace-pre-wrap">{profile.story}</p>
                        </DetailSection>
                    )}
                    {activeTab === 'photos' && (
                         <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold font-serif text-deep-teal">My Photos</h3>
                                {isMyProfile && (
                                    <div className="flex items-center gap-2">
                                    <Button variant="ghost" leftIcon={<CameraIcon className="w-5 h-5"/>} onClick={handleUploadClick} disabled={isUploading}>
                                        {isUploading ? 'Uploading...' : 'Upload'}
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/png, image/jpeg"
                                        disabled={isUploading}
                                    />
                                    </div>
                                )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {profile.photos.map(photo => (
                                    <div key={photo.id} className="group relative rounded-lg overflow-hidden">
                                        <img src={photo.url} alt={photo.caption} className="w-full h-64 object-cover" />
                                        <div className="absolute top-0 left-0 w-full h-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                                            {isMyProfile && (
                                                <>
                                                    <button
                                                        onClick={() => setActiveModal({ name: 'aiGenerator', config: { type: AIGeneratorType.CAPTION, photo } })}
                                                        className="flex flex-col items-center text-white hover:text-rose-gold transition-colors"
                                                        title="AI Caption Writer"
                                                    >
                                                        <SparklesIcon className="w-8 h-8"/>
                                                        <span className="text-xs font-semibold mt-1">AI Caption</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveModal({ name: 'photoGlowUp', photo })}
                                                        className="flex flex-col items-center text-white hover:text-rose-gold transition-colors"
                                                        title="AI Photo Glow-Up"
                                                    >
                                                        <CameraSparklesIcon className="w-8 h-8"/>
                                                        <span className="text-xs font-semibold mt-1">Glow-Up</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 pointer-events-none">
                                            <p className="text-white text-sm">{photo.caption}</p>
                                        </div>
                                    </div>
                                ))}
                                {isUploading && isMyProfile && (
                                    <div className="group relative rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center h-64 border-2 border-dashed border-dusty-rose">
                                        <div className="text-center p-4">
                                            <SparklesIcon className="w-10 h-10 text-rose-gold mx-auto animate-pulse" />
                                            <p className="mt-2 text-deep-teal font-semibold">Our AI is writing a caption...</p>
                                            <p className="text-sm text-slate-500">Just a moment!</p>
                                        </div>
                                    </div>
                                )}
                                </div>
                        </div>
                    )}
                    {activeTab === 'details' && (
                        <div className="space-y-8">
                            <PromptSection 
                                prompts={profile.prompts || []}
                                isMyProfile={isMyProfile}
                                onEdit={() => setActiveModal({ name: 'editPrompts' })}
                            />
                            <InterestTagsSection
                                profile={profile}
                                isMyProfile={isMyProfile}
                                onUpdateProfile={onUpdateProfile}
                            />
                            <DetailSection title="Voice Introduction">
                                {profile.voiceProfileUrl && profile.voiceProfileTranscription ? (
                                    <>
                                        <VoicePlayer url={profile.voiceProfileUrl} transcription={profile.voiceProfileTranscription} name={profile.name} isMyProfile={isMyProfile} />
                                        {isMyProfile && (
                                            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                                                <Button variant="secondary" onClick={() => setActiveModal({ name: 'voiceRecorder' })}>Re-record</Button>
                                                <Button variant="ghost" onClick={handleDeleteVoiceProfile} aria-label="Delete voice profile">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : isMyProfile ? (
                                    <div className="text-center py-4">
                                        <p className="text-slate-600 mb-4">Add a voice intro to make your profile stand out and let your personality shine through!</p>
                                        <Button onClick={() => setActiveModal({ name: 'voiceRecorder' })} leftIcon={<MicrophoneIcon />}>Add Voice Profile</Button>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic text-center py-4">This user hasn't recorded a voice introduction yet.</p>
                                )}
                            </DetailSection>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
