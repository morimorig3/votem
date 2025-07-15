'use client';

import { Heading } from '@chakra-ui/react';
import Link from 'next/link';

interface AppHeaderProps {
  size?: 'lg' | 'xl' | '2xl';
}

export default function AppHeader({ size = 'lg' }: AppHeaderProps) {
  return (
    <Link href="/">
      <Heading size={size} cursor="pointer" textAlign="center" fontWeight={700}>
        投票アプリ
      </Heading>
    </Link>
  );
}
