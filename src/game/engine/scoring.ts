const BASE_LINE_SCORES: Record<number, number> = {
  3: 100,
  4: 160,
  5: 230
};

function getBaseLineScore(length: number): number {
  if (length <= 5) {
    return BASE_LINE_SCORES[length] ?? 0;
  }

  return BASE_LINE_SCORES[5] + (length - 5) * 80;
}

function getComboMultiplier(combo: number): number {
  if (combo <= 1) {
    return 1;
  }

  if (combo === 2) {
    return 1.5;
  }

  if (combo === 3) {
    return 2;
  }

  return 2.5;
}

export function scoreMatch(lineLengths: number[], combo: number): number {
  const subtotal = lineLengths.reduce((total, length) => total + getBaseLineScore(length), 0);
  return Math.round(subtotal * getComboMultiplier(combo));
}
