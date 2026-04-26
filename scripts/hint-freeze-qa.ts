import { glossary } from '../src/data/glossary.ts';
import { levels } from '../src/data/levels.ts';
import { GameEngine } from '../src/game/engine/GameEngine.ts';

const targetLevelIds = [11, 12, 16];

for (const levelId of targetLevelIds) {
  const level = levels.find((entry) => entry.id === levelId);

  if (!level) {
    throw new Error(`Missing level ${levelId}`);
  }

  let maxSteps = 0;
  let maxSeed = '';
  let acceptedCount = 0;

  for (let seedIndex = 0; seedIndex < 200; seedIndex += 1) {
    const engine = new GameEngine({
      level,
      glossary,
      installId: `qa-install-${seedIndex}`,
      seedOverride: `seed-${seedIndex}`
    });
    const hintIds = engine.getFirstLegalMoveIds();

    if (!hintIds) {
      continue;
    }

    const snapshot = engine.getSnapshot();
    const positions = new Map<string, { row: number; col: number }>();
    snapshot.board.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        positions.set(tile.id, { row: rowIndex, col: colIndex });
      });
    });

    const first = positions.get(hintIds[0]);
    const second = positions.get(hintIds[1]);

    if (!first || !second) {
      continue;
    }

    const result = engine.trySwap(first, second);
    if (result.accepted) {
      acceptedCount += 1;
    }
    if (result.resolutionSteps.length > maxSteps) {
      maxSteps = result.resolutionSteps.length;
      maxSeed = `seed-${seedIndex}`;
    }
  }

  console.log(`level=${levelId} accepted=${acceptedCount}/200 maxSteps=${maxSteps} worstSeed=${maxSeed}`);
}
