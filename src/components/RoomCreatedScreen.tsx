'use client';

import {
  Box,
  Stack,
  Text,
  Button,
  Heading,
} from '@chakra-ui/react';
import PageLayout from './PageLayout';

interface CreatedRoom {
  id: string;
  url: string;
  title: string;
}

interface RoomCreatedScreenProps {
  createdRoom: CreatedRoom;
  onCopyToClipboard: () => void;
  onGoToRoom: () => void;
  onCreateNewRoom: () => void;
}

export default function RoomCreatedScreen({
  createdRoom,
  onCopyToClipboard,
  onGoToRoom,
  onCreateNewRoom,
}: RoomCreatedScreenProps) {
  return (
    <PageLayout maxWidth="2xl" padding={20}>
      <Stack gap={8}>
        <Stack gap={4} textAlign="center">
          <Heading size="lg" color="blue.500">
            ルームを作成しました！
          </Heading>
          <Text color="gray.600">
            URLをチームメンバーに共有して、参加者を募集しましょう
          </Text>
        </Stack>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" w="100%">
          <Stack gap={6}>
            <Stack gap={2} w="100%">
              <Text fontWeight="bold">ルーム名</Text>
              <Text fontSize="lg" textAlign="center">
                {createdRoom.title}
              </Text>
            </Stack>

            <Stack gap={2} w="100%">
              <Text fontWeight="bold">共有URL</Text>
              <Box
                p={3}
                bg="gray.100"
                borderRadius="md"
                w="100%"
                wordBreak="break-all"
                fontSize="sm"
              >
                {createdRoom.url}
              </Box>
            </Stack>

            <Stack
              direction={{ base: 'column', md: 'row' }}
              gap={4}
              w="100%"
            >
              <Button
                colorScheme="blue"
                onClick={onCopyToClipboard}
                flex="1"
              >
                URLをコピー
              </Button>
              <Button colorScheme="green" onClick={onGoToRoom} flex="1">
                ルームに入る
              </Button>
            </Stack>

            <Box
              p={4}
              bg="blue.50"
              borderRadius="md"
              borderLeft="4px solid"
              borderColor="blue.500"
            >
              <Text fontWeight="bold" color="blue.700" mb={2}>
                重要！
              </Text>
              <Text color="blue.600" fontSize="sm">
                このルームは30分後に自動削除されます。時間内に投票を完了してください。
              </Text>
            </Box>
          </Stack>
        </Box>

        <Button variant="outline" onClick={onCreateNewRoom}>
          新しいルームを作成
        </Button>
      </Stack>
    </PageLayout>
  );
}