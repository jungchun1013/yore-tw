# CrazyGames submission checklist — Meowcaron v0.1

Source: CrazyGames developer docs (requirements, QA, SDK). Items marked ☐ need a human action before submitting.

## Build
- [x] HTML5 build, single `index.html` + assets, relative paths (`base: './'`), ≈1.5 MB zipped size well under limits
- [x] No external calls at runtime except the CrazyGames SDK (loaded only with `?platform=crazygames` or on a crazygames.com host)
- [x] No login, no paid APIs, no backend
- [x] Works in Chrome desktop and mobile Chrome (Playwright: Desktop Chrome 1280×800 + Pixel 5)
- [ ] ☐ Smoke-test in Safari and Firefox manually (not automated here)
- [x] Loads fast: Phaser chunk is the only large asset; art is procedural
- [x] No console errors during a scripted session (automated test)

## Gameplay / QA rules
- [x] Playable with mouse and touch; responsive layout (side panel on desktop, bottom sheet on mobile); no text under 12 px
- [x] Progress saved automatically (every 10 s, on tab hide, on unload); offline earnings on return
- [x] No forced waiting, no mandatory ads: rewarded ads are optional (2× boost, 2× offline) and never gate progress
- [x] English UI, original name, original procedurally generated art, original synthesized SFX (no third-party assets)
- [x] Sound toggle present; audio muted automatically while an ad plays (adapter callback)
- [ ] ☐ Play 15 minutes yourself and confirm it is fun, not just functional

## SDK integration (needed for Full Launch, harmless in Basic Launch)
- [x] `gameplayStart()` on boot, `gameplayStop()` on stop
- [x] `happytime()` on prestige
- [x] Rewarded ad request wired to Catnip rush and offline doubling; errors fall back to 1× with a toast
- [x] Midgame ad requested only at the natural break after prestige
- [x] Save data goes through the SDK data module when available (falls back to localStorage)
- [ ] ☐ Test with the SDK QA tool / `?platform=crazygames` on the CrazyGames preview URL after upload

## Store assets
- [ ] ☐ Game name: Meowcaron
- [ ] ☐ Short description (≤ 150 chars): "Pat the cat, hire a bakery full of pixel cats and bake billions of macarons. Cozy idle clicker with offline progress and prestige."
- [ ] ☐ Cover image 16:9 and square icon — generate from the sprite sheet (`docs/screenshots/sprite-sheet.png`) or `public/favicon.svg`; recommended sizes per the current CrazyGames form
- [ ] ☐ Tags: idle, clicker, incremental, cats, cute, pixel art
- [ ] ☐ Controls text: "Click or tap the cat. Buy cats and upgrades in the side panel."

## Basic Launch metrics to watch (platform dashboard)
- Average playtime (good: 10+ min), D1 retention (good: 10–15 %), play-conversion (good: 80 %+)
- If playtime is short: check whether players reach the first automation (<30 s) and first upgrade (<3 min) — the analytics bus already records `buy_gen`, `buy_upgrade`, `session_ping`; wire it to the platform or a lightweight endpoint before Full Launch

## Submission package (docs/crazygames/)
Generated on 2026-11-02 from v45. Regenerate the screenshots with `CG=1 npx playwright test tests/tools/cg-shots.spec.ts --project=desktop`.

| File | Use |
|---|---|
| `icon-512.png`, `icon-256.png` | square game icon (owner cat on pink) |
| `cover-1920x1080.png`, `cover-800x450.png` | 16:9 cover / thumbnail |
| `screenshot-1-start-{zh,en}.png` … `screenshot-5-lategame-{zh,en}.png` | five gameplay screenshots at 1920×1080, both languages (upload the English set; zh set is for a localised listing) |
| `description.md` | title, tagline, short and long description, controls, tags (EN + zh-TW) |

Upload steps
1. `npm run build`, then zip the **contents** of `dist/` (index.html at the zip root, not inside a folder).
2. CrazyGames developer portal → Submit game → upload the zip as an HTML5 game; the SDK is loaded automatically on their domain (the build detects `crazygames.com` and loads `crazygames-sdk-v3.js`; nothing to configure).
3. Fill the listing from `description.md`; upload icon, cover and the five English screenshots.
4. Before submitting, open the preview URL with the SDK QA tool (developer portal → your game → QA tool) and check: rewarded ad on "Catnip rush" and on the offline "Collect 2×", midgame ad after opening a new shop, `gameplayStart/Stop`, save/load through the SDK data module.
5. Request Basic Launch; after the metrics period, move to Full Launch.
