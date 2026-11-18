# 百鬼夜市 Yokai Night Market

A survivors-style action game: walk a Japanese-era Taiwanese town at night, let your charms and firecrackers fire on their own, and last fifteen minutes until dawn. Chapter 1 has six stages.

Plain TypeScript and Canvas 2D, no engine and no asset files. Sprites are drawn in code at load; sound is synthesised with WebAudio.

```
npm run dev -w yokai-night-market      # http://localhost:5200  (add ?debug for the test hooks)
npm run build -w yokai-night-market
npm test -w yokai-night-market         # Playwright, desktop + phone
npm run sim -w yokai-night-market      # headless balance run, see below
```

## Content

| Stage | Yokai | Boss |
|---|---|---|
| 鳥居參道 Torii Approach | 提燈妖, 人魂, 唐傘小僧, 不倒翁 | 燈籠大將 |
| 廟口夜市 Temple Night Market | 碗公妖, 紅白袋妖, 小燈猴, 竹籤鬼 | 燈猴 |
| 日式老宿舍 Old Dormitory | 一目小僧, 垢嘗, 椅仔姑, 座敷童子 | 金魅 |
| 糖廠鐵道 Sugar Mill Railway | 煤煙鬼, 水牛魂, 輪入道, 甘蔗妖 | 朧五分車 |
| 霧山竹林 Misty Bamboo Hills | 魔神仔, 木靈, 小天狗, 竹篙鬼 | 魔神仔王 |
| 溫泉街 Hot Spring Street | 水鬼, 貓又, 河童, 湯桶妖 | 虎姑婆 |

The creatures come from public Japanese and Taiwanese folklore; the designs, names of items and all art are made for this game.

- 9 weapons, 6 levels each, each with an evolution unlocked by carrying its paired passive at max level and opening an offering box: 符札 → 千枚札, 鞭炮 → 蜂炮, 筊杯 → 三聖筊 and so on (`src/data/weapons.ts`).
- 10 passives (`src/data/passives.ts`), 5 weapon slots and 5 passive slots per run.
- 3 characters: 小滿 from the start, 阿燈 after 2 stages cleared, 雲平 after 4.
- 11 permanent ema upgrades bought with coins. Coins are kept when a run is lost.
- Run timeline: elites at 4:00, 8:00 and 11:00 (each drops an offering box), a night parade at 6:00 and 10:30, an encirclement at 7:30 and 12:00, the boss at 13:00, dawn at 15:00. Surviving to dawn clears the stage; beating the boss is optional.
- zh-TW and English, chosen from the browser language and switchable on the title screen.
- Keyboard (arrows / WASD, 1–4 to pick an upgrade, Esc to pause) and a floating touch stick.

## Layout

```
src/data/     weapons, passives, heroes, ema upgrades, yokai, stages (all numbers live here)
src/game/     the simulation: no DOM, fixed 60 Hz step, seeded rng
  world.ts    run state, spatial grid, damage and drops
  weapons.ts  firing and shot behaviour
  enemies.ts  spawning, AI, boss moves, bullets
  run.ts      createRun / step / level-up choices / offering boxes
  bot.ts      steering bot for the sim, the tests and the menu background
src/render/   kit.ts (vector helpers), yokai.ts, items.ts (heroes, shots, icons, props), sprites.ts (cache + ground tiles), scene.ts
src/ui/       DOM menus (screens.ts) and the HUD (hud.ts)
src/core/     save, i18n, audio, input
sim/          headless balance run
```

To add a stage: one entry in `src/data/stages.ts`, its yokai in `src/data/enemies.ts`, a draw function per yokai in `src/render/yokai.ts`, a ground tile in `src/render/sprites.ts` and props in `src/render/items.ts`.

To replace the art: every sprite is looked up by key through `spr()` in `src/render/sprites.ts`. Swapping that lookup for image files keeps the rest untouched.

## Balance sim

`npm run sim -w yokai-night-market -- <meta 0..1> <runs> <stages> <hero>` plays whole runs with the bot, which backs away from what is close, walks to pickups and takes upgrades at random. It is a weak player, so its clear rate is a floor.

Figures from 5 runs with 小滿 (2026-11-18):

| Ema bought | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| none | 3/5 | 2/5 | 0/5 | 0/5 | 0/5 | 0/5 |
| half | 5/5 | 5/5 | 4/5 | 1/5 | 1/5 | 1/5 |
| all | 5/5 | 5/5 | 3/5 | 5/5 | 2/5 | 1/5 |

## Save

`localStorage` key `yokai-night-market.save.v1`: coins, ema levels, cleared stages, best times, yokai seen, settings.
