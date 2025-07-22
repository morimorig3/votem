'use client';

import { Heading, HStack } from '@chakra-ui/react';
import Link from 'next/link';

interface AppHeaderProps {
  isShowTitle?: boolean;
}

const VoteIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={48} height={48}>
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
  </svg>
);

export default function AppHeader({ isShowTitle = false }: AppHeaderProps) {
  return (
    <HStack justifyContent="center">
      <Link href="/">
        <HStack cursor="pointer">
          <VoteIcon />
          {isShowTitle && (
            <Heading size="lg" fontWeight={700}>
              投票アプリ
            </Heading>
          )}
        </HStack>
      </Link>
    </HStack>
  );
}
