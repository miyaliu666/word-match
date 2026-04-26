import { zhTranslations } from './zhTranslations';

export type SupportedCefr = 'A1' | 'A2' | 'B1' | 'B2';

export type WordText = {
  en: string;
  zh: string;
};

export type GlossaryWord = {
  id: string;
  text: WordText;
};

export type GlossaryGroup = {
  id: string;
  cefr: SupportedCefr;
  relationType:
    | 'synonym'
    | 'category'
    | 'action_family'
    | 'state_family'
    | 'object_family'
    | 'place_family'
    | 'person_family'
    | 'time_family';
  displayName: WordText;
  words: GlossaryWord[];
};

export type Glossary = {
  version: string;
  groups: GlossaryGroup[];
};

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

const CEFR_ORDER: SupportedCefr[] = ['A1', 'A2', 'B1', 'B2'];

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

const WORDS_BY_LEVEL: Record<SupportedCefr, Record<CategoryId, string[]>> = {
  A1: {
    food: [
      'apple', 'banana', 'biscuit', 'bread', 'butter', 'cake', 'cheese', 'coffee', 'egg', 'fish', 'fruit',
      'ice cream', 'juice', 'meat', 'milk', 'orange', 'pizza', 'potato', 'rice', 'salt', 'sandwich', 'soup',
      'sugar', 'tea', 'tomato', 'vegetable', 'wine'
    ],
    animals: ['bird', 'cat', 'cow', 'dog', 'horse', 'pig', 'sheep'],
    body: ['arm', 'back', 'body', 'ear', 'eye', 'face', 'foot', 'hair', 'hand', 'head', 'leg', 'mouth', 'nose', 'tooth'],
    clothes: ['dress', 'hat', 'jacket', 'shirt', 'shoe', 'skirt', 'sock', 'T-shirt', 'trouser'],
    jobs: ['cook', 'doctor', 'driver', 'teacher', 'waiter', 'waitress'],
    places: [
      'bank', 'bar', 'beach', 'cinema', 'city', 'farm', 'garden', 'hospital', 'hotel', 'house', 'museum', 'park',
      'restaurant', 'river', 'road', 'room', 'school', 'sea', 'shop', 'station', 'street', 'town', 'university', 'village'
    ],
    transport: ['bike', 'bus', 'car', 'plane', 'train'],
    house_objects: ['bed', 'chair', 'door', 'table', 'window'],
    nature: ['rain', 'snow', 'sun', 'wind'],
    people: [
      'adult', 'baby', 'boy', 'brother', 'child', 'dad', 'daughter', 'father', 'girl', 'husband', 'man',
      'mother', 'mum', 'parent', 'sister', 'son', 'wife', 'woman'
    ],
    basic_actions: [
      'dance', 'draw', 'drink', 'drive', 'kick', 'read', 'ride', 'run', 'sing', 'sit', 'sleep', 'smoke',
      'swim', 'talk', 'travel', 'visit', 'walk', 'wash', 'watch', 'wear', 'write'
    ]
  },
  A2: {
    food: ['bean', 'chicken', 'curry', 'grape', 'ham', 'jam', 'lemon', 'melon', 'oil', 'onion', 'orange', 'pasta', 'pear', 'pepper', 'salad', 'sauce'],
    animals: ['bat', 'bear', 'duck', 'elephant', 'insect', 'lion', 'monkey', 'mouse', 'rabbit', 'rat', 'snake'],
    body: ['blood', 'brain', 'finger', 'head', 'heart', 'neck', 'stomach', 'toe'],
    clothes: ['coat', 'glove', 'jeans', 'sweater', 'uniform'],
    jobs: [
      'actor', 'artist', 'chef', 'coach', 'cook', 'dancer', 'dentist', 'engineer', 'farmer', 'guide', 'manager', 'mechanic',
      'model', 'nurse', 'painter', 'photographer', 'pilot', 'policeman', 'policewoman', 'receptionist', 'secretary',
      'singer', 'tour guide', 'trainer'
    ],
    places: [
      'airport', 'bookshop', 'bridge', 'building', 'camp', 'castle', 'church', 'club', 'college', 'garage',
      'hill', 'island', 'lake', 'library', 'market', 'office', 'park', 'platform', 'playground', 'pub',
      'school', 'square', 'stadium', 'theatre', 'town'
    ],
    transport: ['boat', 'helicopter', 'motorbike', 'taxi', 'truck'],
    house_objects: ['bottle', 'box', 'cup', 'key', 'knife', 'lamp', 'plate'],
    nature: ['cloud', 'fog', 'storm'],
    people: ['adult', 'aunt', 'baby', 'cousin', 'grandfather', 'grandma', 'grandmother', 'grandpa', 'uncle'],
    basic_actions: [
      'arrive', 'climb', 'cut', 'enter', 'fall', 'hit', 'jump', 'kill', 'kiss', 'lift', 'pull', 'push',
      'skate', 'stand', 'swim', 'throw', 'tie', 'turn', 'walk', 'wash', 'win', 'write'
    ]
  },
  B1: {
    food: ['corn', 'flour', 'lettuce', 'pea', 'peach', 'pepper', 'tea'],
    animals: ['ant', 'bee', 'bull', 'frog', 'giraffe', 'goat', 'shark', 'spider', 'tiger', 'turkey', 'whale'],
    body: ['ankle', 'bone', 'breast', 'cheek', 'chin', 'elbow', 'forehead', 'knee', 'shoulder', 'skin', 'throat', 'thumb', 'tongue'],
    clothes: ['belt', 'boot', 'cap', 'suit'],
    jobs: [
      'accountant', 'assistant', 'athlete', 'author', 'baker', 'barber', 'builder', 'butcher', 'captain', 'coach',
      'designer', 'director', 'firefighter', 'hairdresser', 'judge', 'lawyer', 'musician', 'officer', 'poet', 'politician',
      'postman', 'president', 'priest', 'professor', 'reporter', 'sailor', 'scientist', 'soldier', 'trainer', 'travel agent',
      'vet', 'writer'
    ],
    places: ['camp', 'coast', 'court', 'harbour', 'neighbourhood', 'palace', 'parking', 'pharmacy', 'port', 'prison', 'shore', 'station', 'store', 'studio', 'temple'],
    transport: ['ship'],
    house_objects: ['mirror'],
    nature: ['climate', 'thunder'],
    people: ['bride', 'groom'],
    basic_actions: ['dig', 'drop', 'pour', 'push', 'reach', 'ride', 'rise', 'run', 'shake', 'shoot', 'skate', 'ski', 'slip', 'sleep', 'stop', 'tie', 'touch', 'turn', 'vote', 'travel', 'visit']
  },
  B2: {
    food: [],
    animals: ['crab', 'deer', 'eagle', 'fox', 'wolf', 'worm'],
    body: ['eyebrow', 'fingernail', 'hip', 'jaw', 'liver', 'lung', 'nail', 'waist', 'wrist'],
    clothes: [],
    jobs: [
      'banker', 'collector', 'conductor', 'consultant', 'economist', 'editor', 'electrician', 'fisherman', 'gardener', 'lecturer',
      'minister', 'official', 'operator', 'plumber', 'producer', 'psychologist', 'publisher', 'researcher', 'specialist', 'tutor'
    ],
    places: ['suburb'],
    transport: ['ferry'],
    house_objects: [],
    nature: ['dawn'],
    people: [],
    basic_actions: ['crawl']
  }
};

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

let wordCounter = 1;

function createWords(words: string[]): Array<[id: string, en: string, zh: string]> {
  return words.map((word) => {
    const id = `w_${String(wordCounter).padStart(5, '0')}`;
    wordCounter += 1;
    return [id, word, zhTranslations[word] ?? word];
  });
}

function buildLevelWords(level: SupportedCefr, category: CategoryId): string[] {
  return [...WORDS_BY_LEVEL[level][category]];
}

const generatedGroups: GlossaryGroup[] = CEFR_ORDER.flatMap((cefr) =>
  CATEGORY_ORDER.map((category) => {
    const meta = CATEGORY_META[category];
    const words = buildLevelWords(cefr, category);
    return createGroup(
      `g_${cefr.toLocaleLowerCase()}_${category}`,
      cefr,
      meta.relationType,
      meta.displayName,
      createWords(words)
    );
  })
);

export const glossary: Glossary = {
  version: '2.0.0',
  groups: generatedGroups
};
