"use client";

import { useState } from 'react';
import { VideoGrid } from '@/components/VideoGrid';
import { MeetingControls } from '@/components/MeetingControls';
import { ParticipantList } from '@/components/ParticipantList';
import { AIGenerateBackground } from '@/components/AIGenerateBackground';
import { usePathname } from 'next/navigation';

export default function MeetingPage() {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [background, setBackground] = useState<string | null>(null);

  const pathname = usePathname();
  const meetingId = pathname.split('/').pop();

  return (
    <div className="flex h-screen flex-col bg-card text-card-foreground">
      <header className="p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold font-headline">Meeting: {meetingId}</h1>
      </header>
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col relative">
          <VideoGrid isCameraOn={isCameraOn} userBackground={background} />
          <MeetingControls
            isMicOn={isMicOn}
            isCameraOn={isCameraOn}
            onMicToggle={() => setIsMicOn(p => !p)}
            onCameraToggle={() => setIsCameraOn(p => !p)}
            onParticipantsToggle={() => setIsParticipantsOpen(p => !p)}
            onAIGeneratorToggle={() => setIsAIGeneratorOpen(p => !p)}
          />
        </div>
        <ParticipantList open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen} />
      </main>
      <AIGenerateBackground 
        open={isAIGeneratorOpen} 
        onOpenChange={setIsAIGeneratorOpen}
        onBackgroundGenerated={setBackground} 
      />
    </div>
  );
}
