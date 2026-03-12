/**
 * Helper for API sync operations in store contexts.
 * Wraps apiRequest calls with error reporting via a callback.
 */
export function createSyncFn(onError?: (message: string) => void) {
  return function syncToServer(
    operation: Promise<unknown>,
    errorContext: string
  ): void {
    operation.catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Sync] ${errorContext}:`, msg);
      if (onError) {
        onError(`Sync failed: ${errorContext}`);
      }
    });
  };
}
