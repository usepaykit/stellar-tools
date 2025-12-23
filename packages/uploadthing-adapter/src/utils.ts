export const calculateCredits = (
  files: Array<{ name: string; size: number; type: string }>,
  product: { unitDivisor: number | null; unitsPerCredit: number }
): number => {
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  // If unitDivisor exists → divide bytes by it
  // If unitDivisor is null/0 → use file count
  const totalUnits = product.unitDivisor
    ? totalBytes / product.unitDivisor
    : files.length;

  return Math.ceil(totalUnits / (product.unitsPerCredit || 1));
};
