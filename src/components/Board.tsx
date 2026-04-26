import { useLayoutEffect, useMemo, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { PublicBoard } from '../game/engine/types.public';
import { TILE_MOVE_ANIMATION_MS, TILE_SPAWN_ANIMATION_MS } from '../game/animation/timings';

type BoardProps = {
  board: PublicBoard;
  selectedIds: string[];
  removingIds: string[];
  invalidIds: string[];
  hintIds: string[];
  disabled: boolean;
  reducedMotion: boolean;
  spawnOffsets: Record<string, number>;
  onTileClick: (row: number, col: number) => void;
};

type FlatTile = {
  id: string;
  word: string;
  row: number;
  col: number;
};

function splitWordForDisplay(word: string): { firstLine: string; secondLine: string } | null {
  const normalizedWord = word.trim();
  if (normalizedWord.length < 9 || normalizedWord.includes(' ')) {
    return null;
  }

  const midpoint = Math.ceil(normalizedWord.length / 2);
  const firstLine = `${normalizedWord.slice(0, midpoint)}-`;
  const secondLine = normalizedWord.slice(midpoint);

  if (!secondLine) {
    return null;
  }

  return { firstLine, secondLine };
}

export function Board({
  board,
  selectedIds,
  removingIds,
  invalidIds,
  hintIds,
  disabled,
  reducedMotion,
  spawnOffsets,
  onTileClick
}: BoardProps) {
  const boardSize = board.length;
  const boardColumns = board[0]?.length ?? 0;
  const tileRefs = useRef(new Map<string, HTMLButtonElement>());
  const previousRects = useRef(new Map<string, DOMRect>());
  const removingSet = useMemo(() => new Set(removingIds), [removingIds]);
  const invalidSet = useMemo(() => new Set(invalidIds), [invalidIds]);
  const hintSet = useMemo(() => new Set(hintIds), [hintIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const flatTiles = useMemo<FlatTile[]>(
    () =>
      board.flatMap((row, rowIndex) =>
        row.map((tile, colIndex) => ({
          ...tile,
          row: rowIndex,
          col: colIndex
        }))
      ),
    [board]
  );

  useLayoutEffect(() => {
    const currentRects = new Map<string, DOMRect>();

    tileRefs.current.forEach((node, id) => {
      currentRects.set(id, node.getBoundingClientRect());
    });

    currentRects.forEach((currentRect, id) => {
      const node = tileRefs.current.get(id);
      if (!node) {
        return;
      }

      const previousRect = previousRects.current.get(id);
      const duration = reducedMotion ? 1 : TILE_MOVE_ANIMATION_MS;

      if (previousRect) {
        const x = previousRect.left - currentRect.left;
        const y = previousRect.top - currentRect.top;

        if (x !== 0 || y !== 0) {
          node.animate(
            [
              { transform: `translate(${x}px, ${y}px)` },
              { transform: 'translate(0, 0)' }
            ],
            {
              duration,
              easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
              fill: 'both'
            }
          );
        }
      } else {
        const offset = Math.max(spawnOffsets[id] ?? 1, 1);
        node.animate(
          [
            { transform: `translateY(-${offset * currentRect.height}px)`, opacity: 0.65 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          {
            duration: reducedMotion ? 1 : TILE_SPAWN_ANIMATION_MS,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            fill: 'both'
          }
        );
      }
    });

    previousRects.current = currentRects;
  }, [board, reducedMotion, spawnOffsets]);

  return (
    <section
      className={`board-panel panel ${disabled ? 'board-panel--locked' : ''}`.trim()}
      data-board-size={boardSize}
    >
      <div
        className="board-grid"
        style={{ '--board-columns': String(boardColumns) } as CSSProperties}
        aria-label="Game board"
      >
        {flatTiles.map((tile) => (
          (() => {
            const splitWord = splitWordForDisplay(tile.word);

            return (
              <button
                key={tile.id}
                ref={(node) => {
                  if (node) {
                    tileRefs.current.set(tile.id, node);
                  } else {
                    tileRefs.current.delete(tile.id);
                  }
                }}
                type="button"
                className={[
                  'tile',
                  selectedSet.has(tile.id) ? 'tile--selected' : '',
                  removingSet.has(tile.id) ? 'tile--removing' : '',
                  invalidSet.has(tile.id) ? 'tile--invalid' : '',
                  hintSet.has(tile.id) ? 'tile--hint' : ''
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  gridRow: `${tile.row + 1}`,
                  gridColumn: `${tile.col + 1}`
                } as CSSProperties}
                onClick={() => onTileClick(tile.row, tile.col)}
                disabled={disabled}
                aria-label={`Tile ${tile.word}`}
              >
                {splitWord ? (
                  <span className="tile__word tile__word--wrapped">
                    <span className="tile__word-line">{splitWord.firstLine}</span>
                    <span className="tile__word-line">{splitWord.secondLine}</span>
                  </span>
                ) : (
                  <span className="tile__word">{tile.word}</span>
                )}
              </button>
            );
          })()
        ))}
      </div>
    </section>
  );
}
