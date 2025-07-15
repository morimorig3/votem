'use client';

import { Box, Stack, Spinner, Text } from '@chakra-ui/react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({
  message = '読み込み中...',
}: LoadingScreenProps) {
  return (
    <Box
      bg="gray.50"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Stack gap={4} alignItems="center">
        <Spinner size="xl" color="blue.500" />
        <Text>{message}</Text>
      </Stack>
    </Box>
  );
}
