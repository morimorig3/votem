'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorScreen from '@/components/ErrorScreen';
import MainRoomScreen from '@/components/room/MainRoomScreen';
import { getRoomData, startVoting } from '@/service/roomService';
import { joinRoom } from '@/service/participantService';
import { RoomData, Participant } from '@/types/database';
import { useError } from '@/hooks/useError';
import { useSession } from '@/hooks/useSession';
import { useTimeRemaining } from '@/hooks/useTimeRemaining';
import { supabase } from '@/lib/database';

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
  }, [
    roomId,
    currentParticipant,
    clearSession,
    handleError,
    setCurrentParticipant,
  ]);

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
    // セッション復元を試行
    const session = restoreSession(roomId);
    if (session) {
      setCurrentParticipant(session.participantId);
    }

    // 初回データ取得
    fetchRoomData();

    // Supabase Realtime購読を開始
    const roomSubscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload: { new?: { status?: string } }) => {
          // ルームステータスが'voting'に変更された場合、自動で投票画面に遷移
          if (payload.new?.status === 'voting' && currentParticipant) {
            router.push(`/rooms/${roomId}/vote`);
          } else {
            fetchRoomData();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchRoomData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          fetchRoomData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomSubscription);
    };
  }, [
    roomId,
    fetchRoomData,
    restoreSession,
    setCurrentParticipant,
    currentParticipant,
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
    <MainRoomScreen
      roomData={roomData}
      timeRemaining={timeRemaining}
      currentParticipant={currentParticipant}
      newParticipantName={newParticipantName}
      setNewParticipantName={setNewParticipantName}
      onJoinRoom={handleJoinRoom}
      error={error}
      isJoining={isJoining}
      isStartingVoting={isStartingVoting}
      isCurrentParticipantVoted={isCurrentParticipantVoted()}
      onStartVoting={handleStartVoting}
      onJoinVoting={handleJoinVoting}
      onViewResults={handleViewResults}
    />
  );
}
