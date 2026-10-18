import { useState, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T, Args extends any[]>(
  apiFn: (...args: Args) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFn(...args);
        setData(result);
        return result;
      } catch (err: any) {
        const message = err?.message || 'An error occurred while communicating with the service';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFn]
  );

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, setData, reset };
}
