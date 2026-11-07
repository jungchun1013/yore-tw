# Aeon Brave 永劫勇者

A Battle Without End style auto-battle RPG. Fully independent from Meowcaron: own package, config, save key (`aeonbrave.save`) and build. It only borrows the parent folder's `node_modules`.

```
npm run dev      # http://localhost:5180
npm run sim      # headless pacing table: npm run sim -- <hours> <startAge>
npm test         # Playwright smoke tests, desktop + mobile
npm run site     # build and copy into ../site/aeon-brave/
```

## What is replicated from BWE
- Auto combat; you choose the area by comparing your CP with its suggested CP.
- Age 10 to 17 at start, one year per 20 real minutes. Younger grows more luck and agility, older more strength and vitality. Birthdays give stats and AP.
- Rebirth from age 20: level and growth reset, race and starting age re-chosen. Skills, titles, gold, AP, pals and items are kept. 10% of the life's growth becomes permanent.
- Gear: light, medium or heavy weapons and armor, plus ring and amulet. Random rarity and random affixes. Blacksmith +1 to +10 with falling success rate; failing at +5 or higher drops a level.
- Skills bought with AP. Titles from milestones give permanent bonuses.

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
