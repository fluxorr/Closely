import { useCallback, useEffect, useRef } from 'react';

export function usePrefetchGamesData(roomId: string) {
  const fetchedRef = useRef(false);

  const prefetch = useCallback(async () => {
    if (fetchedRef.current || !roomId) return;
    try {
      await fetch(`/api/room/${roomId}`, { method: 'GET', cache: 'force-cache' });
      fetchedRef.current = true;
    } catch (e) {
      console.warn('Failed to prefetch games data', e);
    }
  }, [roomId]);

  useEffect(() => {
    const timer = setTimeout(prefetch, 3000);
    return () => clearTimeout(timer);
  }, [prefetch]);

  return { prefetch };
}