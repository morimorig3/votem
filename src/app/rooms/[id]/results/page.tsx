'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';
import MainResultsScreen from '@/components/results/MainResultsScreen';
import { getVoteResults } from '@/service/voteService';
import { cancelVoting } from '@/service/roomService';
import { ResultsData } from '@/types/database';
import { useError } from '@/hooks/useError';
import { useTimeRemaining } from '@/hooks/useTimeRemaining';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/database';

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

    const currentParticipantId = restoreSession(roomId)?.participantId;
    if (!currentParticipantId) {
      setError('参加者情報が見つかりません');
      return;
    }

    try {
      await cancelVoting(roomId, currentParticipantId);
      // 投票キャンセルが成功した場合、ルーム画面に遷移
      router.push(`/rooms/${roomId}`);
    } catch (error) {
      handleError(error, '投票キャンセルに失敗しました');
    }
  };

  useEffect(() => {
    // 初回データ取得
    fetchResults();

    // Supabase Realtime購読を開始
    const resultsSubscription = supabase
      .channel(`results:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `room_id=eq.${roomId}`,
        },
        (payload: unknown) => {
          fetchResults();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload: { new?: { status?: string } }) => {
          // ルームステータスが'waiting'に戻った場合、ルーム画面に遷移
          if (payload.new?.status === 'waiting') {
            router.push(`/rooms/${roomId}`);
          }
          // ルームステータスが'voting'に変更された場合（投票やり直し）、投票画面に遷移
          else if (payload.new?.status === 'voting') {
            router.push(`/rooms/${roomId}/vote`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(resultsSubscription);
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
