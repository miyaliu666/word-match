type RandomSource = () => number;

function xmur3(seed: string) {
  let h = 1779033703 ^ seed.length;

  for (let index = 0; index < seed.length; index += 1) {
    h = Math.imul(h ^ seed.charCodeAt(index), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): RandomSource {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeed(
  levelId: number,
  installId: string,
  overrideSeed?: string
): string {
  if (overrideSeed) {
    return overrideSeed;
  }

  const salt = Math.random().toString(36).slice(2, 10);
  return `${levelId}:${installId}:${Date.now()}:${salt}`;
}

export function createRandom(seed: string): RandomSource {
  return mulberry32(xmur3(seed)());
}

export function pickOne<T>(items: T[], random: RandomSource): T {
  return items[Math.floor(random() * items.length)];
}

export function shuffleArray<T>(items: T[], random: RandomSource): T[] {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

export function sampleWithoutReplacement<T>(
  items: T[],
  count: number,
  random: RandomSource
): T[] {
  return shuffleArray(items, random).slice(0, count);
}
