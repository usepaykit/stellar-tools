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

/**
 * Validates that a Stellar public key is valid
 */
export function isValidStellarPublicKey(key: string): boolean {
  return /^G[A-Z0-9]{55}$/.test(key);
}

/**
 * Generates a payment URL for Stellar
 */
export function generateStellarPaymentURL(params: {
  destination: string;
  amount: string;
  asset_code: string;
  asset_issuer?: string;
  memo: string;
}): string {
  const { destination, amount, asset_code, asset_issuer, memo } = params;

  let url = `web+stellar:pay?destination=${destination}&amount=${amount}`;
  url += `&memo=${encodeURIComponent(memo)}&memo_type=MEMO_TEXT`;

  if (asset_code !== "XLM" && asset_issuer) {
    url += `&asset_code=${asset_code}&asset_issuer=${asset_issuer}`;
  }

  return url;
}
