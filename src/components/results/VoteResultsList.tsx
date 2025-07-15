import {
  Box,
  Stack,
  Heading,
  Text,
  Badge,
} from '@chakra-ui/react';
import { VoteResult } from '@/types/database';

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
  // 得票率を計算
  const getVotePercentage = (voteCount: number) => {
    if (!votedCount || votedCount === 0) return 0;
    return Math.round((voteCount / votedCount) * 100);
  };

  // 順位を取得
  const getRank = (index: number, voteCount: number, results: VoteResult[]) => {
    let rank = 1;
    for (let i = 0; i < index; i++) {
      if (results[i].vote_count > voteCount) {
        rank++;
      }
    }
    return rank;
  };

  return (
    <Stack gap={6}>
      <Heading size="md" textAlign="center">
        投票結果
      </Heading>

      {results.length === 0 ? (
        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          shadow="sm"
          textAlign="center"
        >
          <Text color="gray.500">まだ投票がありません</Text>
        </Box>
      ) : (
        <Stack gap={4}>
          {results.map((result, index) => {
            const percentage = getVotePercentage(result.vote_count);
            const rank = getRank(index, result.vote_count, results);
            const isWinner = winners.some(w => w.id === result.id);

            return (
              <Box
                key={result.id}
                bg="white"
                p={6}
                borderRadius="lg"
                shadow="sm"
                border={isWinner ? '3px solid' : '1px solid'}
                borderColor={isWinner ? 'gold' : 'gray.200'}
                position="relative"
              >
                {isWinner && (
                  <Badge
                    position="absolute"
                    top="-12px"
                    left="20px"
                    colorScheme="yellow"
                    fontSize="sm"
                    px={3}
                    py={1}
                  >
                    🏆 当選
                  </Badge>
                )}

                <Stack gap={3}>
                  <Stack
                    direction="row"
                    justify="space-between"
                    align="center"
                  >
                    <Stack direction="row" align="center" gap={3}>
                      <Badge
                        colorScheme="gray"
                        fontSize="md"
                        px={2}
                        py={1}
                      >
                        {rank}位
                      </Badge>
                      <Text fontSize="xl" fontWeight="bold">
                        {result.name}
                      </Text>
                    </Stack>

                    <Stack textAlign="right" gap={1}>
                      <Text
                        fontSize="2xl"
                        fontWeight="bold"
                        color="blue.600"
                      >
                        {result.vote_count}票
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        ({percentage}%)
                      </Text>
                    </Stack>
                  </Stack>

                  {votedCount > 0 && (
                    <Box
                      w="100%"
                      bg="gray.200"
                      borderRadius="md"
                      height="6px"
                    >
                      <Box
                        bg={isWinner ? 'yellow.400' : 'blue.500'}
                        height="100%"
                        borderRadius="md"
                        width={`${percentage}%`}
                        transition="width 0.3s ease"
                      />
                    </Box>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}