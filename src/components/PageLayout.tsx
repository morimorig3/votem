'use client';

import { Box, Container } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: string;
  padding?: number | string;
}

export default function PageLayout({
  children,
  maxWidth = '4xl',
  padding = 8,
}: PageLayoutProps) {
  return (
    <Box bg="gray.50" minH="100vh">
      <Container maxW={maxWidth} py={padding}>
        {children}
      </Container>
    </Box>
  );
}
