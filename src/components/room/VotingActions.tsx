import {
  Stack,
  Heading,
  Text,
  Button,
} from '@chakra-ui/react';

interface VotingActionsProps {
  roomStatus: 'waiting' | 'voting' | 'completed';
  participantCount: number;
  isStartingVoting: boolean;
  isCurrentParticipantVoted: boolean;
  onStartVoting: () => void;
  onJoinVoting: () => void;
  onViewResults: () => void;
}

export default function VotingActions({
  roomStatus,
  participantCount,
  isStartingVoting,
  isCurrentParticipantVoted,
  onStartVoting,
  onJoinVoting,
  onViewResults,
}: VotingActionsProps) {
  return (
    <>
      <Heading size="md">投票アクション</Heading>
      <Stack gap={4}>
        {roomStatus === 'waiting' && (
          <Button
            colorScheme="green"
            size="lg"
            w="100%"
            onClick={onStartVoting}
            disabled={participantCount < 2}
            loading={isStartingVoting}
            loadingText="投票を開始中..."
          >
            投票を開始する
          </Button>
        )}

        {roomStatus === 'voting' && !isCurrentParticipantVoted && (
          <Button
            colorScheme="yellow"
            size="lg"
            w="100%"
            onClick={onJoinVoting}
          >
            投票に参加する
          </Button>
        )}

        {roomStatus === 'voting' && isCurrentParticipantVoted && (
          <Button
            colorScheme="blue"
            size="lg"
            w="100%"
            onClick={onViewResults}
          >
            投票結果を確認する
          </Button>
        )}

        {roomStatus === 'completed' && (
          <Button
            colorScheme="blue"
            size="lg"
            w="100%"
            onClick={onViewResults}
          >
            結果を確認する
          </Button>
        )}

        {participantCount < 2 &&
          roomStatus === 'waiting' && (
            <Text color="gray.500" fontSize="sm" textAlign="center">
              投票には最低2人の参加者が必要です
            </Text>
          )}
      </Stack>
    </>
  );
}