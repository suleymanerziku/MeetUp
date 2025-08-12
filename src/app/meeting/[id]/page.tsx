"use client";

import { useState, useEffect, useRef } from 'react';
import { VideoGrid } from '@/components/VideoGrid';
import { MeetingControls } from '@/components/MeetingControls';
import { ParticipantList } from '@/components/ParticipantList';
import { AIGenerateBackground } from '@/components/AIGenerateBackground';
import { usePathname, useRouter } from 'next/navigation';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MeetingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [background, setBackground] = useState<string | null>(null);

  const pathname = usePathname();
  const meetingId = pathname.split('/').pop()!;
  
  const { participants, toggleMedia } = useWebRTC(meetingId, localStream);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing media devices.', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Media Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings.',
        });
      }
    };
    if(user) getMedia();
  }, [user, toast]);

  const onMicToggle = () => {
    toggleMedia('audio');
    setIsMicOn(prev => !prev);
  }

  const onCameraToggle = () => {
    toggleMedia('video');
    setIsCameraOn(prev => !prev);
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return null;
  
  return (
    <div className="flex h-screen flex-col bg-card text-card-foreground">
      <header className="p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold font-headline">Meeting: {meetingId}</h1>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative">
          {hasCameraPermission === false && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertTitle>Camera and Mic Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera and microphone access to use this feature.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <VideoGrid 
            localStream={localStream}
            participants={participants}
            isLocalCameraOn={isCameraOn} 
            userBackground={background} 
          />
          <MeetingControls
            isMicOn={isMicOn}
            isCameraOn={isCameraOn}
            onMicToggle={onMicToggle}
            onCameraToggle={onCameraToggle}
            onParticipantsToggle={() => setIsParticipantsOpen(p => !p)}
            onAIGeneratorToggle={() => setIsAIGeneratorOpen(p => !p)}
          />
        </div>
        <ParticipantList open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen} participants={[
            { name: user.displayName || 'You', isMuted: !isMicOn, isCameraOn: isCameraOn },
            ...participants.map(p => ({name: p.name, isMuted: p.isMuted, isCameraOn: !p.isCameraOff}))
        ]}/>
      </main>
      <AIGenerateBackground 
        open={isAIGeneratorOpen} 
        onOpenChange={setIsAIGeneratorOpen}
        onBackgroundGenerated={setBackground} 
      />
    </div>
  );
}
