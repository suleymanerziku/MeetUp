// src/components/VideoGrid.tsx
import { useAuth } from '@/hooks/use-auth.tsx';
import { ParticipantCard } from './ParticipantCard';

interface Participant {
  id: string;
  name: string;
  email?: string;
  stream?: MediaStream;
  isMuted: boolean;
  isCameraOff: boolean;
  isSharingScreen: boolean;
}

type VideoGridProps = {
  localStream: MediaStream | null;
  participants: Participant[];
  isLocalCameraOn: boolean;
  isLocalSharingScreen: boolean;
  userBackground: string | null;
};

export function VideoGrid({ localStream, participants, isLocalCameraOn, isLocalSharingScreen, userBackground }: VideoGridProps) {
  const { user } = useAuth();

  return (
    <div className="flex-1 p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 auto-rows-min overflow-auto">
      {user && (
        <ParticipantCard
          name={user.displayName || "You"}
          email={user.email || undefined}
          isCurrentUser={true}
          isCameraOff={!isLocalCameraOn}
          isSharingScreen={isLocalSharingScreen}
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
          email={p.email}
          isMuted={p.isMuted}
          isCameraOff={p.isCameraOff}
          isSharingScreen={p.isSharingScreen}
          stream={p.stream}
          dataAiHint="person video call"
        />
      ))}
    </div>
  );
}
