'use client'

import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  Container,
  Input,
  Badge,
  Spinner,
  SimpleGrid,
} from '@chakra-ui/react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Participant {
  id: string
  name: string
  joined_at: string
}

interface Room {
  id: string
  title: string
  created_at: string
  expires_at: string
  status: 'waiting' | 'voting' | 'completed'
}

interface RoomData {
  room: Room
  participants: Participant[]
}

export default function RoomPage() {
  const [roomData, setRoomData] = useState<RoomData | null>(null)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [currentParticipant, setCurrentParticipant] = useState<string | null>(null)

  const router = useRouter()
  const params = useParams()
  const roomId = params.id as string

  // ルーム情報を取得
  const fetchRoomData = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'ルーム情報の取得に失敗しました')
      }

      setRoomData(data)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ルーム情報の取得に失敗しました'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  // 参加者追加
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newParticipantName.trim()) {
      setError('名前を入力してください')
      return
    }

    setIsJoining(true)
    setError('')

    try {
      const response = await fetch(`/api/rooms/${roomId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newParticipantName.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '参加に失敗しました')
      }

      // 参加成功
      setCurrentParticipant(data.participant.id)
      setNewParticipantName('')
      
      // ルーム情報を再取得
      await fetchRoomData()
      
      alert('ルームに参加しました！')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '参加に失敗しました'
      setError(errorMessage)
    } finally {
      setIsJoining(false)
    }
  }

  // 投票開始
  const handleStartVoting = () => {
    if (!currentParticipant) {
      alert('参加者として登録してから投票を開始してください')
      return
    }
    
    if (!roomData?.participants || roomData.participants.length < 2) {
      alert('投票には最低2人の参加者が必要です')
      return
    }

    router.push(`/rooms/${roomId}/vote?participantId=${currentParticipant}`)
  }

  // 結果確認
  const handleViewResults = () => {
    router.push(`/rooms/${roomId}/results`)
  }

  // 有効期限チェック
  const getTimeRemaining = () => {
    if (!roomData?.room.expires_at) return null
    
    const now = new Date()
    const expiresAt = new Date(roomData.room.expires_at)
    const diff = expiresAt.getTime() - now.getTime()
    
    if (diff <= 0) return '期限切れ'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    return `${minutes}分${seconds}秒`
  }

  useEffect(() => {
    fetchRoomData()
    
    // 30秒ごとにデータを更新
    const interval = setInterval(fetchRoomData, 30000)
    
    return () => clearInterval(interval)
  }, [roomId, fetchRoomData])

  if (isLoading) {
    return (
      <Box bg="gray.50" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Stack gap={4} textAlign="center">
          <Spinner size="xl" color="blue.500" />
          <Text>ルーム情報を読み込み中...</Text>
        </Stack>
      </Box>
    )
  }

  if (error || !roomData) {
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
                <Button onClick={() => router.push('/')} colorScheme="blue">
                  ホームに戻る
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
            
            <Heading size="xl">{roomData.room.title}</Heading>
            
            <Stack direction={{ base: 'column', md: 'row' }} gap={4} justify="center" align="center">
              <Badge 
                colorScheme={
                  roomData.room.status === 'waiting' ? 'gray' :
                  roomData.room.status === 'voting' ? 'yellow' : 'green'
                }
                p={2}
                borderRadius="md"
              >
                {roomData.room.status === 'waiting' ? '参加者募集中' :
                 roomData.room.status === 'voting' ? '投票中' : '投票完了'}
              </Badge>
              
              {timeRemaining && (
                <Text fontSize="sm" color={timeRemaining === '期限切れ' ? 'red.500' : 'gray.600'}>
                  残り時間: {timeRemaining}
                </Text>
              )}
            </Stack>
          </Stack>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
            {/* 参加者一覧 */}
            <Box bg="white" p={6} borderRadius="lg" shadow="sm">
              <Stack gap={4}>
                <Heading size="md">参加者一覧 ({roomData.participants.length}人)</Heading>
                
                {roomData.participants.length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={8}>
                    まだ参加者がいません
                  </Text>
                ) : (
                  <Stack gap={3}>
                    {roomData.participants.map((participant, index) => (
                      <Box
                        key={participant.id}
                        p={3}
                        bg={currentParticipant === participant.id ? 'blue.50' : 'gray.50'}
                        borderRadius="md"
                        border={currentParticipant === participant.id ? '2px solid' : '1px solid'}
                        borderColor={currentParticipant === participant.id ? 'blue.200' : 'gray.200'}
                      >
                        <Stack direction="row" justify="space-between" align="center">
                          <Text fontWeight="medium">
                            {index + 1}. {participant.name}
                          </Text>
                          {currentParticipant === participant.id && (
                            <Badge colorScheme="blue" size="sm">あなた</Badge>
                          )}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Box>

            {/* 参加・アクション */}
            <Box bg="white" p={6} borderRadius="lg" shadow="sm">
              <Stack gap={6}>
                {!currentParticipant ? (
                  <>
                    <Heading size="md">ルームに参加</Heading>
                    <form onSubmit={handleJoinRoom}>
                      <Stack gap={4}>
                        <Stack gap={2}>
                          <Text fontWeight="medium">あなたの名前</Text>
                          <Input
                            value={newParticipantName}
                            onChange={(e) => setNewParticipantName(e.target.value)}
                            placeholder="例: 田中太郎"
                            size="lg"
                            maxLength={50}
                          />
                          {error && (
                            <Text color="red.500" fontSize="sm">
                              {error}
                            </Text>
                          )}
                        </Stack>
                        
                        <Button
                          type="submit"
                          colorScheme="blue"
                          size="lg"
                          w="100%"
                          loading={isJoining}
                          loadingText="参加中..."
                          disabled={!newParticipantName.trim() || roomData.room.status !== 'waiting'}
                        >
                          参加する
                        </Button>
                      </Stack>
                    </form>
                  </>
                ) : (
                  <>
                    <Heading size="md">投票アクション</Heading>
                    <Stack gap={4}>
                      {roomData.room.status === 'waiting' && (
                        <Button
                          colorScheme="green"
                          size="lg"
                          w="100%"
                          onClick={handleStartVoting}
                          disabled={roomData.participants.length < 2}
                        >
                          投票を開始する
                        </Button>
                      )}
                      
                      {roomData.room.status === 'voting' && (
                        <Button
                          colorScheme="yellow"
                          size="lg"
                          w="100%"
                          onClick={handleStartVoting}
                        >
                          投票に参加する
                        </Button>
                      )}
                      
                      {roomData.room.status === 'completed' && (
                        <Button
                          colorScheme="blue"
                          size="lg"
                          w="100%"
                          onClick={handleViewResults}
                        >
                          結果を確認する
                        </Button>
                      )}
                      
                      {roomData.participants.length < 2 && roomData.room.status === 'waiting' && (
                        <Text color="gray.500" fontSize="sm" textAlign="center">
                          投票には最低2人の参加者が必要です
                        </Text>
                      )}
                    </Stack>
                  </>
                )}
                
                <Box p={4} bg="yellow.50" borderRadius="md" borderLeft="4px solid" borderColor="yellow.500">
                  <Text fontWeight="bold" color="yellow.700" mb={2}>参加方法</Text>
                  <Text color="yellow.600" fontSize="sm">
                    このURLをチームメンバーに共有して、みんなで参加してもらいましょう！
                  </Text>
                </Box>
              </Stack>
            </Box>
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  )
}