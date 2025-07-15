import { Stack } from '@chakra-ui/react';
import PageLayout from '@/components/PageLayout';
import VoteHeader from './VoteHeader';
import VoteInstructions from './VoteInstructions';
import ParticipantSelector from './ParticipantSelector';
import VoteActions from './VoteActions';
import { RoomData } from '@/types/database';

interface MainVoteScreenProps {
  roomData: RoomData;
  selectedParticipant: string | null;
  timeRemaining: string | null;
  isVoting: boolean;
  error?: string;
  onVote: () => void;
  onRandomSelection: () => void;
  onSelectParticipant: (participantId: string) => void;
}

export default function MainVoteScreen({
  roomData,
  selectedParticipant,
  timeRemaining,
  isVoting,
  error,
  onVote,
  onRandomSelection,
  onSelectParticipant,
}: MainVoteScreenProps) {
  return (
    <PageLayout maxWidth="4xl" padding={8}>
      <Stack gap={8}>
        <VoteHeader
          roomTitle={roomData.room.title}
          timeRemaining={timeRemaining}
        />

        <ParticipantSelector
          participants={roomData.participants}
          selectedParticipantId={selectedParticipant}
          onSelectParticipant={onSelectParticipant}
          error={error}
        />

        <VoteActions
          isVoting={isVoting}
          hasSelectedParticipant={!!selectedParticipant}
          isTimeExpired={timeRemaining === '期限切れ'}
          onVote={onVote}
          onRandomSelection={onRandomSelection}
        />
        <VoteInstructions />
      </Stack>
    </PageLayout>
  );
}
