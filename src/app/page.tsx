// src/app/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Keyboard } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.tsx';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export default function Home() {
  const [meetingCode, setMeetingCode] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const createNewMeeting = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const newMeetingId = Math.random().toString(36).substring(2, 11);
    router.push(`/meeting/${newMeetingId}`);
  };

  const joinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    const code = meetingCode.trim();
    if (code) {
      const meetingRef = ref(db, `meetings/${code}`);
      const snapshot = await get(meetingRef);
      if (snapshot.exists()) {
        router.push(`/meeting/${code}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Meeting not found',
          description: 'Please check the code and try again.',
        });
      }
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          
          <div className="flex flex-col sm:flex-row w-full items-center gap-2 sm:gap-4">
            <Button onClick={createNewMeeting} size="lg" className="bg-primary hover:bg-primary/90 flex-shrink-0 px-4 rounded-full w-full sm:w-auto">
              <Video className="h-6 w-6" />
              <span className="ml-2">New Meeting</span>
            </Button>
            
            <form onSubmit={joinMeeting} className="relative flex-grow w-full">
               <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
               <Input
                type="text"
                placeholder="Enter a code or link"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                className="h-12 rounded-full pl-10 pr-24 sm:pr-28 bg-card border-border text-base"
              />
              <Button type="submit" variant="link" disabled={!meetingCode.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/80 text-lg font-medium hover:text-primary no-underline hover:no-underline disabled:no-underline disabled:text-muted-foreground/50">
                Join
              </Button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
