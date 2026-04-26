import type { GlossaryGroup, GlossaryWord, WordText } from '../../data/glossary';

export type TileMeta = {
  id: string;
  word: string;
  translation: string;
  wordId: string;
};

export type WordMeta = {
  wordId: string;
  text: WordText;
  groupToken: string;
  groupLabel: string;
};

export type InternalBoard = Array<Array<string | null>>;

export type MatchSummary = {
  ids: string[];
  lineLengths: number[];
};

export type ActiveGroupState = {
  token: string;
  label: string;
  words: GlossaryWord[];
  unusedWordIds: string[];
};

export type GeneratedBoardState = {
  boardIds: InternalBoard;
  tileMetaById: Map<string, TileMeta>;
  groupTokenByTileId: Map<string, string>;
  wordMetaByWordId: Map<string, WordMeta>;
  activeGroups: ActiveGroupState[];
  seenWordIds: Set<string>;
};

export type EligibleGroup = Pick<GlossaryGroup, 'id' | 'displayName' | 'words'>;
