import type { EnemyDef } from '../game/types';

// Every yokai here is drawn from public folklore (Japanese and Taiwanese) and designed for this game.
const list: EnemyDef[] = [
  // 1 鳥居參道
  { id: 'chochin', name: { zh: '提燈妖', en: 'Lantern Imp' }, lore: { zh: '用了太久的紙燈籠，某天自己亮了起來。', en: 'A paper lantern used for so long that one night it lit itself.' }, hp: 10, dmg: 6, speed: 52, r: 12, xp: 1, ai: 'chase' },
  { id: 'hitodama', name: { zh: '人魂', en: 'Wisp' }, lore: { zh: '飄在參道上的小火球，沒有惡意，只是愛湊熱鬧。', en: 'A small drifting flame. Not hostile, just nosy.' }, hp: 6, dmg: 5, speed: 88, r: 9, xp: 1, ai: 'float' },
  { id: 'kasa', name: { zh: '唐傘小僧', en: 'Umbrella Hopper' }, lore: { zh: '被忘在神社的油紙傘，用一隻腳跳著找主人。', en: 'An oil-paper umbrella left at the shrine, hopping about on one leg.' }, hp: 22, dmg: 8, speed: 70, r: 13, xp: 2, ai: 'hop' },
  { id: 'daruma', name: { zh: '不倒翁', en: 'Daruma' }, lore: { zh: '許了願卻沒被畫上另一隻眼睛，一路滾來討。', en: 'Promised a second eye and never given one. It rolls after you to collect.' }, hp: 70, dmg: 10, speed: 36, r: 16, xp: 4, ai: 'chase', heavy: 0.6 },
  // 2 廟口夜市
  { id: 'fukuro', name: { zh: '紅白袋妖', en: 'Bag Spirit' }, lore: { zh: '夜市收攤後被風吹起來的紅白塑膠袋。', en: 'A red-and-white carrier bag picked up by the wind after closing.' }, hp: 7, dmg: 6, speed: 84, r: 10, xp: 1, ai: 'float' },
  { id: 'wan', name: { zh: '碗公妖', en: 'Bowl Spirit' }, lore: { zh: '缺了角的大碗公，還惦記著那碗沒吃完的麵。', en: 'A chipped noodle bowl still thinking about the unfinished serving.' }, hp: 14, dmg: 8, speed: 50, r: 13, xp: 2, ai: 'chase' },
  { id: 'kushi', name: { zh: '竹籤鬼', en: 'Skewer Ghost' }, lore: { zh: '烤完就被丟掉的竹籤，瞄準了就往前衝。', en: 'A skewer thrown away after grilling. It aims, then lunges.' }, hp: 16, dmg: 11, speed: 58, r: 10, xp: 2, ai: 'charge' },
  { id: 'saru', name: { zh: '小燈猴', en: 'Lamp Monkey' }, lore: { zh: '燈猴的小跟班，專偷供桌上的水果。', en: 'The Lantern Monkey\'s little followers. They steal fruit off altars.' }, hp: 10, dmg: 7, speed: 92, r: 10, xp: 1, ai: 'chase' },
  // 3 日式老宿舍
  { id: 'hitotsume', name: { zh: '一目小僧', en: 'One-Eyed Boy' }, lore: { zh: '在長廊盡頭探頭的獨眼小和尚。', en: 'A one-eyed novice peeking from the end of the corridor.' }, hp: 13, dmg: 9, speed: 56, r: 12, xp: 1, ai: 'chase' },
  { id: 'akaname', name: { zh: '垢嘗', en: 'Grime Licker' }, lore: { zh: '浴室沒刷乾淨就會出現，舌頭很長。', en: 'Shows up when the bath is not scrubbed. Very long tongue.' }, hp: 9, dmg: 8, speed: 94, r: 10, xp: 1, ai: 'chase' },
  { id: 'isu', name: { zh: '椅仔姑', en: 'Chair Maiden' }, lore: { zh: '住在竹椅裡的小姑娘，問什麼都用敲的回答。', en: 'A girl spirit living in a bamboo chair. She answers by knocking.' }, hp: 24, dmg: 9, speed: 44, r: 13, xp: 3, ai: 'shoot', shot: { cd: 3.2, speed: 150, range: 250 } },
  { id: 'zashiki', name: { zh: '座敷童子', en: 'Parlor Child' }, lore: { zh: '在榻榻米上跑來跑去的孩子，看得到的人會走運。', en: 'A child running across the tatami. Seeing one is said to be lucky.' }, hp: 22, dmg: 10, speed: 76, r: 12, xp: 2, ai: 'hop' },
  // 4 糖廠鐵道
  { id: 'susu', name: { zh: '煤煙鬼', en: 'Soot Sprite' }, lore: { zh: '從煙囪掉下來的煤灰團，一群一群出現。', en: 'Clumps of soot shaken out of the chimney, always in swarms.' }, hp: 7, dmg: 7, speed: 90, r: 9, xp: 1, ai: 'float' },
  { id: 'wanyudo', name: { zh: '輪入道', en: 'Wheel Monk' }, lore: { zh: '著火的車輪，沿著鐵軌滾得比五分車還快。', en: 'A burning wheel that outruns the sugar train along its own rails.' }, hp: 24, dmg: 14, speed: 60, r: 14, xp: 3, ai: 'charge' },
  { id: 'kansho', name: { zh: '甘蔗妖', en: 'Cane Stalk' }, lore: { zh: '沒被收走的甘蔗，站在田邊站成了精。', en: 'A cane left unharvested until it stood there long enough to wake up.' }, hp: 80, dmg: 12, speed: 38, r: 15, xp: 5, ai: 'chase', heavy: 0.6 },
  { id: 'ushi', name: { zh: '水牛魂', en: 'Buffalo Shade' }, lore: { zh: '拉了一輩子蔗車的老水牛，還在走同一條路。', en: 'An old buffalo that hauled cane carts all its life and still walks the route.' }, hp: 26, dmg: 13, speed: 54, r: 16, xp: 2, ai: 'chase', heavy: 0.4 },
  // 5 霧山竹林
  { id: 'mosina', name: { zh: '魔神仔', en: 'Mosina' }, lore: { zh: '山裡的紅帽小矮人，會牽著人在林子裡繞圈。', en: 'Small red-capped figures of the hills that lead walkers in circles.' }, hp: 10, dmg: 9, speed: 96, r: 10, xp: 1, ai: 'chase' },
  { id: 'takesao', name: { zh: '竹篙鬼', en: 'Bamboo Pole Ghost' }, lore: { zh: '又高又瘦，橫躺在山路上等人跨過去。', en: 'Tall and thin. It lies across the trail and waits for someone to step over.' }, hp: 90, dmg: 14, speed: 40, r: 15, xp: 5, ai: 'chase', heavy: 0.7 },
  { id: 'tengu', name: { zh: '小天狗', en: 'Tengu Fledgling' }, lore: { zh: '還在練飛的天狗，先學會了丟羽毛。', en: 'Still learning to fly. Learned to throw feathers first.' }, hp: 24, dmg: 11, speed: 50, r: 13, xp: 3, ai: 'shoot', shot: { cd: 2.8, speed: 170, range: 270 } },
  { id: 'kodama', name: { zh: '木靈', en: 'Tree Echo' }, lore: { zh: '老檜木的回聲，喊它它就靠過來。', en: 'The echo of an old cypress. Call out and it comes closer.' }, hp: 14, dmg: 10, speed: 74, r: 11, xp: 2, ai: 'hop' },
  // 6 溫泉街
  { id: 'kappa', name: { zh: '河童', en: 'Kappa' }, lore: { zh: '泡在溫泉溪裡，頭上的盤子不能乾。', en: 'Soaks in the hot-spring creek. The dish on its head must stay wet.' }, hp: 26, dmg: 12, speed: 52, r: 13, xp: 3, ai: 'shoot', shot: { cd: 2.6, speed: 180, range: 280 } },
  { id: 'suiki', name: { zh: '水鬼', en: 'Water Ghost' }, lore: { zh: '在溪邊等替身，其實只是想找人聊天。', en: 'Waits by the creek for a replacement. Mostly wants someone to talk to.' }, hp: 14, dmg: 12, speed: 64, r: 12, xp: 1, ai: 'chase' },
  { id: 'nekomata', name: { zh: '貓又', en: 'Nekomata' }, lore: { zh: '活太久的旅館老貓，尾巴分成了兩條。', en: 'The inn\'s cat lived so long its tail split in two.' }, hp: 10, dmg: 11, speed: 100, r: 10, xp: 1, ai: 'chase' },
  { id: 'oke', name: { zh: '湯桶妖', en: 'Bath Bucket' }, lore: { zh: '澡堂的檜木桶，冒著熱氣一蹦一蹦。', en: 'A cypress bath bucket, steaming as it bounces.' }, hp: 95, dmg: 15, speed: 62, r: 15, xp: 5, ai: 'hop', heavy: 0.6 },

  // bosses
  { id: 'b_toro', name: { zh: '燈籠大將', en: 'Lantern General' }, lore: { zh: '參道上最老的那盞大燈籠，所有提燈妖都聽它的。', en: 'The oldest lantern on the approach. Every lantern imp answers to it.' }, hp: 2600, dmg: 16, speed: 46, r: 34, xp: 60, ai: 'boss', heavy: 0.95, boss: { moves: ['ring', 'summon', 'dash'], minion: 'chochin' } },
  { id: 'b_denghou', name: { zh: '燈猴', en: 'Lantern Monkey' }, lore: { zh: '沒被請吃年夜飯的燈台精，記恨到現在。', en: 'The lamp-stand spirit nobody invited to the New Year feast. Still sour about it.' }, hp: 4200, dmg: 18, speed: 62, r: 32, xp: 80, ai: 'boss', heavy: 0.95, boss: { moves: ['dash', 'aimed', 'summon', 'dash'], minion: 'saru' } },
  { id: 'b_kinmei', name: { zh: '金魅', en: 'Kim-mui' }, lore: { zh: '幫忙做家事的宅鬼，代價是每年要吃一個人。', en: 'A house spirit that does the chores. Its yearly price is one person.' }, hp: 6200, dmg: 20, speed: 50, r: 32, xp: 100, ai: 'boss', heavy: 0.95, boss: { moves: ['spiral', 'summon', 'ring', 'aimed'], minion: 'zashiki' } },
  { id: 'b_train', name: { zh: '朧五分車', en: 'Phantom Sugar Train' }, lore: { zh: '停駛多年的小火車，半夜還在載不存在的甘蔗。', en: 'A sugar train retired years ago, still hauling cane that is not there.' }, hp: 9000, dmg: 24, speed: 44, r: 38, xp: 120, ai: 'boss', heavy: 1, boss: { moves: ['dash', 'dash', 'ring', 'summon'], minion: 'susu' } },
  { id: 'b_mosina', name: { zh: '魔神仔王', en: 'Mosina King' }, lore: { zh: '整座山的魔神仔都是牠的影子。', en: 'Every mosina on the mountain is one of its shadows.' }, hp: 12500, dmg: 26, speed: 66, r: 32, xp: 150, ai: 'boss', heavy: 0.95, boss: { moves: ['summon', 'spiral', 'dash', 'aimed'], minion: 'mosina' } },
  { id: 'b_tiger', name: { zh: '虎姑婆', en: 'Aunt Tiger' }, lore: { zh: '披著老婆婆外衣的老虎精，專挑不睡覺的小孩。', en: 'A tiger spirit in an old woman\'s clothes. She comes for children who will not sleep.' }, hp: 17000, dmg: 30, speed: 70, r: 34, xp: 200, ai: 'boss', heavy: 0.95, boss: { moves: ['dash', 'ring', 'aimed', 'spiral', 'summon'], minion: 'nekomata' } },

  // breakable stone lantern: no threat, drops a pickup
  { id: 'toro', name: { zh: '石燈籠', en: 'Stone Lantern' }, lore: { zh: '打破會掉出東西。', en: 'Break it and something falls out.' }, hp: 1, dmg: 0, speed: 0, r: 14, xp: 0, ai: 'still', heavy: 1 },
];

export const ENEMY: Record<string, EnemyDef> = Object.fromEntries(list.map((e) => [e.id, e]));
export const ENEMIES = list;
export const CODEX = list.filter((e) => e.id !== 'toro');
