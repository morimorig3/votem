import type { Metadata } from "next";
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "VoTem - 匿名投票アプリ",
  description: "チームの決定を簡単に。匿名投票でスムーズな意思決定を。",
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
