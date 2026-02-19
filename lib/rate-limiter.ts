export interface RateLimitedResult<T> {
  value?: T;
  error?: string;
  key: string;
}

export async function runWithConcurrency<T>(
  tasks: { key: string; fn: () => Promise<T> }[],
  concurrency: number = 20,
  maxRetries: number = 3,
  onProgress?: (completed: number, total: number) => void,
): Promise<RateLimitedResult<T>[]> {
  const results: RateLimitedResult<T>[] = [];
  let index = 0;
  let completed = 0;
  const total = tasks.length;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const current = index++;
      const task = tasks[current];

      let lastError: string | undefined;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const value = await task.fn();
          results[current] = { value, key: task.key };
          lastError = undefined;
          break;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : String(err);
          lastError = message;

          const is429 =
            message.includes("429") || message.includes("Too Many Requests");
          if (is429 && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 500;
            await new Promise((r) => setTimeout(r, delay));
          } else if (!is429) {
            break;
          }
        }
      }

      if (lastError) {
        results[current] = { error: lastError, key: task.key };
      }

      completed++;
      onProgress?.(completed, total);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => runNext(),
  );
  await Promise.all(workers);

  return results;
}
