> **Codex 獨立紙藝比較版**：執行 `npm run dev`，開啟 http://127.0.0.1:5204/?atelier 看展示／對照，或 http://127.0.0.1:5204/ 玩新版。範圍與限制見 [ART-DIRECTION.md](ART-DIRECTION.md)。以下保留原遊戲說明。

# 百鬼夜市 Yokai Night Market

A survivors-style action game set in Tainan around 1930: walk from the shrine approach to Anping at night, let your charms and firecrackers fire on their own, pick one of three upgrades each level, and last fifteen minutes until dawn. Chapter 1 has six stages.

Plain TypeScript and Canvas 2D, no engine and no asset files. Sprites are drawn in code at load; sound is synthesised with WebAudio.

## Paper-doll art

Everything on screen is built the way a paper doll is: no outlines, only cut sheets stacked back to front. In `src/render/kit.ts` every filled shape, and every thick coloured strip, becomes its own sheet; when the next sheet is laid on top the previous one is pressed onto the stack with a tight contact shadow and a softer wide one. Volume comes only from that order, so a draw function goes far limbs, body, head, hair, then what is glued on the face. Thin lines and dots are printed on whichever sheet is on top and cast no shadow. `sheet(c)` lifts a group of printed marks onto a layer of its own.

The stack is flattened once into a sprite, so drawing costs the same as before. In motion a figure rocks around its feet like a doll on a stick; it never squashes. Colours follow washi paper: cream grounds with a faint wave pattern, vermilion, mustard, olive, teal and brown.

```
npm run dev -w yokai-night-market      # http://localhost:5200  (add ?debug for the test hooks)
npm run build -w yokai-night-market
npm test -w yokai-night-market         # Playwright, desktop + phone
npm run sim -w yokai-night-market      # headless balance run, see below
```

## Content

| Stage | Setting | Yokai | Boss |
|---|---|---|---|
| 臺南神社參道 | Shrine grounds across from the Confucius Temple, beside the Butokuden (1936) | 提燈妖, 人魂, 唐傘小僧, 不倒翁 | 燈籠大將 |
| 末廣町銀座 | Hayashi Department Store (1932, rooftop Suehiro shrine) and the Sakariba stalls | 碗公妖, 茄芷袋妖, 小燈猴, 竹籤鬼 | 林投姐 |
| 鶯料理 | The ryotei beside the weather observatory | 一目小僧, 垢嘗, 椅仔姑, 座敷童子 | 金魅 |
| 糖廠鐵道 | Cane fields and the narrow-gauge sugar line after the Chianan Canal (1930) | 煤煙鬼, 水牛魂, 輪入道, 甘蔗妖 | 朧五分車 |
| 孔廟・大南門 | The red walls of the Confucius Temple, where the Shrine of Chastity stands | 魔神仔, 木靈, 椅仔姑, 竹篙鬼 | 陳守娘 |
| 安平 | Sword lions, salt pans, screw pines, the end of the canal (opened 1926) | 水鬼, 貓又, 河童, 蚵桶妖 | 大鯤 |

Japanese yokai sit around the places the Japanese built (shrine, ryotei, railway); local spirits hold the older quarters. Deities are never enemies: they appear only as tools (魁星筆, 筊杯, 虎爺, 劍獅, the 蜂炮 of Yanshui). The two famous ghosts are bosses you lay to rest, and the stage tag reads 已安魂. All designs and art are made for this game.

- 9 weapons, 6 levels each, each with an evolution unlocked by carrying its paired passive at max level and opening an offering box: 符札 → 千枚札, 鞭炮 → 蜂炮, 魁星筆 → 魁星點斗, 筊杯 → 三聖筊 and so on (`src/data/weapons.ts`).
- 10 passives (`src/data/passives.ts`), 5 weapon slots and 5 passive slots per run.
- 3 characters: 小滿 (shrine apprentice) from the start, 阿燈 (a 五條港 kid just past his sixteenth-year rite) after 2 stages cleared, 雲平 (a Butokuden kendo student) after 4.
- 11 permanent ema upgrades bought with coins. Coins are kept when a run is lost.
- Run timeline: elites at 4:00, 8:00 and 11:00 (each drops an offering box), a night parade at 6:00 and 10:30, an encirclement at 7:30 and 12:00, the boss at 13:00, dawn at 15:00. Surviving to dawn clears the stage; beating the boss is optional.
- zh-TW and English, chosen from the browser language and switchable on the title screen.
- Keyboard (arrows / WASD, 1–4 to pick an upgrade, Esc to pause) and a floating touch stick.

## Sources for the setting

Folklore is retold in one or two lines in the codex; where versions differ the common one is used and no real person from the 1920s-30s canal case is named.

- 林百貨: opened 5 Dec 1932 in 末廣町, known as 五層樓仔, with a rooftop shrine (末廣社). https://en.wikipedia.org/wiki/Hayashi_Department_Store , https://spectralcodex.com/tainan-hayashi-department-store/ , https://www.cna.com.tw/news/aloc/201610160026.aspx
- 臺南州廳 1916, 武德殿 1936 beside the Confucius Temple and the shrine's outer garden, 鶯料理. https://www.thenewslens.com/article/96054 , https://www.tsunagujapan.com/zh-hant/butokuden/
- 陳守娘: recorded in 劉家謀《海音詩》(1855) and 連橫《臺灣通史》; blue-green light, the fight with 廣澤尊王, Guanyin's mediation, tablet in the 節孝祠. https://news.pts.org.tw/article/589810 , https://www.thenewslens.com/article/121049
- 林投姐: late-Qing Tainan, site near today's 民族路 / 西門路. https://www.thenewslens.com/article/121048 , https://www.storm.mg/article/331258
- 臺南運河 opened 25 Apr 1926. https://news.ltn.com.tw/news/life/paper/1738548
- 安平劍獅 (the navy-shield origin is folk explanation, not documented history). https://www.taipeitimes.com/News/feat/archives/2019/08/16/2003720558
- 鹽水蜂炮: a Guangxu-era plague and 關聖帝君's procession. https://www.gvm.com.tw/article/17542
- 做十六歲 and the 五條港 dock workers. https://www.cna.com.tw/news/aloc/201808170117.aspx
- 烏山頭水庫 and 嘉南大圳 completed 1930. https://www.taipeitimes.com/News/feat/archives/2019/12/06/2003727042

## Layout

```
src/data/     weapons, passives, heroes, ema upgrades, yokai, stages (all numbers live here)
src/game/     the simulation: no DOM, fixed 60 Hz step, seeded rng
  world.ts    run state, spatial grid, damage and drops
  weapons.ts  firing and shot behaviour
  enemies.ts  spawning, AI, boss moves, bullets
  run.ts      createRun / step / level-up choices / offering boxes
  bot.ts      steering bot for the sim, the tests and the menu background
src/render/   kit.ts (stacked paper sheets), yokai.ts, items.ts (heroes, shots, icons, props), sprites.ts (cache + ground tiles), scene.ts
src/ui/       DOM menus (screens.ts) and the HUD (hud.ts)
src/core/     save, i18n, audio, input
sim/          headless balance run
```

To add a stage: one entry in `src/data/stages.ts`, its yokai in `src/data/enemies.ts`, a draw function per yokai in `src/render/yokai.ts`, a ground tile in `src/render/sprites.ts` and props in `src/render/items.ts`.

To replace the art: every sprite is looked up by key through `spr()` in `src/render/sprites.ts`. Swapping that lookup for image files keeps the rest untouched.

## Balance sim

`npm run sim -w yokai-night-market -- <meta 0..1> <runs> <stages> <hero>` plays whole runs with the bot, which backs away from what is close, walks to pickups and takes upgrades at random. It is a weak player, so its clear rate is a floor.

Clears out of 5 runs with 小滿 (2026-11-18):

| Ema bought | 神社 | 末廣町 | 鶯料理 | 糖廠 | 孔廟 | 安平 |
|---|---|---|---|---|---|---|
| none | 3 | 3 | 0 | 0 | 0 | 0 |
| half | 5 | 5 | 4 | 1 | 1 | 1 |
| all | 5 | 5 | 3 | 5 | 2 | 1 |

## Save

`localStorage` key `yokai-night-market.save.v1`: coins, ema levels, cleared stages, best times, yokai seen, settings.
