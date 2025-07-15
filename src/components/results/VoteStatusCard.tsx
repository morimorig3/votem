import {
  Box,
  Stack,
  Heading,
  Text,
} from '@chakra-ui/react';
import { VoteStatus } from '@/types/database';

interface VoteStatusCardProps {
  voteStatus: VoteStatus;
  roomStatus: 'waiting' | 'voting' | 'completed';
}

export default function VoteStatusCard({
  voteStatus,
  roomStatus,
}: VoteStatusCardProps) {
  const progressPercentage = voteStatus.totalParticipants > 0
    ? (voteStatus.votedCount / voteStatus.totalParticipants) * 100
    : 0;

  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="sm">
      <Stack gap={4}>
        <Heading size="md">投票状況</Heading>
        <Stack gap={2}>
          <Stack direction="row" justify="space-between">
            <Text>投票者数</Text>
            <Text fontWeight="bold">
              {voteStatus.votedCount} / {voteStatus.totalParticipants} 人
            </Text>
          </Stack>
          <Box w="100%" bg="gray.200" borderRadius="md" height="8px">
            <Box
              bg="blue.500"
              height="100%"
              borderRadius="md"
              width={`${progressPercentage}%`}
              transition="width 0.3s ease"
            />
          </Box>
          {!voteStatus.isComplete && roomStatus === 'voting' && (
            <Text fontSize="sm" color="gray.600" textAlign="center">
              まだ投票していない人がいます
            </Text>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}