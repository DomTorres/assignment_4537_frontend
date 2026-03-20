import { useState, useCallback } from 'react';
import { ApiError } from '../services/BaseApiService';

/**
 * useApi — generic hook for any async API call.
 * Provides loading, error, and data state automatically.
 *
 * @param {Function} asyncFn - the async function to call
 * @returns {{ execute, data, loading, error, reset }}
 */
export function useApi(asyncFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'An unexpected error occurred.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, data, loading, error, reset };
}
