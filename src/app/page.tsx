// src/app/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth.tsx';

export default function Home() {
  const [meetingCode, setMeetingCode] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const createNewMeeting = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const newMeetingId = Math.random().toString(36).substring(2, 11);
    router.push(`/meeting/${newMeetingId}`);
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }
    if (meetingCode.trim()) {
      router.push(`/meeting/${meetingCode.trim()}`);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8 text-center">
          <h1 className="text-4xl font-bold font-headline">Dagu Meet</h1>
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                 <Button onClick={createNewMeeting} className="w-full sm:w-auto" size="lg" variant="default">
                  <Plus className="mr-2 h-5 w-5" />
                  New Meeting
                </Button>
                <div className="w-full h-px sm:w-px sm:h-8 bg-border mx-4"></div>
                <form onSubmit={joinMeeting} className="flex items-center gap-2 w-full sm:w-auto flex-grow">
                  <Input
                    type="text"
                    placeholder="Enter a code or link"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    className="flex-grow"
                  />
                  <Button type="submit" variant="secondary" disabled={!meetingCode.trim()} size="lg">
                    <LogIn className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Join</span>
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
