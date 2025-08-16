// src/components/ParticipantCard.tsx
"use client";

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { MicOff, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type ParticipantCardProps = {
  name: string;
  email?: string; // Add email to props
  isMuted?: boolean;
  isCameraOff?: boolean;
  isCurrentUser?: boolean;
  background?: string | null;
  stream?: MediaStream;
  dataAiHint?: string;
  className?: string;
};

export function ParticipantCard({
  name,
  email,
  isMuted = false,
  isCameraOff = false,
  isCurrentUser = false,
  background,
  stream,
  dataAiHint,
  className,
}: ParticipantCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const containerStyle = isCurrentUser && background ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
  const showAvatar = isCameraOff || !stream;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Card className={cn("relative aspect-video w-full overflow-hidden bg-muted/30 flex items-center justify-center group rounded-lg shadow-md", className)}>
      <div className="absolute inset-0 transition-all duration-300" style={containerStyle}>
        <video 
            ref={videoRef} 
            className={cn("w-full h-full object-cover", { 'hidden': showAvatar || (isCurrentUser && background) })} 
            autoPlay 
            playsInline 
            muted={isCurrentUser}
        />
      </div>

      {showAvatar && (
        <div className="z-10 flex flex-col items-center gap-2 text-muted-foreground">
          <Avatar className="w-16 h-16 sm:w-24 sm:h-24 border-2 border-background">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${email || name}`} alt={name} />
            <AvatarFallback>
              <User className="w-8 h-8 sm:w-12 sm:h-12" />
            </AvatarFallback>
          </Avatar>
          <p className="font-medium text-background bg-black/30 px-2 py-1 rounded-md">{name}</p>
        </div>
      )}

       {!isCurrentUser && background && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
        {isMuted && <MicOff className="h-4 w-4" />}
        <span>{name}</span>
      </div>
    </Card>
  );
}
