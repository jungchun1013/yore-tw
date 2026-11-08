# Temporary AdSense-review layout for yore-tw.com (2026-11-08)

The entry site was expanded so Google AdSense reviewers see a content-rich site instead of a bare game list. This is a **temporary layout**. The games themselves (`meowcaron/`, `souls-in-abyss/`) were not changed.

## The original layout (git tag `site-pre-adsense-layout`)

- **Home (`site/index.html`)**: the header (brand + language toggle), a "Games" heading, three cards, the cat you can pat with its heart counter, and a small footer with About and Privacy links. The Meowcaron card linked straight to `/meowcaron/`, the Souls in Abyss card straight to `/souls-in-abyss/`, and the third card was the striped "In the oven / 製作中" placeholder.
- **About (`site/about.html`)**: one short card about the one-person studio, a "What we care about" list, a changelog line and the contact email.
- **Privacy (`site/privacy.html`)**: the privacy policy, with Games and About in the header.
- No game detail pages, no contact page, no screenshots folder.

## What the review layout changes

| File | Change |
|---|---|
| `site/index.html` | Rewritten: welcome section, game cards that now open the detail pages, a "Playing here" feature row, "Latest news", a short developer intro, then the original pat-the-cat section (same script). |
| `site/games/meowcaron.html` | New detail page: cover with a Play button, about, how to play, controls, features, tips, facts box, screenshots, updates. The Play buttons open `/meowcaron/`. |
| `site/games/souls-in-abyss.html` | New detail page with the same structure, plus font and icon credits. The Play buttons open `/souls-in-abyss/`. |
| `site/about.html` | Rewritten: studio, "About me" (Joan from Tainan; drawing, photography, badminton, novels, Taiwanese indie music), how the games are made, what I care about, link to Contact. |
| `site/contact.html` | New: email address, what to include in a bug report, a note about saves. |
| `site/privacy.html` | Only the header and footer links (Contact and game pages added). Policy text unchanged. |
| `site/style.css` | New rules appended under the comment "AdSense-review layout". Old rules untouched. |
| `site/sitemap.xml` | Lists the new pages, with `lastmod`. |
| `site/assets/shots/*.webp` | New screenshots for the detail pages. |

Every page still has the AdSense snippet in the head and one hidden `.ad-slot` box.

## How to go back to the original layout

```
git restore --source site-pre-adsense-layout --staged --worktree site
git commit -m "Entry site: back to the original layout"
git push
```

`git restore` with a directory also removes files that did not exist at the tag (`site/games/`, `site/contact.html`, `site/assets/shots/`). Anything added to `site/` after this change, such as an analytics snippet or later cover images, is rolled back too, so check `git diff --stat site-pre-adsense-layout -- site` first and re-apply what should stay.

## Open item

`hello@yore-tw.com` is shown on the Contact and About pages. It only receives mail once Cloudflare Email Routing forwards it to a real inbox (Cloudflare dashboard → yore-tw.com → Email → Email Routing).
