# Planet Wanderer (working title)

A tiny-planet frontier game: walk around little worlds, rendered from real 3D into pixel art,
and fly between them. Sky / Heaven Travel mood (airy, low saturation, cyan daylight); the Little
Prince is a hidden reference, never named. Independent from the other games in this repo.

```bash
npm run dev -w planet-wanderer      # http://localhost:5190
npm test -w planet-wanderer         # builds, renders both scenes, screenshots to docs/screenshots/
```

**Controls:** WASD / arrows or tap the ground to walk · drag to rotate · wheel / pinch to zoom ·
E / Space (or tap the ship when close) to board.

## Layout

| folder | what lives there |
| --- | --- |
| `src/scenes/` | **Data.** One file per world (`meadow.ts`, `roseMoon.ts`): colour mood, planet size, paths, prop list, spawn/arrival, exits, how it looks in other skies. `index.ts` registers them. |
| `src/props/` | One file per thing (`house.ts`, `ship.ts`, …). Each exports `prepare?` (shape terrain) and `build` (meshes, obstacles, animation). `kit.ts` holds the helpers, `index.ts` the registry. |
| `src/world/` | `Planet` (a sphere instance: height, flats, ponds, placement), `realm.ts` (scene data → loaded world, `dispose()`), `prince.ts`. |
| `src/game/` | `sceneManager.ts` (load / travel transition), `cameraRig.ts`, `input.ts`, `state.ts` (player progress, separate from visuals). |
| `src/render/` | The 3D → pixel-art pipeline, toon materials, `palette.ts`. Shared by every scene. |
| `src/ui/` | HUD. |

**Add a world:** copy `scenes/roseMoon.ts`, change it, add one line to `scenes/index.ts`, point an
exit at it. It shows up in the other worlds' skies automatically.
**Add a prop:** a new file in `props/` exporting a `PropModule`, one line in `props/index.ts`, then use
its name in a scene's `props` list. Redrawing a prop only touches its own file.

`kind: 'planet'` is the only scene kind today; non-sphere realms (islands, interiors) would add a
kind and their own world builder next to `Planet`.

## Rendering in brief

1. Scene renders at screen ÷ 3 with 4-band toon shading (hue-shifted shadows, ordered dither at band
   seams, cyan rim) and real shadow maps; a normal pre-pass renders at the same size.
2. A full-resolution composite samples both on that pixel grid: depth outlines, light-facing crease
   highlights, then the soft sky (deliberately not pixelated; clouds snap to the grid), a stepped
   atmosphere halo around the planet, the wisp glow and the scene fade.
3. Camera FOV 30° (weak perspective), key light follows the view so the visible side is always day.
   Each scene's `mood` sets sky, halo, sun, shadow tint and ground tones.
