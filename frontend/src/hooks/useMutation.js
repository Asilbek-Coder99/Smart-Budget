import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Mutation hook — POST/PUT/DELETE uchun.
 *
 * Usage:
 *   const { mutate, loading } = useMutation(
 *     (data) => transactionService.create(data),
 *     { onSuccess: () => refetch(), successMessage: 'Created!' }
 *   );
 */
export const useMutation = (mutationFn, options = {}) => {
  const { onSuccess, onError, successMessage } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const mutate = useCallback(async (variables) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFn(variables);
      if (successMessage) toast.success(successMessage);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const msg = err?.response?.data?.message || 'Operation failed';
      setError(msg);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, successMessage, onSuccess, onError]);

  return { mutate, loading, error };
};
