export const calculateCredits = (params: {
  rawAmount: number;
  unitDivisor: number | null;
  unitsPerCredit: number | null;
}) => {
  const { rawAmount, unitDivisor, unitsPerCredit } = params;
  const units = unitDivisor ? rawAmount / unitDivisor : rawAmount;

  // Calculate credits (e.g., 1000 tokens / 10 tokens per credit = 100 credits)
  return Math.ceil(units / (unitsPerCredit ?? 1));
};
