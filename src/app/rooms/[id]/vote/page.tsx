'use client';

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
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingScreen from '@/components/LoadingScreen';

interface Participant {
  id: string;
  name: string;
  joined_at: string;
}

interface Room {
  id: string;
  title: string;
  created_at: string;
  expires_at: string;
  status: 'waiting' | 'voting' | 'completed';
}

interface RoomData {
  room: Room;
  participants: Participant[];
}

export default function VotePage() {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState('');
  const [hasVoted, setHasVoted] = useState(false);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const roomId = params.id as string;
  const participantId = searchParams.get('participantId');

  // LocalStorageのキー
  const getStorageKey = () => `votem_participant_${roomId}`;

  // セッション情報を復元
  const restoreSession = () => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const sessionData = JSON.parse(stored);
        if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
          return sessionData;
        } else {
          localStorage.removeItem(getStorageKey());
        }
      }
    } catch (error) {
      console.error('セッション復元エラー:', error);
      localStorage.removeItem(getStorageKey());
    }
    return null;
  };

  // ルーム情報を取得
  const fetchRoomData = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ルーム情報の取得に失敗しました');
      }

      setRoomData(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'ルーム情報の取得に失敗しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 投票実行
  const handleVote = async () => {
    const currentParticipantId =
      participantId || restoreSession()?.participantId;
    if (!selectedParticipant || !currentParticipantId) {
      setError('投票対象を選択してください');
      return;
    }

    setIsVoting(true);
    setError('');

    try {
      const response = await fetch(`/api/rooms/${roomId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: currentParticipantId,
          selectedParticipantId: selectedParticipant,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '投票に失敗しました');
      }

      setHasVoted(true);
      alert('投票が完了しました！');

      // 結果画面に遷移
      setTimeout(() => {
        router.push(`/rooms/${roomId}/results`);
      }, 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '投票に失敗しました';
      setError(errorMessage);
    } finally {
      setIsVoting(false);
    }
  };

  // 有効期限チェック
  const getTimeRemaining = () => {
    if (!roomData?.room.expires_at) return null;

    const now = new Date();
    const expiresAt = new Date(roomData.room.expires_at);
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return '期限切れ';

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${minutes}分${seconds}秒`;
  };

  // 投票者の名前を取得
  const getVoterName = () => {
    const currentParticipantId =
      participantId || restoreSession()?.participantId;
    if (!currentParticipantId || !roomData?.participants) return '不明';
    const voter = roomData.participants.find(
      p => p.id === currentParticipantId
    );
    return voter?.name || '不明';
  };

  useEffect(() => {
    let finalParticipantId = participantId;

    // participantIdが指定されていない場合、セッションから復元を試行
    if (!participantId) {
      const session = restoreSession();
      if (session) {
        finalParticipantId = session.participantId;
        // URLを更新（セッションから復元した場合）
        router.replace(
          `/rooms/${roomId}/vote?participantId=${session.participantId}`
        );
      } else {
        setError(
          '参加者IDが指定されていません。先にルームに参加してください。'
        );
        setIsLoading(false);
        return;
      }
    }

    fetchRoomData();
  }, [roomId, participantId, router]);

  if (isLoading) {
    return <LoadingScreen message="投票画面を読み込み中..." />;
  }

  if (error || !roomData) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Container maxW="lg" py={20}>
          <Stack gap={8} textAlign="center">
            <Link href="/">
              <Heading
                size="xl"
                color="blue.500"
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                VoTem
              </Heading>
            </Link>

            <Box bg="white" p={8} borderRadius="lg" shadow="sm">
              <Stack gap={4}>
                <Heading size="lg" color="red.500">
                  エラーが発生しました
                </Heading>
                <Text color="gray.600">{error}</Text>
                <Button
                  onClick={() => router.push(`/rooms/${roomId}`)}
                  colorScheme="blue"
                >
                  ルームに戻る
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    );
  }

  if (hasVoted) {
    return (
      <Box bg="gray.50" minH="100vh">
        <Container maxW="lg" py={20}>
          <Stack gap={8} textAlign="center">
            <Link href="/">
              <Heading
                size="xl"
                color="blue.500"
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                VoTem
              </Heading>
            </Link>

            <Box bg="white" p={8} borderRadius="lg" shadow="sm">
              <Stack gap={6}>
                <Heading size="lg" color="green.500">
                  投票完了！
                </Heading>
                <Text color="gray.600">
                  投票が正常に完了しました。
                  <br />
                  結果画面に自動で移動します...
                </Text>
                <Spinner color="green.500" size="lg" />
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    );
  }

  if (roomData.room.status === 'completed') {
    return (
      <Box bg="gray.50" minH="100vh">
        <Container maxW="lg" py={20}>
          <Stack gap={8} textAlign="center">
            <Link href="/">
              <Heading
                size="xl"
                color="blue.500"
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                VoTem
              </Heading>
            </Link>

            <Box bg="white" p={8} borderRadius="lg" shadow="sm">
              <Stack gap={4}>
                <Heading size="lg" color="blue.500">
                  投票終了
                </Heading>
                <Text color="gray.600">この投票は既に終了しています。</Text>
                <Button
                  onClick={() => router.push(`/rooms/${roomId}/results`)}
                  colorScheme="blue"
                >
                  結果を確認する
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    );
  }

  const timeRemaining = getTimeRemaining();

  return (
    <Box bg="gray.50" minH="100vh">
      <Container maxW="4xl" py={8}>
        <Stack gap={8}>
          {/* ヘッダー */}
          <Stack gap={4} textAlign="center">
            <Link href="/">
              <Heading
                size="lg"
                color="blue.500"
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                VoTem
              </Heading>
            </Link>

            <Heading size="xl">{roomData.room.title}</Heading>

            <Stack
              direction={{ base: 'column', md: 'row' }}
              gap={4}
              justify="center"
              align="center"
            >
              <Badge colorScheme="yellow" p={2} borderRadius="md">
                投票中
              </Badge>

              {timeRemaining && (
                <Text
                  fontSize="sm"
                  color={timeRemaining === '期限切れ' ? 'red.500' : 'gray.600'}
                >
                  残り時間: {timeRemaining}
                </Text>
              )}
            </Stack>

            <Text color="gray.600">
              投票者:{' '}
              <Text as="span" fontWeight="bold" color="blue.600">
                {getVoterName()}
              </Text>
            </Text>
          </Stack>

          {/* 投票説明 */}
          <Box
            bg="blue.50"
            p={6}
            borderRadius="lg"
            borderLeft="4px solid"
            borderColor="blue.500"
          >
            <Stack gap={2}>
              <Text fontWeight="bold" color="blue.700">
                投票方法
              </Text>
              <Text color="blue.600" fontSize="sm">
                下の参加者の中から1人を選んで投票してください。自分自身に投票することも可能です。
              </Text>
            </Stack>
          </Box>

          {/* 参加者選択 */}
          <Stack gap={6}>
            <Heading size="md" textAlign="center">
              投票対象を選択してください
            </Heading>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {roomData.participants.map(participant => (
                <Box
                  key={participant.id}
                  cursor="pointer"
                  onClick={() => setSelectedParticipant(participant.id)}
                  bg={
                    selectedParticipant === participant.id ? 'blue.50' : 'white'
                  }
                  borderColor={
                    selectedParticipant === participant.id
                      ? 'blue.300'
                      : 'gray.200'
                  }
                  borderWidth="2px"
                  borderRadius="lg"
                  p={6}
                  shadow="sm"
                  _hover={{
                    borderColor: 'blue.300',
                    transform: 'translateY(-2px)',
                    shadow: 'md',
                  }}
                  transition="all 0.2s"
                >
                  <Stack gap={3} textAlign="center">
                    <Text fontWeight="bold" fontSize="lg">
                      {participant.name}
                    </Text>

                    {participant.id === participantId && (
                      <Badge colorScheme="green" size="sm">
                        あなた
                      </Badge>
                    )}

                    {selectedParticipant === participant.id && (
                      <Badge colorScheme="blue" size="sm">
                        選択中
                      </Badge>
                    )}
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>

            {error && (
              <Text color="red.500" textAlign="center" fontWeight="medium">
                {error}
              </Text>
            )}
          </Stack>

          {/* 投票ボタン */}
          <Stack gap={4} align="center">
            <Button
              colorScheme="blue"
              size="lg"
              px={12}
              py={6}
              fontSize="lg"
              onClick={handleVote}
              loading={isVoting}
              loadingText="投票中..."
              disabled={!selectedParticipant || timeRemaining === '期限切れ'}
            >
              この人に投票する
            </Button>

            <Stack
              direction={{ base: 'column', md: 'row' }}
              gap={4}
              textAlign="center"
            >
              <Button
                variant="outline"
                onClick={() => router.push(`/rooms/${roomId}`)}
                size="sm"
              >
                ルームに戻る
              </Button>

              <Button
                variant="ghost"
                onClick={() => router.push(`/rooms/${roomId}/results`)}
                size="sm"
              >
                途中結果を確認
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
