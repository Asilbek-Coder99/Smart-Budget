import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Universal data fetching hook.
 * deps array o'zgarganda avtomatik qayta so'rov yuboradi.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useQuery(
 *     () => transactionService.getAll({ page, search }),
 *     [page, search]          // <-- shu o'zgarganda refetch qiladi
 *   );
 */
export const useQuery = (queryFn, deps = [], options = {}) => {
  const { enabled = true, refetchInterval } = options;

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError]     = useState(null);

  const intervalRef  = useRef(null);
  const mountedRef   = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await queryFn();
      if (mountedRef.current) setData(res.data);
    } catch (err) {
      if (mountedRef.current)
        setError(err?.response?.data?.message || 'Failed to load data');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    execute();

    if (refetchInterval) {
      intervalRef.current = setInterval(execute, refetchInterval);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [execute, refetchInterval]);

  return { data, loading, error, refetch: execute };
};
