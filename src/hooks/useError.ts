import { useState, useCallback } from 'react';

export interface UseErrorReturn {
  error: string;
  setError: (error: string) => void;
  clearError: () => void;
  handleError: (error: unknown, defaultMessage?: string) => void;
}

export function useError(initialError = ''): UseErrorReturn {
  const [error, setError] = useState<string>(initialError);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const handleError = useCallback(
    (error: unknown, defaultMessage = 'エラーが発生しました') => {
      // エラーをコンソールに出力
      console.error('Error occurred:', error);

      const errorMessage =
        error instanceof Error ? error.message : defaultMessage;
      setError(errorMessage);
    },
    []
  );

  return {
    error,
    setError,
    clearError,
    handleError,
  };
}
