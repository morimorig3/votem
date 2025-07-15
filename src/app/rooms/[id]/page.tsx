'use client';

import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  Input,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import PageLayout from '@/components/PageLayout';
import ErrorScreen from '@/components/ErrorScreen';
import AppHeader from '@/components/AppHeader';
import { getRoomData, startVoting } from '@/service/roomService';
import { joinRoom } from '@/service/participantService';
import { RoomData, Participant } from '@/types/database';
import { useError } from '@/hooks/useError';
import { useSession } from '@/hooks/useSession';
import { useTimeRemaining } from '@/hooks/useTimeRemaining';

export default function RoomPage() {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isStartingVoting, setIsStartingVoting] = useState(false);

  const { error, setError, clearError, handleError } = useError();
  const {
    currentParticipant,
    setCurrentParticipant,
    saveSession,
    restoreSession,
    clearSession,
  } = useSession();
  const { timeRemaining } = useTimeRemaining(roomData?.room.expires_at);

  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  // ルーム情報を取得
  const fetchRoomData = useCallback(async () => {
    try {
      const data = await getRoomData(roomId);
      setRoomData(data);

      // セッションで復元した参加者が実際にルームに存在するかチェック
      if (currentParticipant && data.participants) {
        const participantExists = data.participants.some(
          (p: Participant) => p.id === currentParticipant
        );
        if (!participantExists) {
          // 参加者が存在しない場合はセッションをクリア
          clearSession(roomId);
          setCurrentParticipant(null);
        }
      }
    } catch (error) {
      handleError(error, 'ルーム情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, currentParticipant, clearSession, handleError]);

  // 参加者追加
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newParticipantName.trim()) {
      setError('名前を入力してください');
      return;
    }

    setIsJoining(true);
    clearError();

    try {
      const data = await joinRoom(roomId, newParticipantName.trim());

      // 参加成功
      setCurrentParticipant(data.participant.id);
      setNewParticipantName('');

      // セッション情報を保存
      saveSession(data.participant.id, data.participant.name, roomId);

      // ルーム情報を再取得
      await fetchRoomData();
    } catch (error) {
      handleError(error, '参加に失敗しました');
    } finally {
      setIsJoining(false);
    }
  };

  // 投票開始
  const handleStartVoting = async () => {
    if (!currentParticipant) {
      setError('参加者として登録してから投票を開始してください');
      return;
    }

    if (!roomData?.participants || roomData.participants.length < 2) {
      setError('投票には最低2人の参加者が必要です');
      return;
    }

    setIsStartingVoting(true);
    clearError();

    try {
      await startVoting(roomId, currentParticipant);
      // 投票開始が成功した場合、SSEで自動的に投票画面に遷移される
    } catch (error) {
      handleError(error, '投票開始に失敗しました');
      setIsStartingVoting(false);
    }
  };

  // 投票に参加する（投票が既に開始されている場合）
  const handleJoinVoting = () => {
    if (!currentParticipant) {
      setError('参加者として登録してから投票に参加してください');
      return;
    }
    router.push(`/rooms/${roomId}/vote`);
  };

  // 結果確認
  const handleViewResults = () => {
    router.push(`/rooms/${roomId}/results`);
  };

  // 現在の参加者が投票済みかどうかを判定
  const isCurrentParticipantVoted = () => {
    if (!currentParticipant || !roomData?.votedParticipantIds) return false;
    return roomData.votedParticipantIds.includes(currentParticipant);
  };

  useEffect(() => {
    console.log('effect');

    // セッション復元を試行
    const session = restoreSession(roomId);
    if (session) {
      setCurrentParticipant(session.participantId);
    }

    // 初回データ取得
    fetchRoomData();

    // Server-Sent Events接続を開始
    const eventSource = new EventSource(`/api/rooms/${roomId}/events`);

    eventSource.addEventListener('room-update', event => {
      try {
        const data = JSON.parse(event.data);
        const previousStatus = roomData?.room.status;
        setRoomData(data);
        setIsLoading(false);

        // セッションで復元した参加者が実際にルームに存在するかチェック
        if (currentParticipant && data.participants) {
          const participantExists = data.participants.some(
            (p: Participant) => p.id === currentParticipant
          );
          if (!participantExists) {
            clearSession(roomId);
            setCurrentParticipant(null);
          }
        }

        // ルームステータスが'voting'に変更された場合、自動で投票画面に遷移
        if (
          previousStatus === 'waiting' &&
          data.room.status === 'voting' &&
          currentParticipant
        ) {
          router.push(`/rooms/${roomId}/vote`);
        }
      } catch (error) {
        handleError(error, 'SSEデータパースエラー');
      }
    });

    eventSource.addEventListener('error', event => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        handleError(new Error(data.error));
      } catch {
        handleError(new Error('リアルタイム更新の接続に失敗しました'));
      }
    });

    eventSource.addEventListener('expired', () => {
      handleError(new Error('ルームの有効期限が切れました'));
    });

    eventSource.onerror = () => {
      handleError(new Error('SSE接続が切断されました'));
      // フォールバック：通常のHTTPリクエストに切り替え
      eventSource.close();
      const fallbackInterval = setInterval(fetchRoomData, 10000);
      return () => clearInterval(fallbackInterval);
    };

    return () => {
      eventSource.close();
    };
  }, [
    roomId,
    fetchRoomData,
    restoreSession,
    currentParticipant,
    clearSession,
    handleError,
    setCurrentParticipant,
    roomData?.room.status,
    router,
  ]);

  if (isLoading) {
    return <LoadingScreen message="ルーム情報を読み込み中..." />;
  }

  if (error || !roomData) {
    return (
      <ErrorScreen message={error} onButtonClick={() => router.push('/')} />
    );
  }

  return (
    <PageLayout maxWidth="4xl" padding={8}>
      <Stack gap={8}>
        {/* ヘッダー */}
        <Stack gap={4} textAlign="center">
          <AppHeader size="lg" />

          <Heading size="xl">{roomData.room.title}</Heading>

          <Stack
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            justify="center"
            align="center"
          >
            <Badge
              colorScheme={
                roomData.room.status === 'waiting'
                  ? 'gray'
                  : roomData.room.status === 'voting'
                    ? 'yellow'
                    : 'green'
              }
              p={2}
              borderRadius="md"
            >
              {roomData.room.status === 'waiting'
                ? '参加者募集中'
                : roomData.room.status === 'voting'
                  ? '投票中'
                  : '投票完了'}
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
        </Stack>

        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
          {/* 参加者一覧 */}
          <Box bg="white" p={6} borderRadius="lg" shadow="sm">
            <Stack gap={4}>
              <Heading size="md">
                参加者一覧 ({roomData.participants.length}人)
              </Heading>

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
                      bg={
                        currentParticipant === participant.id
                          ? 'blue.50'
                          : 'gray.50'
                      }
                      borderRadius="md"
                      border={
                        currentParticipant === participant.id
                          ? '2px solid'
                          : '1px solid'
                      }
                      borderColor={
                        currentParticipant === participant.id
                          ? 'blue.200'
                          : 'gray.200'
                      }
                    >
                      <Stack
                        direction="row"
                        justify="space-between"
                        align="center"
                      >
                        <Text fontWeight="medium">
                          {index + 1}. {participant.name}
                        </Text>
                        <Stack direction="row" gap={2}>
                          {currentParticipant === participant.id && (
                            <Badge colorScheme="blue" size="sm">
                              あなた
                            </Badge>
                          )}
                          {roomData.votedParticipantIds?.includes(participant.id) && (
                            <Badge colorScheme="green" size="sm">
                              投票済み
                            </Badge>
                          )}
                        </Stack>
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
                          onChange={e => setNewParticipantName(e.target.value)}
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
                        disabled={
                          !newParticipantName.trim() ||
                          roomData.room.status !== 'waiting'
                        }
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
                        loading={isStartingVoting}
                        loadingText="投票を開始中..."
                      >
                        投票を開始する
                      </Button>
                    )}

                    {roomData.room.status === 'voting' && !isCurrentParticipantVoted() && (
                      <Button
                        colorScheme="yellow"
                        size="lg"
                        w="100%"
                        onClick={handleJoinVoting}
                      >
                        投票に参加する
                      </Button>
                    )}

                    {roomData.room.status === 'voting' && isCurrentParticipantVoted() && (
                      <Button
                        colorScheme="blue"
                        size="lg"
                        w="100%"
                        onClick={handleViewResults}
                      >
                        投票結果を確認する
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

                    {roomData.participants.length < 2 &&
                      roomData.room.status === 'waiting' && (
                        <Text color="gray.500" fontSize="sm" textAlign="center">
                          投票には最低2人の参加者が必要です
                        </Text>
                      )}
                  </Stack>
                </>
              )}

              <Box
                p={4}
                bg="yellow.50"
                borderRadius="md"
                borderLeft="4px solid"
                borderColor="yellow.500"
              >
                <Text fontWeight="bold" color="yellow.700" mb={2}>
                  参加方法
                </Text>
                <Text color="yellow.600" fontSize="sm">
                  このURLをチームメンバーに共有して、みんなで参加してもらいましょう！
                </Text>
              </Box>
            </Stack>
          </Box>
        </SimpleGrid>
      </Stack>
    </PageLayout>
  );
}
