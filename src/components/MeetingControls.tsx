// src/components/MeetingControls.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, ScreenShare, Users, Wand2, PhoneOff, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type MeetingControlsProps = {
  isMicOn: boolean;
  isCameraOn: boolean;
  isSharingScreen: boolean;
  isHost: boolean;
  onMicToggle: () => void;
  onCameraToggle: () => void;
  onScreenShareToggle: () => void;
  onParticipantsToggle: () => void;
  onChatToggle: () => void;
  onAIGeneratorToggle: () => void;
  onEndCall: () => void;
};

export function MeetingControls({
  isMicOn,
  isCameraOn,
  isSharingScreen,
  isHost,
  onMicToggle,
  onCameraToggle,
  onScreenShareToggle,
  onParticipantsToggle,
  onChatToggle,
  onAIGeneratorToggle,
  onEndCall,
}: MeetingControlsProps) {

  const controlButtonClasses = "rounded-full w-14 h-14 transition-all duration-300 ease-in-out transform hover:scale-110";

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center">
      <div className="flex items-center gap-2 sm:gap-4 bg-card/60 backdrop-blur-md p-3 rounded-full shadow-lg border">
        <Button
          variant={isMicOn ? 'secondary' : 'destructive'}
          size="icon"
          className={cn(controlButtonClasses)}
          onClick={onMicToggle}
          aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
        </Button>
        <Button
          variant={isCameraOn ? 'secondary' : 'destructive'}
          size="icon"
          className={cn(controlButtonClasses)}
          onClick={onCameraToggle}
          aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
        </Button>
        <Button 
            variant={isSharingScreen ? 'default' : 'secondary'}
            size="icon" 
            className={cn(controlButtonClasses)} 
            aria-label="Share screen"
            onClick={onScreenShareToggle}
        >
          <ScreenShare className="h-6 w-6" />
        </Button>
        <Button variant="secondary" size="icon" className={cn(controlButtonClasses)} onClick={onChatToggle} aria-label="Open chat">
          <MessageSquare className="h-6 w-6" />
        </Button>
        <Button variant="secondary" size="icon" className={cn(controlButtonClasses)} onClick={onParticipantsToggle} aria-label="Show participants">
          <Users className="h-6 w-6" />
        </Button>
        <Button variant="secondary" size="icon" className={cn(controlButtonClasses, "bg-accent/20 hover:bg-accent/40")} onClick={onAIGeneratorToggle} aria-label="Generate AI background">
          <Wand2 className="h-6 w-6 text-accent-foreground" />
        </Button>
        
        <div className="w-px h-8 bg-border mx-2"></div>
        <Button variant="destructive" size="icon" className="rounded-full w-16 h-14" onClick={onEndCall} aria-label="End call">
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
