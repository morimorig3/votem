import { Stack, Text } from '@chakra-ui/react';
import { VoteStatus } from '@/types/database';

interface VoteStatusCardProps {
  voteStatus: VoteStatus;
  roomStatus: 'waiting' | 'voting' | 'completed';
}

export default function VoteStatusCard({
  voteStatus,
  roomStatus,
}: VoteStatusCardProps) {
  const remainingVotes = voteStatus.totalParticipants - voteStatus.votedCount;

  return (
    <Stack alignItems="center">
      <Text fontSize="md" color="gray.700">
        投票済み: {voteStatus.votedCount} / {voteStatus.totalParticipants}
      </Text>
      {!voteStatus.isComplete &&
        roomStatus === 'voting' &&
        remainingVotes > 0 && (
          <Text fontSize="sm" color="orange.600" mt={1}>
            残り{remainingVotes}人の投票待ち
          </Text>
        )}
      {voteStatus.isComplete && (
        <Text fontSize="sm" color="green.600" mt={1}>
          ✅ 全員の投票が完了しました
        </Text>
      )}
    </Stack>
  );
}
