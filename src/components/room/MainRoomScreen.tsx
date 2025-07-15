import { Stack, SimpleGrid, Box } from '@chakra-ui/react';
import { FormEvent } from 'react';
import PageLayout from '@/components/PageLayout';
import RoomHeader from './RoomHeader';
import ParticipantsList from './ParticipantsList';
import JoinRoomForm from './JoinRoomForm';
import VotingActions from './VotingActions';
import JoinInstructions from './JoinInstructions';
import { RoomData } from '@/types/database';

interface MainRoomScreenProps {
  roomData: RoomData;
  timeRemaining: string | null;
  currentParticipant: string | null;
  newParticipantName: string;
  setNewParticipantName: (name: string) => void;
  onJoinRoom: (e: FormEvent) => void;
  error: string | null;
  isJoining: boolean;
  isStartingVoting: boolean;
  isCurrentParticipantVoted: boolean;
  onStartVoting: () => void;
  onJoinVoting: () => void;
  onViewResults: () => void;
}

export default function MainRoomScreen({
  roomData,
  timeRemaining,
  currentParticipant,
  newParticipantName,
  setNewParticipantName,
  onJoinRoom,
  error,
  isJoining,
  isStartingVoting,
  isCurrentParticipantVoted,
  onStartVoting,
  onJoinVoting,
  onViewResults,
}: MainRoomScreenProps) {
  return (
    <PageLayout maxWidth="4xl" padding={8}>
      <Stack gap={8}>
        <RoomHeader
          roomTitle={roomData.room.title}
          roomStatus={roomData.room.status}
          timeRemaining={timeRemaining}
        />

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
          <Box bg="white" p={6} borderRadius="lg" shadow="sm">
            <Stack gap={6}>
              {!currentParticipant ? (
                <JoinRoomForm
                  newParticipantName={newParticipantName}
                  setNewParticipantName={setNewParticipantName}
                  onJoinRoom={onJoinRoom}
                  error={error}
                  isJoining={isJoining}
                  roomStatus={roomData.room.status}
                />
              ) : (
                <VotingActions
                  roomStatus={roomData.room.status}
                  participantCount={roomData.participants.length}
                  isStartingVoting={isStartingVoting}
                  isCurrentParticipantVoted={isCurrentParticipantVoted}
                  onStartVoting={onStartVoting}
                  onJoinVoting={onJoinVoting}
                  onViewResults={onViewResults}
                />
              )}

              <JoinInstructions />
            </Stack>
          </Box>

          <ParticipantsList
            participants={roomData.participants}
            currentParticipant={currentParticipant}
            votedParticipantIds={roomData.votedParticipantIds || []}
          />
        </SimpleGrid>
      </Stack>
    </PageLayout>
  );
}
