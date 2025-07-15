'use client';

import {
  Box,
  Stack,
  Text,
  Button,
  Input,
  Heading,
} from '@chakra-ui/react';
import Link from 'next/link';
import PageLayout from './PageLayout';
import AppHeader from './AppHeader';

interface CreateRoomScreenProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: string;
  isLoading: boolean;
}

export default function CreateRoomScreen({
  title,
  onTitleChange,
  onSubmit,
  error,
  isLoading,
}: CreateRoomScreenProps) {
  return (
    <PageLayout maxWidth="lg" padding={20}>
      <Stack gap={8}>
        <Stack gap={4} textAlign="center">
          <AppHeader size="xl" />
          <Heading size="lg">投票ルームを作成</Heading>
          <Text color="gray.600">
            投票の内容がわかるタイトルを入力してください
          </Text>
        </Stack>

        <Box bg="white" p={6} borderRadius="lg" shadow="sm" w="100%">
          <form onSubmit={onSubmit}>
            <Stack gap={6}>
              <Stack gap={2}>
                <Text fontWeight="medium">ルームタイトル</Text>
                <Input
                  value={title}
                  onChange={e => onTitleChange(e.target.value)}
                  placeholder="例: 今日の掃除当番を決めよう"
                  size="lg"
                  maxLength={100}
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
                loading={isLoading}
                loadingText="作成中..."
                disabled={!title.trim()}
              >
                ルームを作成
              </Button>
            </Stack>
          </form>
        </Box>

        <Stack gap={4} textAlign="center">
          <Text fontSize="sm" color="gray.500">
            • 登録不要・無料で利用できます
            <br />
            • ルームは30分後に自動削除されます
            <br />• 最大50人まで参加可能です
          </Text>

          <Link href="/">
            <Text
              color="blue.500"
              cursor="pointer"
              _hover={{ textDecoration: 'underline' }}
            >
              ← ホームに戻る
            </Text>
          </Link>
        </Stack>
      </Stack>
    </PageLayout>
  );
}