import { Box, Stack, Heading, Text, SimpleGrid } from '@chakra-ui/react';
import { Participant } from '@/types/database';

interface ParticipantSelectorProps {
  participants: Participant[];
  selectedParticipantId: string | null;
  onSelectParticipant: (participantId: string) => void;
  error?: string;
}

export default function ParticipantSelector({
  participants,
  selectedParticipantId,
  onSelectParticipant,
  error,
}: ParticipantSelectorProps) {
  return (
    <Stack gap={6}>
      <Heading size="md" textAlign="center">
        選択してください
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {participants.map(participant => (
          <Box
            key={participant.id}
            cursor="pointer"
            onClick={() => onSelectParticipant(participant.id)}
            bg={selectedParticipantId === participant.id ? 'blue.50' : 'white'}
            borderColor={
              selectedParticipantId === participant.id ? 'blue.300' : 'gray.200'
            }
            borderWidth="2px"
            borderRadius="lg"
            p={6}
            shadow="sm"
            _hover={{
              borderColor: 'blue.300',
              transform: 'translateY(-2px)',
              shadow: 'md',
            }}
            transition="all 0.2s"
          >
            <Text fontWeight="bold" fontSize="lg" textAlign="center">
              {participant.name}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      {error && (
        <Text color="red.500" textAlign="center" fontWeight="medium">
          {error}
        </Text>
      )}
    </Stack>
  );
}
