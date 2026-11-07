# Souls in Abyss 輪迴無止盡

A Battle Without End style auto-battle RPG. Fully independent from Meowcaron: own package, config, save key (`soulsinabyss.save`) and build. It only borrows the parent folder's `node_modules`.

```
npm run dev      # http://localhost:5180
npm run sim      # headless pacing table: npm run sim -- <hours> <startAge>
npm test         # Playwright smoke tests, desktop + mobile
npm run site     # build and copy into ../site/souls-in-abyss/
```

## What is replicated from BWE
- White panel layout: character sheet, monster panel with a WEAKEST-to-BOSS label, pal panel, skill-chance box, "loot in current map" tally, timestamped colour log, icon navigation on the right.
- Title screen, then race list and eight age figures (10 to 17) with initial stats and age growth. Level-up growth is a quarter of age growth.
- Stats STR DEX INT WILL LUCK; sheet shows ATK min~max, BAL, CRT, CRT.M, DEF, PRT, HP and MP. Damage rolls between min and max pulled by balance, minus flat DEF, then cut by PRT.
- One year of age per 20 real minutes. Birthdays give age growth and 5 AP, levels give 1 AP.
- Rebirth from age 20: level and growth reset, race and starting age re-chosen. Skills, titles, gold, AP, pals and items are kept. 10% of the life's growth becomes permanent.
- Paper doll with seven slots: weapon, head, body, hands, feet, two accessories. Light, medium or heavy weapons and armor. Six rarities (Basic, Magic, Rare, Perfect, Epic, Legendary) with random affixes. Blacksmith +1 to +10 with falling success; failing at +5 or higher drops a level.
- Skills in COMBAT / MAGIC / PASSIVE tabs, ranked F to 1 with AP.
- Type: everything in the Cubic 11 pixel font (OFL), Latin included. License in public/fonts.
- Icons from game-icons.net (Lorc, Delapouite; CC BY 3.0), generated into src/ui/icons.ts and credited in Settings.

## Beyond BWE (asked for by the user)
- **Gifts and curses** (`src/data/pacts.ts`): at each rebirth the Abyss offers three gift + curse pairs; take one or refuse. The pact lasts one life. Offers are stored in the save so reloading cannot reroll them.
- **Sanity** (`src/data/sanity.ts`): each area has a dread value. Kills in dreadful areas drain SAN, softened by WILL and a bonded pal; safe areas restore it; rebirth refills it. Shaken (<50) and Mad (<25) add crit and drops but raise damage taken, and Mad garbles names in the log. At 0 the mind breaks: a short knock-out, then you wake at 40.

## Pals (the deliberate departure)
Instead of rats and bears, seven pals with a home area, three growth stages, a bond that grows while they travel with you, a signature ability, lore and quips. The first one joins after 25 kills. One is hidden.

## Where to change things
| Change | File |
|---|---|
| Numbers for races, gear, skills, areas, pals, titles | `src/data/*.ts` |
| Combat, XP, aging, drops | `src/game/engine.ts` |
| Monster and CP formulas | `src/game/monsters.ts`, `src/game/stats.ts` |
| Add a new system that changes stats (food, buffs...) | push a `ModSource` in `src/game/mods.ts` |
| Save shape changes | bump `SAVE_VERSION` and add a migration in `src/game/state.ts` |
| Art | `src/ui/sprites.ts` lists the sprite keys; drop PNGs in `public/sprites/` |
| Text | UI strings in `src/core/i18n.ts`, content strings next to their data |
