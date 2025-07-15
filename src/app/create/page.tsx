'use client';

import {
  Box,
  Stack,
  Text,
  Button,
  Input,
  Heading,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import AppHeader from '@/components/AppHeader';

export default function CreateRoom() {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{
    id: string;
    url: string;
    title: string;
  } | null>(null);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: title.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ルームの作成に失敗しました');
      }

      setCreatedRoom({
        id: data.room.id,
        url: data.url,
        title: data.room.title,
      });

      // 成功メッセージは画面遷移で代替
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'ルームの作成に失敗しました';
      setError(errorMessage);
      // エラーはsetErrorで表示
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!createdRoom) return;

    try {
      await navigator.clipboard.writeText(createdRoom.url);
      alert('URLをクリップボードにコピーしました');
    } catch {
      alert('コピーに失敗しました。URLを手動でコピーしてください');
    }
  };

  const goToRoom = () => {
    if (createdRoom) {
      router.push(`/rooms/${createdRoom.id}`);
    }
  };

  if (createdRoom) {
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
                      onClick={copyToClipboard}
                      flex="1"
                    >
                      URLをコピー
                    </Button>
                    <Button colorScheme="green" onClick={goToRoom} flex="1">
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

              <Button
                variant="outline"
                onClick={() => {
                  setCreatedRoom(null);
                  setTitle('');
                }}
              >
                新しいルームを作成
              </Button>
        </Stack>
      </PageLayout>
    );
  }

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
              <form onSubmit={handleSubmit}>
                <Stack gap={6}>
                  <Stack gap={2}>
                    <Text fontWeight="medium">ルームタイトル</Text>
                    <Input
                      value={title}
                      onChange={e => setTitle(e.target.value)}
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
