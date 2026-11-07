import type { L, Mod } from '../game/types';

/**
 * Gifts and curses. Each time a soul sinks into the Abyss (rebirth), the Abyss offers
 * three gift + curse pairs. You take one pair or refuse. The pact lasts that one life.
 */
export interface PactDef { key: string; name: L; line: L; mods: Mod[]; stat: string }

export const GIFTS: PactDef[] = [
  { key: 'blood', stat: 'hp', name: { zh: '血之餽贈', en: 'Gift of Blood' }, line: { zh: '「多給你一點血。反正最後都會流回我這裡。」', en: '"Have a little more blood. It all flows back to me in the end."' }, mods: [{ key: 'hp', mul: 0.3 }] },
  { key: 'blade', stat: 'atk', name: { zh: '刃之餽贈', en: 'Gift of the Blade' }, line: { zh: '「去斬吧。斬得越多，落下來的越多。」', en: '"Go and cut. The more you cut, the more fall to me."' }, mods: [{ key: 'atk', mul: 0.2 }] },
  { key: 'gold', stat: 'gold', name: { zh: '金之餽贈', en: 'Gift of Gold' }, line: { zh: '「深淵底下的金幣，從來沒人回來拿。」', en: '"No one ever comes back for the gold down here."' }, mods: [{ key: 'gold', mul: 0.5 }] },
  { key: 'memory', stat: 'xp', name: { zh: '記憶之餽贈', en: 'Gift of Memory' }, line: { zh: '「把上一個你學會的，還一點給你。」', en: '"I return a little of what your last self learned."' }, mods: [{ key: 'xp', mul: 0.3 }] },
  { key: 'star', stat: 'crit', name: { zh: '凶星之餽贈', en: 'Gift of the Ill Star' }, line: { zh: '「你的星星很亮。亮得不太吉利。」', en: '"Your star burns bright. Too bright to be lucky."' }, mods: [{ key: 'crit', add: 0.08 }] },
  { key: 'whisper', stat: 'magic', name: { zh: '低語之餽贈', en: 'Gift of Whispers' }, line: { zh: '「我教你幾個字。別在白天念。」', en: '"I will teach you a few words. Do not say them by day."' }, mods: [{ key: 'magic', mul: 0.3 }, { key: 'mp', mul: 0.3 }] },
  { key: 'fang', stat: 'petPower', name: { zh: '獠牙之餽贈', en: 'Gift of Fangs' }, line: { zh: '「你的小東西們，也該長點牙了。」', en: '"Your little ones ought to grow some teeth."' }, mods: [{ key: 'petPower', mul: 0.6 }] },
  { key: 'clarity', stat: 'san', name: { zh: '清明之餽贈', en: 'Gift of Clarity' }, line: { zh: '「我讓你暫時看不見我。暫時。」', en: '"I will let you not see me. For a while."' }, mods: [{ key: 'sanDrain', mul: -0.5 }] },
  { key: 'fortune', stat: 'drop', name: { zh: '拾遺之餽贈', en: 'Gift of Gleaning' }, line: { zh: '「掉在路上的東西，你都會看見。」', en: '"Whatever falls by the road, you will see it."' }, mods: [{ key: 'drop', mul: 0.4 }, { key: 'luk', add: 10 }] },
];

export const CURSES: PactDef[] = [
  { key: 'brittle', stat: 'def', name: { zh: '脆骨之詛咒', en: 'Curse of Brittle Bones' }, line: { zh: '你的骨頭記得上一次是怎麼碎的。', en: 'Your bones remember how they broke last time.' }, mods: [{ key: 'def', mul: -0.3 }] },
  { key: 'pale', stat: 'hp', name: { zh: '蒼白之詛咒', en: 'Curse of Pallor' }, line: { zh: '有一部分的你留在了下面。', en: 'Part of you stayed down there.' }, mods: [{ key: 'hp', mul: -0.15 }] },
  { key: 'chain', stat: 'speed', name: { zh: '鎖鏈之詛咒', en: 'Curse of Chains' }, line: { zh: '腳踝上有看不見的東西拉著你往下。', en: 'Something unseen at your ankle pulls you down.' }, mods: [{ key: 'speed', mul: -0.1 }] },
  { key: 'poor', stat: 'gold', name: { zh: '漏財之詛咒', en: 'Curse of Leaking Purses' }, line: { zh: '錢包的底，通往深淵。', en: 'The bottom of your purse opens onto the Abyss.' }, mods: [{ key: 'gold', mul: -0.3 }] },
  { key: 'forget', stat: 'xp', name: { zh: '遺忘之詛咒', en: 'Curse of Forgetting' }, line: { zh: '每晚醒來，你都少記得一件事。', en: 'Each night you wake knowing one thing less.' }, mods: [{ key: 'xp', mul: -0.15 }] },
  { key: 'tremor', stat: 'bal', name: { zh: '顫抖之詛咒', en: 'Curse of Trembling' }, line: { zh: '握劍的手，偶爾不是你在控制。', en: 'Now and then, the hand on the sword is not yours.' }, mods: [{ key: 'bal', add: -0.1 }] },
  { key: 'lonely', stat: 'petPower', name: { zh: '孤影之詛咒', en: 'Curse of the Lone Shadow' }, line: { zh: '夥伴們不太敢靠近你。', en: 'Your pals keep a little distance now.' }, mods: [{ key: 'petPower', mul: -0.4 }] },
  { key: 'dread', stat: 'san', name: { zh: '凝視之詛咒', en: 'Curse of the Gaze' }, line: { zh: '你一閉上眼，就看見那隻眼睛。', en: 'Whenever you close your eyes, the eye is there.' }, mods: [{ key: 'sanDrain', mul: 0.6 }] },
  { key: 'dim', stat: 'crit', name: { zh: '晦暗之詛咒', en: 'Curse of Dimming' }, line: { zh: '你看不清弱點在哪裡了。', en: 'You can no longer see where the weak spots are.' }, mods: [{ key: 'crit', add: -0.04 }] },
];

export type Pact = [string, string]; // [gift key, curse key]
export const giftOf = (k: string) => GIFTS.find(g => g.key === k);
export const curseOf = (k: string) => CURSES.find(c => c.key === k);
export const PACT_OFFERS = 3;
