import { Stack, Button, Text } from '@chakra-ui/react';

interface ResultsActionsProps {
  isComplete: boolean;
  roomStatus: 'waiting' | 'voting' | 'completed';
  isTimeExpired: boolean;
  isRestarting: boolean;
  onRestartVoting: () => void;
}

export default function ResultsActions({
  isComplete,
  roomStatus,
  isTimeExpired,
  isRestarting,
  onRestartVoting,
}: ResultsActionsProps) {
  return (
    <Stack gap={4} align="center">
      {isComplete && (
        <Button
          colorScheme="blue"
          size="lg"
          onClick={onRestartVoting}
          loading={isRestarting}
          loadingText="やり直し中..."
          disabled={isTimeExpired}
        >
          投票をやり直す
        </Button>
      )}

      {!isComplete && roomStatus === 'voting' && (
        <Text fontSize="sm" color="gray.600" textAlign="center">
          結果はリアルタイムで自動更新されます
        </Text>
      )}
    </Stack>
  );
}
