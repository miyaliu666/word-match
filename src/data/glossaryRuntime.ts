import type { Glossary, GlossaryGroup, GlossaryWord, SupportedCefr } from './glossary';
import type { LevelDefinition } from './levels';

type GlossaryModule = { glossary: Glossary };

const GLOSSARY_LOADERS: Record<SupportedCefr, () => Promise<GlossaryModule>> = {
  A1: () => import('./glossaryChunks/a1'),
  A2: () => import('./glossaryChunks/a2'),
  B1: () => import('./glossaryChunks/b1'),
  B2: () => import('./glossaryChunks/b2')
};

function pickRandomDistinctItems<T>(items: T[], count: number, random: () => number): T[] {
  const pool = [...items];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, count);
}

function trimGroupWords(group: GlossaryGroup, maxWords: number, random: () => number): GlossaryGroup {
  const words =
    group.words.length <= maxWords
      ? group.words
      : pickRandomDistinctItems<GlossaryWord>(group.words, maxWords, random);

  return {
    ...group,
    words
  };
}

export async function loadGlossaryForCefr(cefr: SupportedCefr): Promise<Glossary> {
  const module = await GLOSSARY_LOADERS[cefr]();
  return module.glossary;
}

export function buildSessionGlossary(
  level: LevelDefinition,
  sourceGlossary: Glossary,
  random: () => number
): Glossary {
  const eligibleGroups = sourceGlossary.groups.filter((group) => group.words.length >= level.maxWordsPerGroup);

  if (eligibleGroups.length < level.groupsPerBoard) {
    throw new Error('Not enough groups to create a session glossary.');
  }

  const groupBudget = Math.min(eligibleGroups.length, level.groupsPerBoard + 1);
  const wordBudget = level.maxWordsPerGroup + 2;
  const selectedGroups = pickRandomDistinctItems(eligibleGroups, groupBudget, random)
    .map((group) => trimGroupWords(group, wordBudget, random));

  return {
    version: `${sourceGlossary.version}-session`,
    groups: selectedGroups
  };
}
