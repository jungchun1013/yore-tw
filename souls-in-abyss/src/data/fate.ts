import type { L } from '../game/types';

/** Rare narrator lines. Easter eggs only: they never gate anything except one secret title. */
export const FATE_CHANCE = 1 / 1500;
export const FATE_LINES: L[] = [
  { zh: '（某處，有人在書頁的空白處寫下了你剛剛擊倒的怪物名字。）', en: '(Somewhere, someone writes the name of the monster you just felled in a margin.)' },
  { zh: '（你突然確定，這一戰你以前打過。）', en: '(You are suddenly certain you have fought this exact fight before.)' },
  { zh: '（腳下傳來很輕的心跳聲。不是你的。）', en: '(A faint heartbeat comes from beneath your feet. Not yours.)' },
  { zh: '（勇者會打倒魔王，然後落入深淵。書上是這麼寫的。書上一直都是這麼寫的。）', en: '(The hero defeats the demon lord, then falls into the Abyss. The book says so. The book has always said so.)' },
  { zh: '（深淵底有什麼睜開了眼睛，認出了你，又閉上了。）', en: '(At the bottom of the Abyss something opens an eye, recognises you, and closes it again.)' },
  { zh: '（你的影子比剛才長了一點，而且朝下。）', en: '(Your shadow is a little longer than before, and it points down.)' },
];
export const REBIRTH_LINES: L[] = [
  { zh: '你在選擇種族時猶豫了一下。上一次也是。', en: 'You hesitate over your race. You did last time, too.' },
  { zh: '深淵底下很安靜。安靜到你聽得見上一個自己。', en: 'It is quiet at the bottom. Quiet enough to hear your last self.' },
  { zh: '新的旅程開始了。和上一次一模一樣地開始了。', en: 'A new journey begins. Exactly like the last one began.' },
  { zh: '你浮上來的時候，手裡握著一樣東西。你想不起來是什麼。', en: 'You surface holding something. You cannot remember what.' },
];
