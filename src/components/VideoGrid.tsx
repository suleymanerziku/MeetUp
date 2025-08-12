// src/components/VideoGrid.tsx
import { useAuth } from '@/hooks/use-auth.tsx';
import { ParticipantCard } from './ParticipantCard';

interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  isMuted: boolean;
  isCameraOff: boolean;
}

type VideoGridProps = {
  localStream: MediaStream | null;
  participants: Participant[];
  isLocalCameraOn: boolean;
  userBackground: string | null;
};

export function VideoGrid({ localStream, participants, isLocalCameraOn, userBackground }: VideoGridProps) {
  const { user } = useAuth();

  return (
    <div className="flex-1 p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 auto-rows-min overflow-auto">
      {user && (
        <ParticipantCard
          name={user.displayName || "You"}
          isCurrentUser={true}
          isCameraOff={!isLocalCameraOn}
          background={userBackground}
          stream={localStream || undefined}
          dataAiHint="person video call"
          className="sm:col-span-2 sm:row-span-2"
        />
      )}
      {participants.map((p) => (
        <ParticipantCard
          key={p.id}
          name={p.name}
          isMuted={p.isMuted}
          isCameraOff={p.isCameraOff}
          stream={p.stream}
          dataAiHint="person video call"
        />
      ))}
    </div>
  );
}
