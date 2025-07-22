import { Stack, Heading, Text, Badge } from '@chakra-ui/react';
import AppHeader from '@/components/AppHeader';

interface ResultsHeaderProps {
  roomTitle: string;
  roomStatus: 'waiting' | 'voting' | 'completed';
  timeRemaining: string | null;
  voteStatus?: {
    isComplete: boolean;
  };
}

export default function ResultsHeader({
  roomTitle,
  roomStatus,
  timeRemaining,
  voteStatus,
}: ResultsHeaderProps) {
  // 投票完了状況を考慮した実際のステータスを決定
  const getActualStatus = () => {
    if (voteStatus?.isComplete || timeRemaining === '期限切れ') {
      return 'completed';
    }
    return roomStatus;
  };

  const actualStatus = getActualStatus();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return '参加者募集中';
      case 'voting':
        return '投票中';
      case 'completed':
        return '投票完了';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'gray';
      case 'voting':
        return 'yellow';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Stack gap={4} textAlign="center">
      <AppHeader />

      <Heading size="xl">{roomTitle}</Heading>

      <Stack
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        justify="center"
        align="center"
      >
        <Badge
          colorScheme={getStatusColor(actualStatus)}
          p={2}
          borderRadius="md"
        >
          {getStatusLabel(actualStatus)}
        </Badge>

        {timeRemaining && (
          <Text
            fontSize="sm"
            color={timeRemaining === '期限切れ' ? 'red.500' : 'gray.600'}
          >
            ルームの有効時間: {timeRemaining}
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
