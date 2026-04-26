import type { BoardPosition } from './types.public';
import type { InternalBoard, MatchSummary } from './types.internal';

function getToken(
  tileId: string | null,
  groupTokenByTileId: Map<string, string>
): string | null {
  return tileId ? groupTokenByTileId.get(tileId) ?? null : null;
}

export function areAdjacent(a: BoardPosition, b: BoardPosition): boolean {
  const rowDelta = Math.abs(a.row - b.row);
  const colDelta = Math.abs(a.col - b.col);
  return rowDelta + colDelta === 1;
}

export function cloneBoard(board: InternalBoard): InternalBoard {
  return board.map((row) => [...row]);
}

export function swapPositions(
  board: InternalBoard,
  first: BoardPosition,
  second: BoardPosition
): InternalBoard {
  const next = cloneBoard(board);
  [next[first.row][first.col], next[second.row][second.col]] = [
    next[second.row][second.col],
    next[first.row][first.col]
  ];
  return next;
}

export function findMatches(
  board: InternalBoard,
  groupTokenByTileId: Map<string, string>
): MatchSummary | null {
  const matchedIds = new Set<string>();
  const lineLengths: number[] = [];
  const size = board.length;

  for (let row = 0; row < size; row += 1) {
    let start = 0;

    while (start < size) {
      const startId = board[row][start];
      const startToken = getToken(startId, groupTokenByTileId);
      let end = start + 1;

      while (end < size && getToken(board[row][end], groupTokenByTileId) === startToken) {
        end += 1;
      }

      if (startToken && end - start >= 3) {
        lineLengths.push(end - start);
        for (let column = start; column < end; column += 1) {
          matchedIds.add(board[row][column]!);
        }
      }

      start = end;
    }
  }

  for (let column = 0; column < size; column += 1) {
    let start = 0;

    while (start < size) {
      const startId = board[start][column];
      const startToken = getToken(startId, groupTokenByTileId);
      let end = start + 1;

      while (end < size && getToken(board[end][column], groupTokenByTileId) === startToken) {
        end += 1;
      }

      if (startToken && end - start >= 3) {
        lineLengths.push(end - start);
        for (let row = start; row < end; row += 1) {
          matchedIds.add(board[row][column]!);
        }
      }

      start = end;
    }
  }

  if (matchedIds.size === 0) {
    return null;
  }

  return {
    ids: [...matchedIds],
    lineLengths
  };
}

export function hasLegalMove(
  board: InternalBoard,
  groupTokenByTileId: Map<string, string>
): boolean {
  const size = board.length;

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const candidates: BoardPosition[] = [
        { row: row + 1, col: column },
        { row, col: column + 1 }
      ].filter((candidate) => candidate.row < size && candidate.col < size);

      for (const candidate of candidates) {
        const swapped = swapPositions(board, { row, col: column }, candidate);
        if (findMatches(swapped, groupTokenByTileId)) {
          return true;
        }
      }
    }
  }

  return false;
}

export function findFirstLegalMove(
  board: InternalBoard,
  groupTokenByTileId: Map<string, string>
): [BoardPosition, BoardPosition] | null {
  const size = board.length;

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const candidates: BoardPosition[] = [
        { row: row + 1, col: column },
        { row, col: column + 1 }
      ].filter((candidate) => candidate.row < size && candidate.col < size);

      for (const candidate of candidates) {
        const swapped = swapPositions(board, { row, col: column }, candidate);
        if (findMatches(swapped, groupTokenByTileId)) {
          return [{ row, col: column }, candidate];
        }
      }
    }
  }

  return null;
}
