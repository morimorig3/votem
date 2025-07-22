import { Box, Stack, Heading, Text, Button } from '@chakra-ui/react';
import PageLayout from '@/components/PageLayout';
import AppHeader from '@/components/AppHeader';

interface VoteEndedScreenProps {
  onViewResults: () => void;
}

export default function VoteEndedScreen({
  onViewResults,
}: VoteEndedScreenProps) {
  return (
    <PageLayout maxWidth="lg" padding={20}>
      <Stack gap={8} textAlign="center">
        <AppHeader />

        <Box bg="white" p={8} borderRadius="lg" shadow="sm">
          <Stack gap={4}>
            <Heading size="lg">投票終了</Heading>
            <Text color="gray.600">この投票は既に終了しています。</Text>
            <Button onClick={onViewResults} colorScheme="blue">
              結果を確認する
            </Button>
          </Stack>
        </Box>
      </Stack>
    </PageLayout>
  );
}
