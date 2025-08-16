// src/components/MeetingControls.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, ScreenShare, Users, Wand2, PhoneOff, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type MeetingControlsProps = {
  isMicOn: boolean;
  isCameraOn: boolean;
  isSharingScreen: boolean;
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onScreenShareToggle: () => void;
  onParticipantsToggle: () => void;
  onChatToggle: () => void;
  onAIGeneratorToggle: () => void;
  onLeaveMeeting: () => void;
};

export function MeetingControls({
  isMicOn,
  isCameraOn,
  isSharingScreen,
  onMicToggle,
  onCameraToggle,
  onScreenShareToggle,
  onParticipantsToggle,
  onChatToggle,
  onAIGeneratorToggle,
  onLeaveMeeting,
}: MeetingControlsProps) {

  const controlButtonClasses = "rounded-full w-12 h-12 sm:w-14 sm:h-14 transition-all duration-300 ease-in-out transform hover:scale-110";

  return (
    <div className="flex items-center flex-wrap justify-center gap-2 sm:gap-4 bg-card/60 backdrop-blur-md p-2 sm:p-3 rounded-full shadow-lg border">
      <Button
        variant={isMicOn ? 'secondary' : 'destructive'}
        size="icon"
        className={cn(controlButtonClasses)}
        onClick={onMicToggle}
        aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <Button
        variant={isCameraOn ? 'secondary' : 'destructive'}
        size="icon"
        className={cn(controlButtonClasses)}
        onClick={onCameraToggle}
        aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {isCameraOn ? <Video className="h-5 w-5 sm:h-6 sm:w-6" /> : <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" />}
      </Button>
      <Button 
          variant={isSharingScreen ? 'default' : 'secondary'}
          size="icon" 
          className={cn(controlButtonClasses)} 
          aria-label="Share screen"
          onClick={onScreenShareToggle}
      >
        <ScreenShare className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <Button variant="secondary" size="icon" className={cn(controlButtonClasses)} onClick={onChatToggle} aria-label="Open chat">
        <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <Button variant="secondary" size="icon" className={cn(controlButtonClasses)} onClick={onParticipantsToggle} aria-label="Show participants">
        <Users className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <Button variant="secondary" size="icon" className={cn(controlButtonClasses, "bg-accent/20 hover:bg-accent/40")} onClick={onAIGeneratorToggle} aria-label="Generate AI background">
        <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 text-accent-foreground" />
      </Button>
      
      <div className="w-px h-8 bg-border mx-1 sm:mx-2"></div>
      <Button variant="destructive" size="icon" className="rounded-full w-14 h-12 sm:w-16 sm:h-14" onClick={onLeaveMeeting} aria-label="End call">
        <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    </div>
  );
}
