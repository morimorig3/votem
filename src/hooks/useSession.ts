import { useState, useCallback } from 'react';
import { useError } from './useError';

interface SessionData {
  participantId: string;
  participantName: string;
  timestamp: number;
}

export interface UseSessionReturn {
  currentParticipant: string | null;
  setCurrentParticipant: (participantId: string | null) => void;
  saveSession: (participantId: string, participantName: string, roomId: string) => void;
  restoreSession: (roomId: string) => SessionData | null;
  clearSession: (roomId: string) => void;
  getStorageKey: (roomId: string) => string;
}

export function useSession(): UseSessionReturn {
  const [currentParticipant, setCurrentParticipant] = useState<string | null>(
    null
  );
  const { handleError } = useError();

  // LocalStorageのキー生成
  const getStorageKey = useCallback((roomId: string) => {
    return `votem_participant_${roomId}`;
  }, []);

  // セッション情報を保存
  const saveSession = useCallback(
    (participantId: string, participantName: string, roomId: string) => {
      const sessionData: SessionData = {
        participantId,
        participantName,
        timestamp: Date.now(),
      };
      localStorage.setItem(getStorageKey(roomId), JSON.stringify(sessionData));
    },
    [getStorageKey]
  );

  // セッション情報を復元
  const restoreSession = useCallback(
    (roomId: string): SessionData | null => {
      try {
        const stored = localStorage.getItem(getStorageKey(roomId));
        if (stored) {
          const sessionData = JSON.parse(stored);
          // 24時間以内のセッションのみ有効
          if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
            return sessionData;
          } else {
            localStorage.removeItem(getStorageKey(roomId));
          }
        }
      } catch (error) {
        handleError(error, 'セッション復元エラー');
        localStorage.removeItem(getStorageKey(roomId));
      }
      return null;
    },
    [getStorageKey, handleError]
  );

  // セッション情報をクリア
  const clearSession = useCallback(
    (roomId: string) => {
      localStorage.removeItem(getStorageKey(roomId));
    },
    [getStorageKey]
  );

  return {
    currentParticipant,
    setCurrentParticipant,
    saveSession,
    restoreSession,
    clearSession,
    getStorageKey,
  };
}