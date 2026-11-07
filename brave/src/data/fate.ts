import type { L } from '../game/types';

/** Rare narrator lines. Easter eggs only: they never gate anything except one secret title. */
export const FATE_CHANCE = 1 / 1500;
export const FATE_LINES: L[] = [
  { zh: '（某處，有人在書頁的空白處寫下了你剛剛擊倒的怪物名字。）', en: '(Somewhere, someone writes the name of the monster you just felled in a margin.)' },
  { zh: '（你突然確定，這一戰你以前打過。）', en: '(You are suddenly certain you have fought this exact fight before.)' },
  { zh: '（星星的排列和你出發那天一樣。這不可能。）', en: '(The stars sit exactly as on the day you set out. That is not possible.)' },
  { zh: '（勇者會打倒魔王。書上是這麼寫的。書上一直都是這麼寫的。）', en: '(The hero defeats the demon lord. The book says so. The book has always said so.)' },
  { zh: '（遠方有什麼睜開了眼睛，又覺得無聊，閉上了。）', en: '(Far away, something opens an eye, finds this dull, and closes it.)' },
];
export const REBIRTH_LINES: L[] = [
  { zh: '你在選擇種族時猶豫了一下。上一次也是。', en: 'You hesitate over your race. You did last time, too.' },
  { zh: '草原上的史萊姆看起來有點眼熟。', en: 'The meadow slime looks oddly familiar.' },
  { zh: '新的旅程開始了。和上一次一模一樣地開始了。', en: 'A new journey begins. Exactly like the last one began.' },
];
