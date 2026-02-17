/**
 * Utility to retry asynchronous operations with exponential backoff.
 * Primarily used to handle transient NetworkErrors or cold-start timeouts.
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  backoffFactor?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, initialDelay = 1000, backoffFactor = 2 } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      
      const isNetworkError = 
        err?.message?.includes('NetworkError') || 
        err?.message?.includes('fetch') ||
        err?.message?.includes('Failed to fetch') ||
        err?.name === 'TypeError' ||
        err?.status === 0;

      if (!isNetworkError || attempt === maxRetries) {
        throw err;
      }

      console.warn(`[Resilience] Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`, err.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }

  throw lastError;
}
