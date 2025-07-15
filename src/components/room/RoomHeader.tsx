import {
  Stack,
  Heading,
  Text,
  Badge,
} from '@chakra-ui/react';
import AppHeader from '@/components/AppHeader';

interface RoomHeaderProps {
  roomTitle: string;
  roomStatus: 'waiting' | 'voting' | 'completed';
  timeRemaining: string | null;
}

export default function RoomHeader({
  roomTitle,
  roomStatus,
  timeRemaining,
}: RoomHeaderProps) {
  return (
    <Stack gap={4} textAlign="center">
      <AppHeader size="lg" />

      <Heading size="xl">{roomTitle}</Heading>

      <Stack
        direction={{ base: 'column', md: 'row' }}
        gap={4}
        justify="center"
        align="center"
      >
        <Badge
          colorScheme={
            roomStatus === 'waiting'
              ? 'gray'
              : roomStatus === 'voting'
                ? 'yellow'
                : 'green'
          }
          p={2}
          borderRadius="md"
        >
          {roomStatus === 'waiting'
            ? '参加者募集中'
            : roomStatus === 'voting'
              ? '投票中'
              : '投票完了'}
        </Badge>

        {timeRemaining && (
          <Text
            fontSize="sm"
            color={timeRemaining === '期限切れ' ? 'red.500' : 'gray.600'}
          >
            残り時間: {timeRemaining}
          </Text>
        )}
      </Stack>
    </Stack>
  );
}