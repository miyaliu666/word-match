import { zhTranslations } from '../zhTranslations';
import type { Glossary, GlossaryGroup, SupportedCefr, WordText } from '../glossary';

type CategoryId =
  | 'food'
  | 'animals'
  | 'body'
  | 'clothes'
  | 'jobs'
  | 'places'
  | 'transport'
  | 'house_objects'
  | 'nature'
  | 'people'
  | 'basic_actions';

const CATEGORY_ORDER: CategoryId[] = [
  'food',
  'animals',
  'body',
  'clothes',
  'jobs',
  'places',
  'transport',
  'house_objects',
  'nature',
  'people',
  'basic_actions'
];

const CATEGORY_META: Record<
  CategoryId,
  { relationType: GlossaryGroup['relationType']; displayName: WordText }
> = {
  food: { relationType: 'object_family', displayName: { en: 'Food', zh: '食物' } },
  animals: { relationType: 'category', displayName: { en: 'Animals', zh: '动物' } },
  body: { relationType: 'category', displayName: { en: 'Body', zh: '身体' } },
  clothes: { relationType: 'object_family', displayName: { en: 'Clothes', zh: '服装' } },
  jobs: { relationType: 'person_family', displayName: { en: 'Jobs', zh: '职业' } },
  places: { relationType: 'place_family', displayName: { en: 'Places', zh: '地点' } },
  transport: { relationType: 'object_family', displayName: { en: 'Transport', zh: '交通工具' } },
  house_objects: {
    relationType: 'object_family',
    displayName: { en: 'House Objects', zh: '家居物品' }
  },
  nature: { relationType: 'category', displayName: { en: 'Nature', zh: '自然' } },
  people: { relationType: 'person_family', displayName: { en: 'People', zh: '人物' } },
  basic_actions: {
    relationType: 'action_family',
    displayName: { en: 'Basic Actions', zh: '基础动作' }
  }
};

let wordCounter = 1;

function createWords(words: string[]): Array<[id: string, en: string, zh: string]> {
  return words.map((word) => {
    const id = `w_${String(wordCounter).padStart(5, '0')}`;
    wordCounter += 1;
    return [id, word, zhTranslations[word] ?? word];
  });
}

function createGroup(
  id: string,
  cefr: SupportedCefr,
  relationType: GlossaryGroup['relationType'],
  displayName: WordText,
  words: Array<[id: string, en: string, zh: string]>
): GlossaryGroup {
  return {
    id,
    cefr,
    relationType,
    displayName,
    words: words.map(([wordId, en, zh]) => ({ id: wordId, text: { en, zh } }))
  };
}

export function createGlossaryForLevel(
  cefr: SupportedCefr,
  wordsByCategory: Record<CategoryId, string[]>
): Glossary {
  const groups = CATEGORY_ORDER.map((category) => {
    const meta = CATEGORY_META[category];
    const words = wordsByCategory[category] ?? [];
    return createGroup(
      `g_${cefr.toLocaleLowerCase()}_${category}`,
      cefr,
      meta.relationType,
      meta.displayName,
      createWords(words)
    );
  });

  return {
    version: '2.1.0',
    groups
  };
}
