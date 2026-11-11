# yore-tw.com games

One repo, three independent parts. The root only holds the shared tooling (Vite 4, TypeScript 5.4, Playwright 1.44, pinned for Node ≥ 16.13) and the deploy config; no game code is shared.

| Folder | What | Dev |
|---|---|---|
| `meowcaron/` | Meowcaron 🐱🍪 — cat macaron idle clicker (Phaser). Also shipped to CrazyGames. | `npm run dev -w meowcaron` → http://localhost:5173 |
| `souls-in-abyss/` | Souls in Abyss 輪迴無止盡 — Battle-Without-End style auto RPG. | `npm run dev -w souls-in-abyss` → http://localhost:5180 |
| `site/` | yore-tw.com entry pages (index, about, privacy, assets). Static, no build. | open the files |

Each game has its own README, tests, sim and docs inside its folder.

## Commands

```bash
npm install                 # once; installs both workspaces into the root node_modules
npm run typecheck           # both games
npm test                    # both games' Playwright suites (npx playwright install chromium once)
npm run build               # both games → <game>/dist
npm run site                # build the games, then site/build.cjs assembles dist-site/: zh pages at /, en pages at /en/, sitemap, game builds
npm run serve:site          # preview dist-site/ on http://localhost:4100
```

Add `-w meowcaron` or `-w souls-in-abyss` to any script to run it for one game.

`dist-site/` is what Cloudflare serves (`wrangler.jsonc`); it is gitignored and rebuilt on deploy. See `docs/deploy.md`.
