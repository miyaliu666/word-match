import type { InternalBoard } from './types.internal';

type SpawnTile = () => string;

export function applyGravityAndRefill(
  board: InternalBoard,
  spawnTile: SpawnTile
): Record<string, number> {
  const size = board.length;
  const spawnOffsets: Record<string, number> = {};

  for (let column = 0; column < size; column += 1) {
    const existingTiles: string[] = [];

    for (let row = size - 1; row >= 0; row -= 1) {
      const tileId = board[row][column];
      if (tileId) {
        existingTiles.push(tileId);
      }
    }

    const emptyCount = size - existingTiles.length;
    const nextColumn = new Array<string>(size);

    for (let row = size - 1; row >= emptyCount; row -= 1) {
      nextColumn[row] = existingTiles[size - 1 - row] ?? existingTiles.shift()!;
    }

    for (let row = emptyCount - 1; row >= 0; row -= 1) {
      const tileId = spawnTile();
      nextColumn[row] = tileId;
      spawnOffsets[tileId] = emptyCount - row;
    }

    for (let row = 0; row < size; row += 1) {
      board[row][column] = nextColumn[row];
    }
  }

  return spawnOffsets;
}
