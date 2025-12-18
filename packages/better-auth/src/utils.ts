type Success<T> = [T, undefined];

type Failure<E = Error> = [undefined, E];

type Result<T, E = Error> = Success<T> | Failure<E>;

export async function tryCatchAsync<T, E = Error>(
  promise: Promise<T>
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return [data as T, undefined];
  } catch (error) {
    return [undefined, error as E];
  }
}

export function tryCatchSync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    const data = fn();
    return [data, undefined];
  } catch (error) {
    return [undefined, error as E];
  }
}
