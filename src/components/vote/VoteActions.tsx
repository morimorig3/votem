import {
  Stack,
  Button,
} from '@chakra-ui/react';

interface VoteActionsProps {
  isVoting: boolean;
  hasSelectedParticipant: boolean;
  isTimeExpired: boolean;
  onVote: () => void;
  onRandomSelection: () => void;
}

export default function VoteActions({
  isVoting,
  hasSelectedParticipant,
  isTimeExpired,
  onVote,
  onRandomSelection,
}: VoteActionsProps) {
  return (
    <Stack gap={6} align="center">
      <Stack gap={4} align="center">
        <Button
          colorScheme="blue"
          size="lg"
          px={12}
          py={6}
          fontSize="lg"
          onClick={onVote}
          loading={isVoting}
          loadingText="投票中..."
          disabled={!hasSelectedParticipant || isTimeExpired}
        >
          この人に投票する
        </Button>

        <Button
          colorScheme="green"
          size="lg"
          px={12}
          py={6}
          fontSize="lg"
          onClick={onRandomSelection}
          disabled={isTimeExpired}
        >
          ランダム選択
        </Button>
      </Stack>
    </Stack>
  );
}