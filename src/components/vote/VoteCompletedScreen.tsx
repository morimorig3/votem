import { Box, Stack, Heading, Text, Spinner } from '@chakra-ui/react';
import PageLayout from '@/components/PageLayout';
import AppHeader from '@/components/AppHeader';

export default function VoteCompletedScreen() {
  return (
    <PageLayout maxWidth="lg" padding={20}>
      <Stack gap={8} textAlign="center">
        <AppHeader />

        <Box bg="white" p={8} borderRadius="lg" shadow="sm">
          <Stack gap={6}>
            <Heading size="lg" color="green.500">
              投票完了！
            </Heading>
            <Text color="gray.600">
              投票が正常に完了しました。
              <br />
              結果画面に自動で移動します...
            </Text>
            <Spinner color="green.500" size="lg" />
          </Stack>
        </Box>
      </Stack>
    </PageLayout>
  );
}
