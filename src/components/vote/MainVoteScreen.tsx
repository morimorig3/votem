import { Stack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import VoteHeader from './VoteHeader';
import VoteInstructions from './VoteInstructions';
import ParticipantSelector from './ParticipantSelector';
import VoteActions from './VoteActions';
import { RoomData } from '@/types/database';

interface MainVoteScreenProps {
  roomId: string;
  roomData: RoomData;
  selectedParticipant: string | null;
  currentParticipantId: string | null;
  voterName: string;
  timeRemaining: string | null;
  isVoting: boolean;
  error?: string;
  onVote: () => void;
  onRandomSelection: () => void;
  onSelectParticipant: (participantId: string) => void;
}

export default function MainVoteScreen({
  roomId,
  roomData,
  selectedParticipant,
  currentParticipantId,
  voterName,
  timeRemaining,
  isVoting,
  error,
  onVote,
  onRandomSelection,
  onSelectParticipant,
}: MainVoteScreenProps) {
  const router = useRouter();

  const handleBackToRoom = () => {
    router.push(`/rooms/${roomId}`);
  };

  const handleViewResults = () => {
    router.push(`/rooms/${roomId}/results`);
  };

  return (
    <PageLayout maxWidth="4xl" padding={8}>
      <Stack gap={8}>
        <VoteHeader
          roomTitle={roomData.room.title}
          voterName={voterName}
          timeRemaining={timeRemaining}
        />

        <VoteInstructions />

        <ParticipantSelector
          participants={roomData.participants}
          selectedParticipantId={selectedParticipant}
          currentParticipantId={currentParticipantId}
          onSelectParticipant={onSelectParticipant}
          error={error}
        />

        <VoteActions
          isVoting={isVoting}
          hasSelectedParticipant={!!selectedParticipant}
          isTimeExpired={timeRemaining === '期限切れ'}
          onVote={onVote}
          onRandomSelection={onRandomSelection}
          onBackToRoom={handleBackToRoom}
          onViewResults={handleViewResults}
        />
      </Stack>
    </PageLayout>
  );
}