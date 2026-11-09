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
| `src/characters/` | Reusable authored cross-section meshes and pleated cloth surfaces. |
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

1. Every look renders geometry at full device resolution into a 4× MSAA half-float target.
   Pixel mode no longer overlays a nearest-neighbour colour buffer on smooth geometry.
2. The default **幻彩像素** look uses broad soft cel tones and a bounded Bayer mixing seam
   near the light/shadow transition. **混色格** controls only the mixing cell size;
   **交界混色** offers smooth / subtle / rich. It never reduces geometry resolution.
3. Pearl neutrals carry broad world-anchored lavender, mint and peach fields. Soft cloud
   shadows, airy coloured shadows, restrained rim light and HDR bloom work in all looks.
   Sky and soft cel remain available; outlines are off by default.
4. `src/characters/surfaces.ts` builds smooth indexed meshes from authored cross sections
   and a pleated mantle. The traveller uses shaped facial, hair, garment and limb meshes;
   the mantle has four weighted bones. The toon vertex shader supports skinning, so future
   animal/spirit rigs can use the same lighting. This is an authored procedural model,
   not an imported production sculpt; animal and spirit models are not implemented yet.

Art/technical references used for this revision:

- [Art of Sky: Children of the Light, Yuichiro Tanabe / GDC](https://gdcvault.com/play/1026812/Art-of-Sky-Children-of): environment, light and character design.
- [Art Institute of Chicago: Seurat and complementary colour](https://archive.artic.edu/sciarttech/global_pages/g3.4.html): optical mixing through adjacent complementary colours. The local seam treatment is our implementation, not a claim about Sky's shaders.
- [Three.js SkinnedMesh](https://threejs.org/docs/pages/SkinnedMesh.html): joint indices, weights and skeleton binding.

The artist name 虫羊 did not yield a verifiable original portfolio in the search; the current
palette interprets the requested fantastical, multicoloured-white direction rather than claiming
an exact match to that artist.

To validate against an isolated preview server (avoids reusing another running build):
`PW_PORT=4291 npm test -w planet-wanderer`.

## Regional building studies

The meadow now keeps the original cabin and adds two separate study lots:

| Prop | Coordinates | Art direction | `params.tier` |
| --- | --- | --- | --- |
| `rusticHut` | 30, 65 | Narrow, modest plank hut; red shingles, braced door, tiny vent | 1: basic; 2: adds side window |
| `logCabin` | -8, 105 | Broader horizontal-log cabin; corner end grain, brown shingles, arched window | 1: basic; 2: adds chimney and smoke |
| `spruce` | Four placements around the log cabin | Stylized Norway spruce, lobed drooping boughs and tapered leader | `scale`, `seed` |

`BuildingKit` shares beams, logs, end grain, windows and roof surfaces. `buildingStudies.ts`
keeps regional families separate from their construction stages. Tiers are art variants only:
there is no upgrade UI, resource economy, or progression rule yet. A log building is a regional
alternative, not a universal upgrade from a frame building. The models are fantasy interpretations,
not reconstructions of a specific place or historical date.

Research informing the art direction:

- [National Trust: architecture and local materials](https://www.nationaltrust.org.uk/discover/history/architecture/history-of-architecture): timber frames associated with oak-growing areas of England; stone where suitable stone was available.
- [Norwegian Directorate for Cultural Heritage: log buildings](https://riksantikvaren.no/en/veileder/know-your-house-log-buildings/): Norwegian log-construction context.
- [Historic Environment Scotland: thatched roofs](https://www.engineshed.scot/building-advice/building-components/roofs/thatched-roofs/): roofing material and drainage also drive pitch; latitude alone is insufficient.
- [Forest Research: beech](https://www.forestresearch.gov.uk/tools-and-resources/tree-species-database/beech-be/) and [silver birch](https://www.forestresearch.gov.uk/tools-and-resources/tree-species-database/131561-silver-birch-sbi-2/): temperate-European tree studies.
- [Swedish Forest Agency: forest trees](https://skogsstyrelsen.se/aga-skog/skogstrad/): Norway spruce, Scots pine and birch as northern forest references.

The screenshot test `independent rustic and Nordic building studies` uses the model-inspection
camera to capture both buildings and checks for browser/shader errors. Existing render and
round-trip travel checks also cover the expanded meadow.
