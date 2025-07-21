'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem} resetCSS>
      {children}
    </ChakraProvider>
  );
}
