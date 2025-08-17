
// src/app/meeting/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoGrid } from '@/components/VideoGrid';
import { MeetingControls } from '@/components/MeetingControls';
import { ParticipantList } from '@/components/ParticipantList';
import { Chat } from '@/components/Chat';
import { AIGenerateBackground } from '@/components/AIGenerateBackground';
import { usePathname, useRouter } from 'next/navigation';
import { useWebRTC, Message } from '@/hooks/use-webrtc';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { push, serverTimestamp } from 'firebase/database';

export default function MeetingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [background, setBackground] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const pathname = usePathname();
  const meetingId = pathname.split('/').pop()!;
  
  const currentStream = isSharingScreen ? screenStream : localStream;
  const { participants, toggleMedia, isHost, chatRef, listenForMessages, cleanup } = useWebRTC(meetingId, currentStream);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    let stream: MediaStream | null = null;
    const getMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setIsCameraOn(true);
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
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

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    }
  }, [user, toast]);
  
  const onMicToggle = () => {
    toggleMedia('audio');
    setIsMicOn(prev => !prev);
  }

  const onCameraToggle = async () => {
    if(localStream){
        localStream.getVideoTracks().forEach(track => {
            track.enabled = !isCameraOn;
        });
    }
    toggleMedia('video');
    setIsCameraOn(prev => !prev);
};


  const handleScreenShareToggle = async () => {
    if (isSharingScreen) {
      screenStream?.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsSharingScreen(false);
      
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsSharingScreen(true);
        stream.getVideoTracks()[0].onended = () => {
            setIsSharingScreen(false);
            setScreenStream(null);
        };
      } catch (err) {
        console.error("Error sharing screen:", err);
      }
    }
  };
  
   useEffect(() => {
    if (!chatRef) return;
    const unsubscribe = listenForMessages((newMessages) => {
        setMessages(newMessages);
    });
    return () => unsubscribe();
  }, [chatRef, listenForMessages]);

  const handleSendMessage = (content: string) => {
    if (!user || !chatRef) return;
    const message: Omit<Message, 'timestamp' | 'id'> = {
      senderId: user.uid,
      senderName: user.displayName || 'Anonymous',
      content: content,
    };
    const newMessageRef = push(chatRef);
    push(chatRef, {...message, timestamp: serverTimestamp()});
  };

  const handleLeaveMeeting = () => {
    cleanup();
    localStream?.getTracks().forEach(track => track.stop());
    screenStream?.getTracks().forEach(track => track.stop());
    router.push('/');
  }

  if (loading) return <div>Loading...</div>;
  if (!user) return null;
  
  const allParticipants = user ? [
      {
        id: user.uid,
        name: user.displayName || 'You',
        email: user.email || '',
        isMuted: !isMicOn,
        isCameraOn: isCameraOn,
        isSharingScreen: isSharingScreen
      },
      ...participants
    ] : participants;
    

  return (
    <div className="flex h-screen flex-col bg-card text-card-foreground">
      <header className="p-2 sm:p-4 flex justify-between items-center border-b">
        <h1 className="text-lg sm:text-xl font-bold font-headline truncate">Meeting: {meetingId}</h1>
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
          <div className="h-full relative bg-muted">
            <VideoGrid
                localStream={currentStream}
                participants={participants}
                isLocalCameraOn={isCameraOn}
                isLocalSharingScreen={isSharingScreen}
                userBackground={background}
            />
          </div>
          
          <div className="absolute bottom-0 left-0 w-full p-2 sm:p-4 flex justify-center items-center z-10">
            <MeetingControls
              isMicOn={isMicOn}
              isCameraOn={isCameraOn}
              isSharingScreen={isSharingScreen}
              onMicToggle={onMicToggle}
              onCameraToggle={onCameraToggle}
              onScreenShareToggle={handleScreenShareToggle}
              onLeaveMeeting={handleLeaveMeeting}
              onParticipantsToggle={() => setIsParticipantsOpen(prev => !prev)}
              onChatToggle={() => setIsChatOpen(prev => !prev)}
              onAIGeneratorToggle={() => setIsAIGeneratorOpen(prev => !prev)}
            />
          </div>
        </div>

        <ParticipantList isOpen={isParticipantsOpen} onClose={() => setIsParticipantsOpen(false)} participants={allParticipants} />
        <Chat open={isChatOpen} onOpenChange={setIsChatOpen} messages={messages} onSendMessage={handleSendMessage} currentUser={user}/>
        <AIGenerateBackground open={isAIGeneratorOpen} onOpenChange={setIsAIGeneratorOpen} onBackgroundGenerated={setBackground} />
      </main>
    </div>
  );
}
