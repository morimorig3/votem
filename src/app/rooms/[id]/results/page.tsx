'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';
import MainResultsScreen from '@/components/results/MainResultsScreen';
import { getVoteResults } from '@/service/voteService';
import { restartVoting } from '@/service/roomService';
import { ResultsData } from '@/types/database';
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
    <MainResultsScreen
      resultsData={resultsData}
      timeRemaining={timeRemaining}
      isRestarting={isRestarting}
      onRestartVoting={handleRestartVoting}
    />
  );
}
