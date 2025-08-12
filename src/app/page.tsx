"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LogIn } from 'lucide-react';

export default function Home() {
  const [meetingCode, setMeetingCode] = useState('');
  const router = useRouter();

  const createNewMeeting = () => {
    const newMeetingId = Math.random().toString(36).substring(2, 11);
    router.push(`/meeting/${newMeetingId}`);
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingCode.trim()) {
      router.push(`/meeting/${meetingCode.trim()}`);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-headline sm:text-4xl">
              High-quality video calls.
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Secure, simple, and reliable video conferencing for everyone.
            </p>
          </div>
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-headline">Start or join a meeting</CardTitle>
              <CardDescription>
                Create a new meeting room or enter a code to join one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={createNewMeeting} className="w-full" size="lg" variant="default">
                <Plus className="mr-2 h-5 w-5" />
                New Meeting
              </Button>
              <form onSubmit={joinMeeting} className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Enter a code or link"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="flex-grow"
                />
                <Button type="submit" variant="secondary" disabled={!meetingCode.trim()}>
                  <LogIn className="h-5 w-5" />
                  <span className="sr-only">Join</span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
