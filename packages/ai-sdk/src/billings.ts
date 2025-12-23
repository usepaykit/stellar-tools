export async function checkBilling({
  apiKey,
  customerId,
  usage,
}: {
  apiKey: string;
  customerId: string;
  usage: number;
}): Promise<
  boolean
> {
  console.log({ apiKey, customerId, usage });
  return Math.random() > 0.5;
}
