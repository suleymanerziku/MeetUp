import { ParticipantCard } from './ParticipantCard';

const participants = [
  { name: 'Alex Johnson', isMuted: true },
  { name: 'Maria Garcia', isCameraOff: true },
  { name: 'Chen Wei', isMuted: false },
  { name: 'Fatima Al-Fassi', isMuted: true, isCameraOff: true },
  { name: 'David Smith', isMuted: false },
];

type VideoGridProps = {
  isCameraOn: boolean;
  userBackground: string | null;
};

export function VideoGrid({ isCameraOn, userBackground }: VideoGridProps) {
  return (
    <div className="flex-1 p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 auto-rows-min overflow-auto">
      <ParticipantCard
        name="You"
        isCurrentUser={true}
        isCameraOff={!isCameraOn}
        background={userBackground}
        imageUrl={isCameraOn ? "https://placehold.co/800x600.png" : undefined}
        dataAiHint="person video call"
        className="sm:col-span-2 sm:row-span-2"
      />
      {participants.map((p) => (
        <ParticipantCard
          key={p.name}
          name={p.name}
          isMuted={p.isMuted}
          isCameraOff={p.isCameraOff}
          imageUrl={!p.isCameraOff ? "https://placehold.co/600x400.png" : undefined}
          dataAiHint="person video call"
        />
      ))}
    </div>
  );
}
