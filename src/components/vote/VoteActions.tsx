import { Stack, Button } from '@chakra-ui/react';

interface VoteActionsProps {
  isVoting: boolean;
  hasSelectedParticipant: boolean;
  isTimeExpired: boolean;
  onVote: () => void;
  onRandomSelection: () => void;
  onAddParticipant: () => void;
}

export default function VoteActions({
  isVoting,
  hasSelectedParticipant,
  isTimeExpired,
  onVote,
  onRandomSelection,
  onAddParticipant,
}: VoteActionsProps) {
  return (
    <Stack gap={6} align="center">
      <Stack direction={{ base: 'column', md: 'row' }} gap={4} align="center">
        <Button
          size="lg"
          minW="240px"
          minH="50px"
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
          size="lg"
          minW="240px"
          minH="50px"
          px={12}
          py={6}
          fontSize="lg"
          onClick={onRandomSelection}
          disabled={isTimeExpired}
        >
          ランダム選択
        </Button>
        <Button
          colorScheme="gray"
          size="lg"
          minW="240px"
          minH="50px"
          px={12}
          py={6}
          fontSize="lg"
          onClick={onAddParticipant}
          disabled={isTimeExpired}
        >
          参加者を追加
        </Button>
      </Stack>
    </Stack>
  );
}
