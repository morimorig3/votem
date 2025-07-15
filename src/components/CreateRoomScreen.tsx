'use client';

import { Box, Stack, Text, Button, Input, Heading } from '@chakra-ui/react';
import PageLayout from './PageLayout';

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
          <Heading size="lg">ルームを作成してください</Heading>
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
      </Stack>
    </PageLayout>
  );
}
