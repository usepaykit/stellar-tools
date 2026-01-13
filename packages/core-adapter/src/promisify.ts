export async function* raceAsyncIterator<T>(
  promises: Promise<T>[]
): AsyncGenerator<T, void, undefined> {
  const pending = new Set(promises);

  while (pending.size > 0) {
    const result = await Promise.race(
      Array.from(pending).map(async (p) => {
        try {
          const value = await p;
          return { value, promise: p, error: null };
        } catch (error) {
          return { value: null, promise: p, error };
        }
      })
    );

    pending.delete(result.promise);

    if (result.error) {
      console.error("Promise rejected:", result.error);
      continue; // Skip failed promises
    }

    if (result.value) {
      yield result.value;
    }
  }
}

export async function* batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): AsyncGenerator<R, void, undefined> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await processor(batch);

    for (const result of results) {
      yield result;
    }

    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
