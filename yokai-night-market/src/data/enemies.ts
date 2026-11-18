import type { EnemyDef } from '../game/types';

// Every yokai here is drawn from public folklore (Japanese and Taiwanese) and designed for this game.
const list: EnemyDef[] = [
  // 1 鳥居參道
  { id: 'chochin', name: { zh: '提燈妖', en: 'Lantern Imp' }, lore: { zh: '跟著神社一起渡海來的紙燈籠，用太久，某天自己亮了起來。', en: 'A paper lantern that crossed the sea with the shrine. Used for so long that one night it lit itself.' }, hp: 10, dmg: 6, speed: 52, r: 12, xp: 1, ai: 'chase' },
  { id: 'hitodama', name: { zh: '人魂', en: 'Wisp' }, lore: { zh: '飄在參道上的小火球，沒有惡意，只是愛湊熱鬧。', en: 'A small drifting flame. Not hostile, just nosy.' }, hp: 6, dmg: 5, speed: 88, r: 9, xp: 1, ai: 'float' },
  { id: 'kasa', name: { zh: '唐傘小僧', en: 'Umbrella Hopper' }, lore: { zh: '被忘在神社的油紙傘，用一隻腳跳著找主人。', en: 'An oil-paper umbrella left at the shrine, hopping about on one leg.' }, hp: 22, dmg: 8, speed: 70, r: 13, xp: 2, ai: 'hop' },
  { id: 'daruma', name: { zh: '不倒翁', en: 'Daruma' }, lore: { zh: '許了願卻沒被畫上另一隻眼睛，一路滾來討。', en: 'Promised a second eye and never given one. It rolls after you to collect.' }, hp: 70, dmg: 10, speed: 36, r: 16, xp: 4, ai: 'chase', heavy: 0.6 },
  // 2 廟口夜市
  { id: 'fukuro', name: { zh: '茄芷袋妖', en: 'Rush Bag Spirit' }, lore: { zh: '藺草編的條紋茄芷袋，收攤後被風吹起來。', en: 'A striped woven rush bag picked up by the wind after closing.' }, hp: 7, dmg: 6, speed: 84, r: 10, xp: 1, ai: 'float' },
  { id: 'wan', name: { zh: '碗公妖', en: 'Bowl Spirit' }, lore: { zh: '缺了角的擔仔麵碗，還惦記著那碗沒吃完的麵。', en: 'A chipped bowl from a shoulder-pole noodle stand, still thinking about the unfinished serving.' }, hp: 14, dmg: 8, speed: 50, r: 13, xp: 2, ai: 'chase' },
  { id: 'kushi', name: { zh: '竹籤鬼', en: 'Skewer Ghost' }, lore: { zh: '烤完就被丟掉的竹籤，瞄準了就往前衝。', en: 'A skewer thrown away after grilling. It aims, then lunges.' }, hp: 16, dmg: 11, speed: 58, r: 10, xp: 2, ai: 'charge' },
  { id: 'saru', name: { zh: '小燈猴', en: 'Lamp Monkey' }, lore: { zh: '沒被請吃年夜飯的燈台精的小跟班，專偷供桌上的水果。', en: 'Followers of the lamp-stand spirit nobody invited to the New Year feast. They steal fruit off altars.' }, hp: 10, dmg: 7, speed: 92, r: 10, xp: 1, ai: 'chase' },
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
  { id: 'mosina', name: { zh: '魔神仔', en: 'Mosina' }, lore: { zh: '紅帽小矮人，會牽著人在城牆邊的樹林裡繞圈。', en: 'Small red-capped figures that lead walkers in circles among the trees by the old wall.' }, hp: 10, dmg: 9, speed: 96, r: 10, xp: 1, ai: 'chase' },
  { id: 'takesao', name: { zh: '竹篙鬼', en: 'Bamboo Pole Ghost' }, lore: { zh: '又高又瘦，橫躺在路上等人跨過去。', en: 'Tall and thin. It lies across the road and waits for someone to step over.' }, hp: 90, dmg: 14, speed: 40, r: 15, xp: 5, ai: 'chase', heavy: 0.7 },
  { id: 'tengu', name: { zh: '小天狗', en: 'Tengu Fledgling' }, lore: { zh: '還在練飛的天狗，先學會了丟羽毛。', en: 'Still learning to fly. Learned to throw feathers first.' }, hp: 24, dmg: 11, speed: 50, r: 13, xp: 3, ai: 'shoot', shot: { cd: 2.8, speed: 170, range: 270 } },
  { id: 'kodama', name: { zh: '木靈', en: 'Tree Echo' }, lore: { zh: '老榕樹的回聲，喊它它就靠過來。', en: 'The echo of an old banyan. Call out and it comes closer.' }, hp: 14, dmg: 10, speed: 74, r: 11, xp: 2, ai: 'hop' },
  // 6 溫泉街
  { id: 'kappa', name: { zh: '河童', en: 'Kappa' }, lore: { zh: '跟著內地的船來到安平港，頭上的盤子不能乾。', en: 'Came to Anping harbour on a ship from Japan. The dish on its head must stay wet.' }, hp: 26, dmg: 12, speed: 52, r: 13, xp: 3, ai: 'shoot', shot: { cd: 2.6, speed: 180, range: 280 } },
  { id: 'suiki', name: { zh: '水鬼', en: 'Water Ghost' }, lore: { zh: '在運河邊等替身，其實只是想找人聊天。', en: 'Waits by the canal for a replacement. Mostly wants someone to talk to.' }, hp: 14, dmg: 12, speed: 64, r: 12, xp: 1, ai: 'chase' },
  { id: 'nekomata', name: { zh: '貓又', en: 'Nekomata' }, lore: { zh: '漁港裡活太久的老貓，尾巴分成了兩條。', en: 'A harbour cat that lived so long its tail split in two.' }, hp: 10, dmg: 11, speed: 100, r: 10, xp: 1, ai: 'chase' },
  { id: 'oke', name: { zh: '蚵桶妖', en: 'Oyster Bucket' }, lore: { zh: '剛燙過蚵仔的木桶，冒著熱氣一蹦一蹦。', en: 'A wooden bucket fresh from scalding oysters, steaming as it bounces.' }, hp: 95, dmg: 15, speed: 62, r: 15, xp: 5, ai: 'hop', heavy: 0.6 },

  // added 2026-11-18 (art by Codex; they stay out of play until their pictures exist)
  { id: 'kuroneko', name: { zh: '黑貓', en: 'Black Cat' }, lore: { zh: '夜裡從屋簷跳下來的黑貓，專跟著燈籠光走。', en: 'A black cat that drops from the eaves at night and follows the lantern light.' }, hp: 12, dmg: 7, speed: 104, r: 10, xp: 1, ai: 'chase' },
  { id: 'hebi', name: { zh: '小青蛇', en: 'Little Green Snake' }, lore: { zh: '甘蔗田裡的小青蛇，在蔗葉之間左右鑽。', en: 'A small green snake that weaves left and right between the cane leaves.' }, hp: 10, dmg: 8, speed: 82, r: 9, xp: 1, ai: 'float' },
  { id: 'fengshi', name: { zh: '風獅爺', en: 'Wind Lion' }, lore: { zh: '立在村口鎮風煞的石獅，海風大的晚上會自己走動，吐出一陣風。', en: 'A stone lion set at the village edge to hold back ill winds. On gusty nights it walks, and breathes out a squall.' }, hp: 140, dmg: 13, speed: 34, r: 16, xp: 6, ai: 'shoot', heavy: 0.8, shot: { cd: 3, speed: 160, range: 260 } },
  { id: 'bixi', name: { zh: '贔屭', en: 'Bixi' }, lore: { zh: '赤崁樓前馱著御碑的石龜。相傳第十座的底座運上岸時掉進了海裡。', en: 'The stone tortoises carrying imperial steles at Chihkan Tower. The base of the tenth is said to have fallen into the sea as it was landed.' }, hp: 260, dmg: 15, speed: 26, r: 18, xp: 8, ai: 'chase', heavy: 0.9 },

  // bosses
  { id: 'b_toro', name: { zh: '燈籠大將', en: 'Lantern General' }, lore: { zh: '臺南神社參道上最老的那盞大燈籠，所有提燈妖都聽它的。', en: 'The oldest lantern on the approach to Tainan Shrine. Every lantern imp answers to it.' }, hp: 2600, dmg: 16, speed: 46, r: 34, xp: 60, ai: 'boss', heavy: 0.95, boss: { moves: ['ring', 'summon', 'dash'], minion: 'chochin' } },
  { id: 'b_lintou', name: { zh: '林投姐', en: 'Sister Lintou' }, lore: { zh: '清末府城的寡婦，被騙光家產後在林投樹下自盡。傳說她夜裡拿紙錢買肉粽，地點就在今天的民族路、西門路一帶。', en: 'A widow of late-Qing Tainan, cheated of everything, who died under a screw-pine tree. She is said to buy rice dumplings at night with spirit money, near today\'s Minzu and Ximen roads.' }, hp: 4200, dmg: 18, speed: 58, r: 32, xp: 80, ai: 'boss', heavy: 0.95, boss: { moves: ['aimed', 'summon', 'dash', 'ring'], minion: 'fukuro' } },
  { id: 'b_kinmei', name: { zh: '金魅', en: 'Kim-mui' }, lore: { zh: '幫忙做家事的宅鬼，代價是每年要吃一個人。料亭的榻榻米總是擦得太乾淨。', en: 'A house spirit that does the chores. Its yearly price is one person. The tatami here is always a little too clean.' }, hp: 6200, dmg: 20, speed: 50, r: 32, xp: 100, ai: 'boss', heavy: 0.95, boss: { moves: ['spiral', 'summon', 'ring', 'aimed'], minion: 'zashiki' } },
  { id: 'b_train', name: { zh: '朧五分車', en: 'Phantom Sugar Train' }, lore: { zh: '製糖會社的五分仔車，軌距只有國際標準的一半。收工後還在載不存在的甘蔗。', en: 'A sugar company train on half-gauge track. After hours it still hauls cane that is not there.' }, hp: 9000, dmg: 24, speed: 44, r: 38, xp: 120, ai: 'boss', heavy: 1, boss: { moves: ['dash', 'dash', 'ring', 'summon'], minion: 'susu' } },
  { id: 'b_shouniang', name: { zh: '陳守娘', en: 'Chen Shou-niang' }, lore: { zh: '清道光年間守節而被害的女子，化成一道青光在府城作祟，連廣澤尊王也壓不住。觀音出面調停後，她的牌位入祀孔廟節孝祠。', en: 'A widow wronged and killed in Daoguang-era Tainan. Her spirit roamed the city as a blue-green light that even Guangze Zunwang could not subdue. After Guanyin mediated, her tablet was placed in the Shrine of Chastity at the Confucius Temple.' }, hp: 12500, dmg: 26, speed: 64, r: 32, xp: 150, ai: 'boss', heavy: 0.95, boss: { moves: ['spiral', 'dash', 'aimed', 'summon'], minion: 'hitodama' } },
  { id: 'b_kun', name: { zh: '大鯤', en: 'The Great Kun' }, lore: { zh: '安平舊名一鯤鯓，沙洲遠看像浮在海上的鯨背。也有人說國姓爺是東海長鯨轉世。', en: 'Anping was once called Yi-kun-shen: a sandbar like a whale\'s back on the sea. Some say Koxinga himself was a great whale reborn.' }, hp: 17000, dmg: 30, speed: 60, r: 40, xp: 200, ai: 'boss', heavy: 1, boss: { moves: ['dash', 'ring', 'spiral', 'aimed', 'summon'], minion: 'suiki' } },

  // breakable stone lantern: no threat, drops a pickup
  { id: 'toro', name: { zh: '石燈籠', en: 'Stone Lantern' }, lore: { zh: '打破會掉出東西。', en: 'Break it and something falls out.' }, hp: 1, dmg: 0, speed: 0, r: 14, xp: 0, ai: 'still', heavy: 1 },
];

export const ENEMY: Record<string, EnemyDef> = Object.fromEntries(list.map((e) => [e.id, e]));
export const ENEMIES = list;
export const CODEX = list.filter((e) => e.id !== 'toro');
