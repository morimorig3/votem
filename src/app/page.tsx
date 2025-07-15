'use client';

import { Stack, Text, Button, Box, Heading } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import AppHeader from '@/components/AppHeader';

export default function Home() {
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push('/create');
  };

  return (
    <PageLayout maxWidth="4xl" padding={20}>
      <Stack gap={12}>
          {/* ヘッダー */}
          <Stack gap={6} textAlign="center">
            <AppHeader size="2xl" />
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
      </Stack>
    </PageLayout>
  );
}
