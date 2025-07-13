'use client'

import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  Container,
  Icon,
} from '@chakra-ui/react'
import { useRouter } from 'next/navigation'

// アイコン用のSVGコンポーネント
const VoteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
  </svg>
)

const GroupIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.001 3.001 0 0 0 17 6.5c-1.66 0-3 1.34-3 3 0 .35.07.68.18 1H12c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3h2c0-2.76-2.24-5-5-5s-5 2.24-5 5c0 2.76 2.24 5 5 5h2.18c-.11.32-.18.65-.18 1 0 1.66 1.34 3 3 3 1.66 0 3-1.34 3-3v-3h-2v3c0 .55-.45 1-1 1s-1-.45-1-1z"/>
  </svg>
)

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

export default function Home() {
  const router = useRouter()

  const handleCreateRoom = () => {
    router.push('/create')
  }

  const features = [
    {
      icon: VoteIcon,
      title: '匿名投票',
      description: 'プライバシーを守りながら、公正な投票を実現'
    },
    {
      icon: GroupIcon,
      title: 'チーム決定',
      description: '誰がやるかをスムーズに決められる'
    },
    {
      icon: ClockIcon,
      title: '30分制限',
      description: 'スピーディーな意思決定をサポート'
    }
  ]

  return (
    <Box bg="gray.50" minH="100vh">
      <Container maxW="4xl" py={20}>
        <Stack gap={12}>
          {/* ヘッダー */}
          <Stack gap={6} textAlign="center">
            <Heading size="2xl" color="blue.500">
              VoTem
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="600px" mx="auto">
              チームの決定を簡単に。匿名投票でスムーズな意思決定を。
            </Text>
          </Stack>

          {/* 機能紹介 */}
          <Stack direction={{ base: 'column', md: 'row' }} gap={8} align="stretch">
            {features.map((feature, index) => (
              <Box key={index} bg="white" p={6} borderRadius="lg" shadow="sm" flex="1" textAlign="center">
                <Stack gap={4}>
                  <Icon as={feature.icon} boxSize={12} color="blue.500" mx="auto" />
                  <Heading size="md">{feature.title}</Heading>
                  <Text color="gray.600" fontSize="sm">
                    {feature.description}
                  </Text>
                </Stack>
              </Box>
            ))}
          </Stack>

          {/* CTA */}
          <Stack gap={4} align="center">
            <Button
              colorScheme="blue"
              size="lg"
              px={12}
              py={6}
              fontSize="lg"
              onClick={handleCreateRoom}
            >
              投票ルームを作成
            </Button>
            <Text fontSize="sm" color="gray.500">
              無料・登録不要・30分で自動削除
            </Text>
          </Stack>

          {/* 使い方 */}
          <Box bg="white" p={6} borderRadius="lg" shadow="sm" w="100%">
            <Stack gap={4} align="start">
              <Heading size="md">使い方</Heading>
              <Stack gap={2} align="start" pl={4}>
                <Text>1. 「投票ルームを作成」をクリック</Text>
                <Text>2. 投票のタイトルを入力して作成</Text>
                <Text>3. URLをチームメンバーに共有</Text>
                <Text>4. みんなで参加者登録</Text>
                <Text>5. 投票実行して結果確認</Text>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}