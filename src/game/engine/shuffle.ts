import { shuffleArray } from './seedRandom';
import { findMatches, hasLegalMove } from './matchDetector';
import type { InternalBoard } from './types.internal';

export function shuffleStableBoard(
  board: InternalBoard,
  groupTokenByTileId: Map<string, string>,
  random: () => number,
  maxAttempts = 300
): InternalBoard {
  const size = board.length;
  const ids = board.flat().filter((tileId): tileId is string => Boolean(tileId));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const shuffledIds = shuffleArray(ids, random);
    const candidate: InternalBoard = [];

    for (let row = 0; row < size; row += 1) {
      candidate.push(shuffledIds.slice(row * size, row * size + size));
    }

    if (!findMatches(candidate, groupTokenByTileId) && hasLegalMove(candidate, groupTokenByTileId)) {
      return candidate;
    }
  }

  throw new Error('Unable to shuffle board into a valid state.');
}
