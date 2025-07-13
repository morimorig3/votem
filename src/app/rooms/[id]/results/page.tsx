'use client'

import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  Container,
  SimpleGrid,
  Spinner,
  Badge,
} from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface VoteResult {
  id: string
  name: string
  vote_count: number
}

interface VoteStatus {
  votedCount: number
  totalParticipants: number
  isComplete: boolean
}

interface Room {
  id: string
  title: string
  created_at: string
  expires_at: string
  status: 'waiting' | 'voting' | 'completed'
}

interface ResultsData {
  room: Room
  results: VoteResult[]
  voteStatus: VoteStatus
  winners: VoteResult[]
}

export default function ResultsPage() {
  const [resultsData, setResultsData] = useState<ResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string

  // 結果データを取得
  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/results`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '結果の取得に失敗しました')
      }

      setResultsData(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '結果の取得に失敗しました'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  // 有効期限チェック
  const getTimeRemaining = () => {
    if (!resultsData?.room.expires_at) return null
    
    const now = new Date()
    const expiresAt = new Date(resultsData.room.expires_at)
    const diff = expiresAt.getTime() - now.getTime()
    
    if (diff <= 0) return '期限切れ'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${minutes}分${seconds}秒`
  }

  // 得票率を計算
  const getVotePercentage = (voteCount: number) => {
    if (!resultsData?.voteStatus.votedCount || resultsData.voteStatus.votedCount === 0) return 0
    return Math.round((voteCount / resultsData.voteStatus.votedCount) * 100)
  }

  // 順位を取得
  const getRank = (index: number, voteCount: number, results: VoteResult[]) => {
    let rank = 1
    for (let i = 0; i < index; i++) {
      if (results[i].vote_count > voteCount) {
        rank++
      }
    }
    return rank
  }

  // ランダム選択
  const handleRandomSelection = () => {
    if (!resultsData?.results || resultsData.results.length === 0) return
    
    const randomIndex = Math.floor(Math.random() * resultsData.results.length)
    const randomWinner = resultsData.results[randomIndex]
    
    alert(`ランダム選択結果: ${randomWinner.name} さんが選ばれました！`)
  }

  useEffect(() => {
    fetchResults()
    
    // 投票中の場合は30秒ごとに更新
    let interval: NodeJS.Timeout | null = null
    
    if (resultsData?.room.status === 'voting') {
      interval = setInterval(fetchResults, 30000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchResults, resultsData?.room.status])

  if (isLoading) {
    return (
      <Box bg="gray.50" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Stack gap={4} textAlign="center">
          <Spinner size="xl" color="blue.500" />
          <Text>結果を読み込み中...</Text>
        </Stack>
      </Box>
    )
  }

  if (error || !resultsData) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Container maxW="lg" py={20}>
          <Stack gap={8} textAlign="center">
            <Link href="/">
              <Heading size="xl" color="blue.500" cursor="pointer" _hover={{ textDecoration: 'underline' }}>
                VoTem
              </Heading>
            </Link>
            
            <Box bg="white" p={8} borderRadius="lg" shadow="sm">
              <Stack gap={4}>
                <Heading size="lg" color="red.500">エラーが発生しました</Heading>
                <Text color="gray.600">{error}</Text>
                <Button onClick={() => router.push(`/rooms/${roomId}`)} colorScheme="blue">
                  ルームに戻る
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    )
  }

  const timeRemaining = getTimeRemaining()

  return (
    <Box bg="gray.50" minH="100vh">
      <Container maxW="4xl" py={8}>
        <Stack gap={8}>
          {/* ヘッダー */}
          <Stack gap={4} textAlign="center">
            <Link href="/">
              <Heading size="lg" color="blue.500" cursor="pointer" _hover={{ textDecoration: 'underline' }}>
                VoTem
              </Heading>
            </Link>
            
            <Heading size="xl">{resultsData.room.title}</Heading>
            
            <Stack direction={{ base: 'column', md: 'row' }} gap={4} justify="center" align="center">
              <Badge 
                colorScheme={
                  resultsData.room.status === 'waiting' ? 'gray' :
                  resultsData.room.status === 'voting' ? 'yellow' : 'green'
                }
                p={2}
                borderRadius="md"
              >
                {resultsData.room.status === 'waiting' ? '参加者募集中' :
                 resultsData.room.status === 'voting' ? '投票中' : '投票完了'}
              </Badge>
              
              {timeRemaining && (
                <Text fontSize="sm" color={timeRemaining === '期限切れ' ? 'red.500' : 'gray.600'}>
                  残り時間: {timeRemaining}
                </Text>
              )}
            </Stack>
          </Stack>

          {/* 投票状況 */}
          <Box bg="white" p={6} borderRadius="lg" shadow="sm">
            <Stack gap={4}>
              <Heading size="md">投票状況</Heading>
              <Stack gap={2}>
                <Stack direction="row" justify="space-between">
                  <Text>投票者数</Text>
                  <Text fontWeight="bold">
                    {resultsData.voteStatus.votedCount} / {resultsData.voteStatus.totalParticipants} 人
                  </Text>
                </Stack>
                <Box w="100%" bg="gray.200" borderRadius="md" height="8px">
                  <Box
                    bg="blue.500"
                    height="100%"
                    borderRadius="md"
                    width={`${resultsData.voteStatus.totalParticipants > 0 ? 
                      (resultsData.voteStatus.votedCount / resultsData.voteStatus.totalParticipants) * 100 : 0
                    }%`}
                    transition="width 0.3s ease"
                  />
                </Box>
                {!resultsData.voteStatus.isComplete && resultsData.room.status === 'voting' && (
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    まだ投票していない人がいます
                  </Text>
                )}
              </Stack>
            </Stack>
          </Box>

          {/* 結果表示 */}
          <Stack gap={6}>
            <Heading size="md" textAlign="center">投票結果</Heading>
            
            {resultsData.results.length === 0 ? (
              <Box bg="white" p={8} borderRadius="lg" shadow="sm" textAlign="center">
                <Text color="gray.500">まだ投票がありません</Text>
              </Box>
            ) : (
              <Stack gap={4}>
                {resultsData.results.map((result, index) => {
                  const percentage = getVotePercentage(result.vote_count)
                  const rank = getRank(index, result.vote_count, resultsData.results)
                  const isWinner = resultsData.winners.some(w => w.id === result.id)
                  
                  return (
                    <Box
                      key={result.id}
                      bg="white"
                      p={6}
                      borderRadius="lg"
                      shadow="sm"
                      border={isWinner ? "3px solid" : "1px solid"}
                      borderColor={isWinner ? "gold" : "gray.200"}
                      position="relative"
                    >
                      {isWinner && (
                        <Badge
                          position="absolute"
                          top="-12px"
                          left="20px"
                          colorScheme="yellow"
                          fontSize="sm"
                          px={3}
                          py={1}
                        >
                          🏆 当選
                        </Badge>
                      )}
                      
                      <Stack gap={3}>
                        <Stack direction="row" justify="space-between" align="center">
                          <Stack direction="row" align="center" gap={3}>
                            <Badge colorScheme="gray" fontSize="md" px={2} py={1}>
                              {rank}位
                            </Badge>
                            <Text fontSize="xl" fontWeight="bold">
                              {result.name}
                            </Text>
                          </Stack>
                          
                          <Stack textAlign="right" gap={1}>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                              {result.vote_count}票
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              ({percentage}%)
                            </Text>
                          </Stack>
                        </Stack>
                        
                        {resultsData.voteStatus.votedCount > 0 && (
                          <Box w="100%" bg="gray.200" borderRadius="md" height="6px">
                            <Box
                              bg={isWinner ? "yellow.400" : "blue.500"}
                              height="100%"
                              borderRadius="md"
                              width={`${percentage}%`}
                              transition="width 0.3s ease"
                            />
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Stack>

          {/* 当選者表示 */}
          {resultsData.winners.length > 0 && resultsData.voteStatus.isComplete && (
            <Box bg="yellow.50" p={6} borderRadius="lg" border="2px solid" borderColor="yellow.300">
              <Stack gap={4} textAlign="center">
                <Heading size="md" color="yellow.800">
                  🎉 投票結果発表 🎉
                </Heading>
                <Stack gap={2}>
                  {resultsData.winners.map((winner, index) => (
                    <Text key={winner.id} fontSize="xl" fontWeight="bold" color="yellow.700">
                      {index > 0 && '・ '}
                      {winner.name} さん ({winner.vote_count}票)
                    </Text>
                  ))}
                </Stack>
                {resultsData.winners.length > 1 && (
                  <Text fontSize="sm" color="yellow.600">
                    同点で{resultsData.winners.length}人が当選です
                  </Text>
                )}
              </Stack>
            </Box>
          )}

          {/* アクションボタン */}
          <Stack gap={4} align="center">
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="100%">
              <Button
                colorScheme="green"
                size="lg"
                onClick={handleRandomSelection}
                disabled={resultsData.results.length === 0}
              >
                ランダム選択
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push(`/rooms/${roomId}`)}
              >
                ルームに戻る
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/')}
              >
                新しいルーム作成
              </Button>
            </SimpleGrid>
            
            {!resultsData.voteStatus.isComplete && resultsData.room.status === 'voting' && (
              <Text fontSize="sm" color="gray.600" textAlign="center">
                結果は30秒ごとに自動更新されます
              </Text>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}