import {
  Box,
  Stack,
  Heading,
  Text,
  Badge,
} from '@chakra-ui/react';
import { Participant } from '@/types/database';

interface ParticipantsListProps {
  participants: Participant[];
  currentParticipant: string | null;
  votedParticipantIds: string[];
}

export default function ParticipantsList({
  participants,
  currentParticipant,
  votedParticipantIds,
}: ParticipantsListProps) {
  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="sm">
      <Stack gap={4}>
        <Heading size="md">
          参加者一覧 ({participants.length}人)
        </Heading>

        {participants.length === 0 ? (
          <Text color="gray.500" textAlign="center" py={8}>
            まだ参加者がいません
          </Text>
        ) : (
          <Stack gap={3}>
            {participants.map((participant, index) => (
              <Box
                key={participant.id}
                p={3}
                bg={
                  currentParticipant === participant.id
                    ? 'blue.50'
                    : 'gray.50'
                }
                borderRadius="md"
                border={
                  currentParticipant === participant.id
                    ? '2px solid'
                    : '1px solid'
                }
                borderColor={
                  currentParticipant === participant.id
                    ? 'blue.200'
                    : 'gray.200'
                }
              >
                <Stack
                  direction="row"
                  justify="space-between"
                  align="center"
                >
                  <Text fontWeight="medium">
                    {index + 1}. {participant.name}
                  </Text>
                  <Stack direction="row" gap={2}>
                    {currentParticipant === participant.id && (
                      <Badge colorScheme="blue" size="sm">
                        あなた
                      </Badge>
                    )}
                    {votedParticipantIds?.includes(participant.id) && (
                      <Badge colorScheme="green" size="sm">
                        投票済み
                      </Badge>
                    )}
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}