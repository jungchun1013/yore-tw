# Deploying yore-tw.com (Cloudflare) and CrazyGames

## yore-tw.com

The deployed site is `dist-site/`, assembled by the root `npm run site`:

```
dist-site/
  index.html, about.html, privacy.html, robots.txt, sitemap.xml, ads.txt, favicon.svg, style.css, _shared.js, assets/
                      ← copied from site/ (hand-written, committed)
  meowcaron/          ← meowcaron/dist      (built)
  souls-in-abyss/     ← souls-in-abyss/dist (built)
```

Only `site/` is committed; the two game builds are produced at deploy time, so pushing never includes build output.

### Cloudflare project settings (Workers & Pages → yore-tw → Settings → Build)

- Build command: `npm run site`
- Deploy command: `npx wrangler deploy` (Workers) — or for a Pages project, Output directory `dist-site`
- Environment variable: `NODE_VERSION=18` (Vite 4 needs ≥ 16; the default image is newer and also fine)

`wrangler.jsonc` already points the Worker's static assets at `./dist-site`. Custom domains `yore-tw.com` and `www.yore-tw.com` are attached in Settings → Domains & Routes.

### Each update

1. Commit, push to GitHub. Cloudflare installs, runs `npm run site`, deploys.
2. To check locally first: `npm run site && npm run serve:site` → http://localhost:4100

### AdSense

The publisher id lives in `site/index.html` (`<meta name="yore-ad-slot">` holds the display unit id; empty shows nothing) and `site/ads.txt`. The H5 Games Ads adapter is in `meowcaron/src/core/platform` and reads `<meta name="mc-adsense-client">` in the game's own `index.html`.

## CrazyGames (Meowcaron only)

Upload the contents of `meowcaron/dist/` after `npm run build -w meowcaron`; the SDK is loaded automatically on their domain. Nothing from `site/` is needed there. See `meowcaron/docs/crazygames-checklist.md`.
