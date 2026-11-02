# Deploying yore-tw.com (Cloudflare Pages) and CrazyGames

Two builds come out of the same code. The platform layer (`src/core/platform`) picks the adapter at runtime:

| Where it runs | Adapter | Ads |
|---|---|---|
| `*.crazygames.com` or `?platform=crazygames` | CrazyGames SDK v3 | rewarded, midgame, responsive banner, their storage |
| own domain with `<meta name="mc-adsense-client">` filled | AdSense H5 Games Ads | rewarded (`adBreak reward`), interstitial (`adBreak next`), display banner |
| anything else (localhost, empty meta) | mock | ad-free; rewarded = short placeholder; banner hidden on public hosts |

## Own domain: yore-tw.com

Static site in `site/`:

```
site/
  index.html        entry page (game cards, how-to, footer links)
  about.html        about / changelog / contact
  privacy.html      privacy policy (AdSense requires one)
  robots.txt, sitemap.xml, favicon.svg, style.css, _shared.js
  assets/           covers and screenshots
  meowcaron/        the game build (copied from dist/ by `npm run site`)
```

1. `npm run site` builds the game and copies it to `site/meowcaron/`.
2. Commit and push to GitHub.
3. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
   Framework preset: None · Build command: *(empty)* · Output directory: `site`.
   (If you prefer Cloudflare to build: command `npm run site`, output `site`, env `NODE_VERSION=16`.)
4. Custom domains → add `yore-tw.com` and `www.yore-tw.com` (DNS is created automatically since the domain is on Cloudflare).
5. Every later update: `npm run site`, commit, push.

### Turning on AdSense later
1. Apply at adsense.google.com with `yore-tw.com` once the site has been live for a while (privacy page and real content are already there).
2. After approval: put the publisher id into `index.html` → `<meta name="mc-adsense-client" content="ca-pub-…">`; create a display ad unit and put its slot id into `mc-adsense-banner-slot`.
3. In AdSense enable **H5 Games Ads** (Ad Placement API) for the site so `adBreak` rewarded / interstitial calls serve.
4. Add `site/ads.txt` with the line AdSense gives you (`google.com, pub-…, DIRECT, f08c47fec0942fa0`).
5. Turn on the Google-certified consent message (CMP) in AdSense → Privacy & messaging for EU/UK visitors.
6. `npm run site`, commit, push.

## CrazyGames
Upload the contents of `dist/` (after `npm run build`) as the game package; the SDK is loaded automatically on their domain. Nothing from `site/` is needed there. See `crazygames-checklist.md`.
