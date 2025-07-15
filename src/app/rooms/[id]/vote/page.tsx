'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';
import VoteCompletedScreen from '@/components/vote/VoteCompletedScreen';
import VoteEndedScreen from '@/components/vote/VoteEndedScreen';
import MainVoteScreen from '@/components/vote/MainVoteScreen';
import { getRoomData } from '@/service/roomService';
import { submitVote } from '@/service/voteService';
import { RoomData } from '@/types/database';
import { useError } from '@/hooks/useError';
import { useSession } from '@/hooks/useSession';
import { useTimeRemaining } from '@/hooks/useTimeRemaining';

export default function VotePage() {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const { error, setError, clearError, handleError } = useError();
  const { restoreSession } = useSession();
  const { timeRemaining } = useTimeRemaining(roomData?.room.expires_at);

  const router = useRouter();
  const params = useParams();

  const roomId = params.id as string;

  // ルーム情報を取得
  const fetchRoomData = useCallback(async () => {
    try {
      const data = await getRoomData(roomId);
      setRoomData(data);
    } catch (error) {
      handleError(error, 'ルーム情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, handleError, setRoomData]);

  // 投票実行
  const handleVote = async () => {
    const currentParticipantId = restoreSession(roomId)?.participantId;
    if (!selectedParticipant || !currentParticipantId) {
      setError('投票対象を選択してください');
      return;
    }

    setIsVoting(true);
    clearError();

    try {
      await submitVote(roomId, currentParticipantId, selectedParticipant);

      setHasVoted(true);

      // 結果画面に遷移
      setTimeout(() => {
        router.push(`/rooms/${roomId}/results`);
      }, 2000);
    } catch (error) {
      handleError(error, '投票に失敗しました');
    } finally {
      setIsVoting(false);
    }
  };

  // 投票者の名前を取得
  const getVoterName = () => {
    const currentParticipantId = restoreSession(roomId)?.participantId;
    if (!currentParticipantId || !roomData?.participants) return '不明';
    const voter = roomData.participants.find(
      p => p.id === currentParticipantId
    );
    return voter?.name || '不明';
  };

  // ランダム選択
  const handleRandomSelection = () => {
    if (!roomData?.participants || roomData.participants.length === 0) return;

    const randomIndex = Math.floor(Math.random() * roomData.participants.length);
    const randomWinner = roomData.participants[randomIndex];

    // 選択された参加者を設定
    setSelectedParticipant(randomWinner.id);
  };

  useEffect(() => {
    // セッションから参加者IDを復元
    const session = restoreSession(roomId);
    if (!session) {
      setError(
        '参加者情報が見つかりません。先にルームに参加してください。'
      );
      setIsLoading(false);
      return;
    }

    fetchRoomData();
  }, [roomId, restoreSession, setError, fetchRoomData]);

  if (isLoading) {
    return <LoadingScreen message="投票画面を読み込み中..." />;
  }

  if (error || !roomData) {
    return (
      <ErrorScreen
        message={error}
        buttonText="ルームに戻る"
        onButtonClick={() => router.push(`/rooms/${roomId}`)}
      />
    );
  }

  if (hasVoted) {
    return <VoteCompletedScreen />;
  }

  if (roomData.room.status === 'completed') {
    return (
      <VoteEndedScreen
        onViewResults={() => router.push(`/rooms/${roomId}/results`)}
      />
    );
  }

  return (
    <MainVoteScreen
      roomId={roomId}
      roomData={roomData}
      selectedParticipant={selectedParticipant}
      currentParticipantId={restoreSession(roomId)?.participantId || null}
      voterName={getVoterName()}
      timeRemaining={timeRemaining}
      isVoting={isVoting}
      error={error}
      onVote={handleVote}
      onRandomSelection={handleRandomSelection}
      onSelectParticipant={setSelectedParticipant}
    />
  );
}
