import { Box, Text } from '@chakra-ui/react';
import { VoteResult } from '@/types/database';
import VoteChart from './VoteChart';

interface VoteResultsListProps {
  results: VoteResult[];
  winners: VoteResult[];
  votedCount: number;
}

export default function VoteResultsList({
  results,
  winners,
  votedCount,
}: VoteResultsListProps) {
  if (results.length === 0) {
    return (
      <Box bg="white" p={8} borderRadius="xl" shadow="md" textAlign="center">
        <Text color="gray.500" fontSize="lg">
          まだ投票がありません
        </Text>
      </Box>
    );
  }

  return (
    <VoteChart results={results} winners={winners} votedCount={votedCount} />
  );
}
