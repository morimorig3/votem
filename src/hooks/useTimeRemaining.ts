import { useState, useEffect, useMemo } from 'react';

export interface UseTimeRemainingReturn {
  timeRemaining: string | null;
  isExpired: boolean;
}

export function useTimeRemaining(
  expiresAt?: string | Date
): UseTimeRemainingReturn {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1秒ごとに現在時刻を更新
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // 残り時間を計算
  const { timeRemaining, isExpired } = useMemo(() => {
    if (!expiresAt) {
      return { timeRemaining: null, isExpired: false };
    }

    const expiresAtDate = new Date(expiresAt);
    const diff = expiresAtDate.getTime() - currentTime.getTime();

    if (diff <= 0) {
      return { timeRemaining: '期限切れ', isExpired: true };
    }

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      timeRemaining: `${minutes}分${seconds}秒`,
      isExpired: false,
    };
  }, [expiresAt, currentTime]);

  return {
    timeRemaining,
    isExpired,
  };
}