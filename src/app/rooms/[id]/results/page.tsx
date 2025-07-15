'use client';

import {
  Box,
  Stack,
  Heading,
  Text,
  Button,
  Badge,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import PageLayout from '@/components/PageLayout';
import ErrorScreen from '@/components/ErrorScreen';
import AppHeader from '@/components/AppHeader';
import { getVoteResults } from '@/service/voteService';
import { restartVoting } from '@/service/roomService';
import { ResultsData, VoteResult } from '@/types/database';
import { useError } from '@/hooks/useError';
import { useTimeRemaining } from '@/hooks/useTimeRemaining';
import { useSession } from '@/hooks/useSession';

export default function ResultsPage() {
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  
  const { error, setError, clearError, handleError } = useError();
  const { timeRemaining } = useTimeRemaining(resultsData?.room.expires_at);
  const { restoreSession } = useSession();

  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  // 結果データを取得
  const fetchResults = useCallback(async () => {
    try {
      const data = await getVoteResults(roomId);
      setResultsData(data);
    } catch (error) {
      handleError(error, '結果の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, handleError]);

  // 得票率を計算
  const getVotePercentage = (voteCount: number) => {
    if (
      !resultsData?.voteStatus.votedCount ||
      resultsData.voteStatus.votedCount === 0
    )
      return 0;
    return Math.round((voteCount / resultsData.voteStatus.votedCount) * 100);
  };

  // 順位を取得
  const getRank = (index: number, voteCount: number, results: VoteResult[]) => {
    let rank = 1;
    for (let i = 0; i < index; i++) {
      if (results[i].vote_count > voteCount) {
        rank++;
      }
    }
    return rank;
  };

  // 投票をやり直す
  const handleRestartVoting = async () => {
    const session = restoreSession(roomId);
    if (!session?.participantId) {
      setError('参加者情報が見つかりません');
      return;
    }

    setIsRestarting(true);
    clearError();

    try {
      await restartVoting(roomId, session.participantId);
      // 投票やり直しが成功した場合、ルーム画面に遷移
      router.push(`/rooms/${roomId}`);
    } catch (error) {
      handleError(error, '投票やり直しに失敗しました');
      setIsRestarting(false);
    }
  };


  useEffect(() => {
    // 初回データ取得
    fetchResults();

    // Server-Sent Events接続を開始（結果用）
    const resultsEventSource = new EventSource(`/api/rooms/${roomId}/results/events`);

    resultsEventSource.addEventListener('results-update', event => {
      try {
        const data = JSON.parse(event.data);
        setResultsData(data);
        setIsLoading(false);
      } catch (error) {
        handleError(error, 'SSE結果データパースエラー');
      }
    });

    resultsEventSource.addEventListener('error', event => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        handleError(new Error(data.error));
      } catch {
        handleError(new Error('リアルタイム更新の接続に失敗しました'));
      }
    });

    resultsEventSource.onerror = () => {
      handleError(new Error('SSE結果接続が切断されました'));
      // フォールバック：通常のHTTPリクエストに切り替え
      resultsEventSource.close();
      const fallbackInterval = setInterval(fetchResults, 10000);
      return () => clearInterval(fallbackInterval);
    };

    // Server-Sent Events接続を開始（ルーム用）
    const roomEventSource = new EventSource(`/api/rooms/${roomId}/events`);

    roomEventSource.addEventListener('room-update', event => {
      try {
        const data = JSON.parse(event.data);
        // ルームステータスが'waiting'に戻った場合、ルーム画面に遷移
        if (data.room.status === 'waiting') {
          router.push(`/rooms/${roomId}`);
        }
      } catch (error) {
        handleError(error, 'SSEルームデータパースエラー');
      }
    });

    roomEventSource.addEventListener('error', event => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        handleError(new Error(data.error));
      } catch {
        // ルーム接続のエラーは無視（結果接続が主）
      }
    });

    return () => {
      resultsEventSource.close();
      roomEventSource.close();
    };
  }, [roomId, fetchResults, handleError, router]);

  if (isLoading) {
    return <LoadingScreen message="結果を読み込み中..." />;
  }

  if (error || !resultsData) {
    return (
      <ErrorScreen
        message={error}
        buttonText="ルームに戻る"
        onButtonClick={() => router.push(`/rooms/${roomId}`)}
      />
    );
  }

  return (
    <PageLayout maxWidth="4xl" padding={8}>
      <Stack gap={8}>
          {/* ヘッダー */}
          <Stack gap={4} textAlign="center">
            <AppHeader size="lg" />

            <Heading size="xl">{resultsData.room.title}</Heading>

            <Stack
              direction={{ base: 'column', md: 'row' }}
              gap={4}
              justify="center"
              align="center"
            >
              <Badge
                colorScheme={
                  resultsData.room.status === 'waiting'
                    ? 'gray'
                    : resultsData.room.status === 'voting'
                      ? 'yellow'
                      : 'green'
                }
                p={2}
                borderRadius="md"
              >
                {resultsData.room.status === 'waiting'
                  ? '参加者募集中'
                  : resultsData.room.status === 'voting'
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

          {/* 投票状況 */}
          <Box bg="white" p={6} borderRadius="lg" shadow="sm">
            <Stack gap={4}>
              <Heading size="md">投票状況</Heading>
              <Stack gap={2}>
                <Stack direction="row" justify="space-between">
                  <Text>投票者数</Text>
                  <Text fontWeight="bold">
                    {resultsData.voteStatus.votedCount} /{' '}
                    {resultsData.voteStatus.totalParticipants} 人
                  </Text>
                </Stack>
                <Box w="100%" bg="gray.200" borderRadius="md" height="8px">
                  <Box
                    bg="blue.500"
                    height="100%"
                    borderRadius="md"
                    width={`${
                      resultsData.voteStatus.totalParticipants > 0
                        ? (resultsData.voteStatus.votedCount /
                            resultsData.voteStatus.totalParticipants) *
                          100
                        : 0
                    }%`}
                    transition="width 0.3s ease"
                  />
                </Box>
                {!resultsData.voteStatus.isComplete &&
                  resultsData.room.status === 'voting' && (
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      まだ投票していない人がいます
                    </Text>
                  )}
              </Stack>
            </Stack>
          </Box>

          {/* 結果表示 */}
          <Stack gap={6}>
            <Heading size="md" textAlign="center">
              投票結果
            </Heading>

            {resultsData.results.length === 0 ? (
              <Box
                bg="white"
                p={8}
                borderRadius="lg"
                shadow="sm"
                textAlign="center"
              >
                <Text color="gray.500">まだ投票がありません</Text>
              </Box>
            ) : (
              <Stack gap={4}>
                {resultsData.results.map((result, index) => {
                  const percentage = getVotePercentage(result.vote_count);
                  const rank = getRank(
                    index,
                    result.vote_count,
                    resultsData.results
                  );
                  const isWinner = resultsData.winners.some(
                    w => w.id === result.id
                  );

                  return (
                    <Box
                      key={result.id}
                      bg="white"
                      p={6}
                      borderRadius="lg"
                      shadow="sm"
                      border={isWinner ? '3px solid' : '1px solid'}
                      borderColor={isWinner ? 'gold' : 'gray.200'}
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
                        <Stack
                          direction="row"
                          justify="space-between"
                          align="center"
                        >
                          <Stack direction="row" align="center" gap={3}>
                            <Badge
                              colorScheme="gray"
                              fontSize="md"
                              px={2}
                              py={1}
                            >
                              {rank}位
                            </Badge>
                            <Text fontSize="xl" fontWeight="bold">
                              {result.name}
                            </Text>
                          </Stack>

                          <Stack textAlign="right" gap={1}>
                            <Text
                              fontSize="2xl"
                              fontWeight="bold"
                              color="blue.600"
                            >
                              {result.vote_count}票
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              ({percentage}%)
                            </Text>
                          </Stack>
                        </Stack>

                        {resultsData.voteStatus.votedCount > 0 && (
                          <Box
                            w="100%"
                            bg="gray.200"
                            borderRadius="md"
                            height="6px"
                          >
                            <Box
                              bg={isWinner ? 'yellow.400' : 'blue.500'}
                              height="100%"
                              borderRadius="md"
                              width={`${percentage}%`}
                              transition="width 0.3s ease"
                            />
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Stack>


          {/* アクションボタン */}
          <Stack gap={4} align="center">
            {resultsData.voteStatus.isComplete && (
              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleRestartVoting}
                loading={isRestarting}
                loadingText="やり直し中..."
                disabled={timeRemaining === '期限切れ'}
              >
                投票をやり直す
              </Button>
            )}

            {!resultsData.voteStatus.isComplete &&
              resultsData.room.status === 'voting' && (
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  結果はリアルタイムで自動更新されます
                </Text>
              )}
          </Stack>
      </Stack>
    </PageLayout>
  );
}
