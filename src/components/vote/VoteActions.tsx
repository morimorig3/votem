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
  onBackToRoom: () => void;
  onViewResults: () => void;
}

export default function VoteActions({
  isVoting,
  hasSelectedParticipant,
  isTimeExpired,
  onVote,
  onRandomSelection,
  onBackToRoom,
  onViewResults,
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

      <Stack
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        textAlign="center"
      >
        <Button
          variant="outline"
          onClick={onBackToRoom}
          size="sm"
        >
          ルームに戻る
        </Button>

        <Button
          variant="ghost"
          onClick={onViewResults}
          size="sm"
        >
          途中結果を確認
        </Button>
      </Stack>
    </Stack>
  );
}