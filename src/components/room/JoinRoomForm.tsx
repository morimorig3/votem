import {
  Stack,
  Heading,
  Text,
  Input,
  Button,
} from '@chakra-ui/react';
import { FormEvent } from 'react';

interface JoinRoomFormProps {
  newParticipantName: string;
  setNewParticipantName: (name: string) => void;
  onJoinRoom: (e: FormEvent) => void;
  error: string | null;
  isJoining: boolean;
  roomStatus: 'waiting' | 'voting' | 'completed';
}

export default function JoinRoomForm({
  newParticipantName,
  setNewParticipantName,
  onJoinRoom,
  error,
  isJoining,
  roomStatus,
}: JoinRoomFormProps) {
  return (
    <>
      <Heading size="md">ルームに参加</Heading>
      <form onSubmit={onJoinRoom}>
        <Stack gap={4}>
          <Stack gap={2}>
            <Text fontWeight="medium">あなたの名前</Text>
            <Input
              value={newParticipantName}
              onChange={e => setNewParticipantName(e.target.value)}
              placeholder="例: 田中太郎"
              size="lg"
              maxLength={50}
            />
            {error && (
              <Text color="red.500" fontSize="sm">
                {error}
              </Text>
            )}
          </Stack>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            w="100%"
            loading={isJoining}
            loadingText="参加中..."
            disabled={
              !newParticipantName.trim() ||
              roomStatus !== 'waiting'
            }
          >
            参加する
          </Button>
        </Stack>
      </form>
    </>
  );
}