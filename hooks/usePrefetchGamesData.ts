import { useCallback, useEffect, useState } from 'react';

export function usePrefetchGamesData(roomId: string) {
  const [isPrefetched, setIsPrefetched] = useState(false);

  const prefetch = useCallback(async () => {
    if (isPrefetched || !roomId) return;
    try {
      await fetch(`/api/room/${roomId}`, { method: 'GET', cache: 'force-cache' });
      setIsPrefetched(true);
    } catch (e) {
      console.warn('Failed to prefetch games data', e);
    }
  }, [roomId, isPrefetched]);

  useEffect(() => {
    const timer = setTimeout(prefetch, 3000);
    return () => clearTimeout(timer);
  }, [prefetch]);

  return { prefetch };
}