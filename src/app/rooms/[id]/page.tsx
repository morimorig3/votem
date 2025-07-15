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
