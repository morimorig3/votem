'use client';

import { Stack, Text, Button, Box, Heading, Grid } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import AppHeader from '@/components/AppHeader';
import ClientOnly from '@/components/ClientOnly';

export default function Home() {
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push('/create');
  };

  return (
    <ClientOnly fallback={<div>Loading...</div>}>
      <PageLayout maxWidth="4xl" padding={20}>
        <Stack gap={12}>
          {/* ヘッダー */}
          <Stack gap={6} textAlign="center">
            <AppHeader isShowTitle />
          </Stack>

          {/* CTA */}
          <Stack gap={4} align="center">
            <Button
              colorScheme="blue"
              size="lg"
              px={12}
              py={6}
              fontSize="lg"
              onClick={handleCreateRoom}
            >
              投票ルームを作成
            </Button>
          </Stack>
          {/* 使い方 */}
          <Box bg="white" p={6} borderRadius="lg" shadow="sm" w="100%">
            <Stack gap={4} align="start">
              <Heading size="md">使い方</Heading>
              <Stack gap={2} align="start" pl={4}>
                <Text>1. 「投票ルームを作成」をクリック</Text>
                <Text>2. 投票のタイトルを入力して作成</Text>
                <Text>3. URLをチームメンバーに共有</Text>
                <Text>4. みんなで参加者登録</Text>
                <Text>5. 投票実行して結果確認</Text>
              </Stack>
            </Stack>
          </Box>
          <Stack gap={8}>
            <Grid
              templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
              gap={6}
            >
              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Stack gap={3} align="start">
                  <Box bg="blue.50" p={3} borderRadius="full" w="fit-content">
                    <Text fontSize="2xl">⚡</Text>
                  </Box>
                  <Heading size="sm" color="blue.600">
                    リアルタイム通信
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    参加者の登録や投票結果がリアルタイムで同期されます。画面更新不要で最新の状態を確認できます。
                  </Text>
                </Stack>
              </Box>

              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Stack gap={3} align="start">
                  <Box bg="green.50" p={3} borderRadius="full" w="fit-content">
                    <Text fontSize="2xl">🔗</Text>
                  </Box>
                  <Heading size="sm" color="green.600">
                    URLで簡単共有
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    ルームを作成したらURLを共有するだけ。アカウント登録不要で誰でも参加できます。
                  </Text>
                </Stack>
              </Box>

              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Stack gap={3} align="start">
                  <Box bg="purple.50" p={3} borderRadius="full" w="fit-content">
                    <Text fontSize="2xl">🎲</Text>
                  </Box>
                  <Heading size="sm" color="purple.600">
                    ランダム選択機能
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    公平で透明性の高い投票システム。最高得票者が複数いる場合はランダムで当選者を決定します。
                  </Text>
                </Stack>
              </Box>

              <Box bg="white" p={6} borderRadius="lg" shadow="sm">
                <Stack gap={3} align="start">
                  <Box bg="red.50" p={3} borderRadius="full" w="fit-content">
                    <Text fontSize="2xl">🔒</Text>
                  </Box>
                  <Heading size="sm" color="red.600">
                    匿名投票システム
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    誰が誰に投票したかは秘匿されます。心理的プレッシャーなく本音で投票できます。
                  </Text>
                </Stack>
              </Box>
            </Grid>
          </Stack>
        </Stack>
      </PageLayout>
    </ClientOnly>
  );
}
