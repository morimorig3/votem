import {
  Stack,
  Heading,
  Text,
  Badge,
} from '@chakra-ui/react';
import AppHeader from '@/components/AppHeader';

interface VoteHeaderProps {
  roomTitle: string;
  voterName: string;
  timeRemaining: string | null;
}

export default function VoteHeader({
  roomTitle,
  voterName,
  timeRemaining,
}: VoteHeaderProps) {
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
        <Badge colorScheme="yellow" p={2} borderRadius="md">
          投票中
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

      <Text color="gray.600">
        投票者:{' '}
        <Text as="span" fontWeight="bold" color="blue.600">
          {voterName}
        </Text>
      </Text>
    </Stack>
  );
}