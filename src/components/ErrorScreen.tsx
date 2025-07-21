'use client';

import { Stack, Heading, Text, Button, Box } from '@chakra-ui/react';
import { ReactNode } from 'react';
import PageLayout from './PageLayout';
import AppHeader from './AppHeader';

interface ErrorScreenProps {
  title?: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
  children?: ReactNode;
}

export default function ErrorScreen({
  title = 'エラーが発生しました',
  message,
  buttonText = 'ホームに戻る',
  onButtonClick,
  children,
}: ErrorScreenProps) {
  return (
    <PageLayout maxWidth="lg" padding={20}>
      <Stack gap={8} textAlign="center">
        <AppHeader size="xl" />

        <Box bg="white" p={8} borderRadius="lg" shadow="sm">
          <Stack gap={4}>
            <Heading size="lg" color="red.500">
              {title}
            </Heading>
            <Text color="gray.600">{message}</Text>
            {onButtonClick && (
              <Button onClick={onButtonClick} colorScheme="blue">
                {buttonText}
              </Button>
            )}
            {children}
          </Stack>
        </Box>
      </Stack>
    </PageLayout>
  );
}
