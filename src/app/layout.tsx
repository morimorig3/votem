import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: '投票アプリ',
  description: 'URLを共有してリアルタイム投票をすることができます。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
