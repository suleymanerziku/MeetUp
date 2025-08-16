// src/components/ParticipantList.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, User } from 'lucide-react';

type Participant = {
    name: string;
    email?: string;
    isMuted: boolean;
    isCameraOn: boolean;
}

type ParticipantListProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: Participant[];
};

export function ParticipantList({ open, onOpenChange, participants }: ParticipantListProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-headline">Participants ({participants.length})</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {participants.map((p) => (
            <div key={p.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${p.email || p.name}`} />
                  <AvatarFallback><User /></AvatarFallback>
                </Avatar>
                <span className="font-medium">{p.name}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                {p.isCameraOn ? <Video className="h-5 w-5 text-green-500" /> : <VideoOff className="h-5 w-5 text-destructive" />}
                {p.isMuted ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
