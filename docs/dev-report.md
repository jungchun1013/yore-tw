# Meowcaron v0.1 — development report (2026-11-01)

## Outcome
A playable, tested HTML5 idle clicker built in one autonomous session. Production build ≈ 1.5 MB (Phaser is 1.46 MB of it). 30 Playwright tests pass on desktop Chrome and Pixel 5 emulation; the headless balance simulator passes all pacing checks.

## What was built, in order
1. Economy engine + content (10 cats, tier/click/global upgrades, achievements, prestige, offline), a headless simulator with a human-like buying bot, and three tuning rounds until the pacing targets held.
2. Phaser scene + DOM shop, procedural pixel art (no image assets), WebAudio SFX, platform adapter (mock + CrazyGames SDK v3), analytics bus, autosave.
3. Playwright suite: first-minute flow, persistence, offline (incl. ad doubling), prestige + star shop, late-game number formatting and Max-buy, corrupt save, layout, console errors, customers, petting.
4. Independent review (fresh-context agent) → 6 bugs + 4 risks fixed: uncollected offline earnings could be overwritten/lost (now persisted and accumulated), double rewarded-ad requests, stale cat rows during boosts, wipe-save leaving sprites, clock-forward boost exploit (clamped on load), background-tab double counting (loop pauses when hidden), Infinity guard in maxAffordable, prestige dropping an active boost.
5. User-directed iterations: Pusheen-style cats, natural fur coats via pattern masks, Overcooked-style top-down kitchen (L-shaped counter with the belt on it, front display counter, street-side customers), three-tier equipment upgrades, journal with personas, petting reactions, larger type everywhere.

## Balance (simulator, 3 clicks/s, 60 min)
| milestone | time |
| --- | --- |
| first cat | 5 s |
| first upgrade | 35 s |
| 100 macarons/s | 8 min |
| 5th cat type | ~15 min |
| first prestige star | ~29–31 min |
| 10 stars | ~60 min |
Prestige loop (always at 10★): 60 → 37 → 28 → 22 → 19 min per run. Idle-only after 10 minutes reaches the same milestones within a few minutes of the active profile.

## Known gaps / not verified
- **Fun is not verified.** Everything above is mechanical. Nobody has played it for 15 minutes yet.
- Safari and Firefox untested (only Chromium in Playwright).
- Real CrazyGames SDK path only compiled, never exercised against the live SDK; the QA tool run is a checklist item.
- The `window.__mc` debug surface ships in production (cheat/automation surface; acceptable for an idle game, remove before Full Launch if desired).
- Known exploit left open by design: setting the system clock forward before loading grants up to 8 h (16 h with the star upgrade) of offline earnings at 50 %.
- Equipment replaced the five generic global upgrades and each station now feeds one system (mixer → click, piping → all cats ×1.25/tier, oven → offline rate, box → customer orders); the sim still passes (first prestige ≈ 29 min).
- Petting grants a 60 s ×1.25 'loved' boost per cat type plus a small instant bonus; it is capped by a 20 s per-cat cooldown but a very active player can keep several types loved at once — watch session data for whether this dominates.
- No localisation (English only, as CrazyGames requires English UI); the user's test audience may want zh-TW later.

## Next steps
1. Play it for 15 minutes (`npm run dev`) and note where it drags; adjust `src/content/cats.ts` costs or `PRESTIGE` and re-run `npm run sim`.
2. Produce store assets (cover 16:9, icon) from the sprite sheet.
3. Submit to CrazyGames Basic Launch with `docs/crazygames-checklist.md`; watch playtime, D1 and play-conversion.
