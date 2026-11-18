# Art direction

Set by the user on 2026-11-18. Every new piece of art follows this; the paper-doll code in `src/render/kit.ts` and `src/render/doll.ts` exists to produce it.

## The brief (as given)

A charming Japanese chibi papercraft diorama, inspired by traditional Japanese kirie (paper-cutting), washi paper collage, handcrafted paper dolls, and miniature pop-up storybooks.

**Character design.** Adorable Japanese chibi paper-doll characters with oversized heads, tiny bodies, short limbs, rounded silhouettes, and expressive faces. Each character is assembled from individually cut pieces of colored washi paper and thick cardstock. Hair, face, clothing, sleeves, accessories, and limbs are separate overlapping paper cutouts, with visible layered edges and subtle shadows between pieces. Cute, whimsical Japanese folklore aesthetics, intricate yet readable costume details.

**Environment design.** A miniature Japanese fantasy village made entirely from layered paper cutouts. Traditional wooden houses, curved tiled rooftops, shrines, bridges, lanterns, stylized trees, flowers, and bushes, all constructed from stacked sheets of textured paper. Trees have rounded, overlapping paper foliage, and buildings resemble handcrafted architectural paper models.

**Physical paper construction.** Every object has a tangible thickness, as if mounted using 1–3 mm foam adhesive spacers. Visible cardstock edges, delicate gaps between paper layers, soft ambient occlusion, and realistic contact shadows. The paper pieces appear to float slightly above the layers beneath them. Subtle imperfections in hand-cut edges, organic irregular silhouettes, and authentic handmade construction.

**Paper material.** Fine Japanese washi fibers, matte handmade paper, subtle grain, delicate pigment variations, slightly rough surfaces, softly textured colored cardstock. No glossy plastic surfaces. Colors are warm, harmonious, and slightly muted, with playful accents of vermilion red, coral pink, sage green, mustard yellow, cream, and indigo.

**Composition and lighting.** A 2.5D side-view paper theater composition, predominantly flat 2D illustrations with convincing physical depth created through stacked paper layers. Soft directional studio lighting from the upper left, delicate shadows emphasizing the separation of each layer, gentle ambient illumination, warm and inviting atmosphere.

**Important.** Clearly visible paper thickness, foam-mounted layered construction, tactile paper fibers, overlapping cutout silhouettes, soft shadows between layers, handcrafted paper-doll appearance.

## The references come first

On 2026-11-18 the user sent four screenshots of a commercial yokai game (character key art, a shopping-street panorama, the in-game garden view, and a sheet of trees, a statue and buildings) and said: follow these completely. Where the written brief and the screenshots differ, the screenshots win. What they show:

- Clean vector cut-outs with smooth edges. No hand-cut wobble, no visible cardstock thickness.
- Each shape outlined thinly in a darker tone of its own colour, never black, never a white rim.
- Volume from folds: mountains are two or three flat facets (lit left, shaded right); every canopy tier and roof course is lighter on top and darker underneath.
- Foliage as stacked tiers of round lobes; roofs as rows of scalloped tile ends.
- Traditional patterns printed on surfaces: seigaiha waves, cherry blossoms, asanoha, dots, stripes.
- Small, soft shadows only. Faint paper grain.
- Cream paper stage, sakura pink, gold, warm wood brown, vermilion, indigo, sage.
- Chibi anime characters: big round eyes with layered irises and catchlights.

Copy the look, never the characters, logos or text.

## How the code maps to it

| Look | Where |
|---|---|
| Separate cut-outs joined at pins | `Doll` in `doll.ts`: a tree of parts, each turning on its own pivot; a pose is only angles and offsets |
| Every filled shape is its own sheet | `fs()` / `press()` in `kit.ts` |
| Tone outlines | `fs()` strokes each sheet with `tone(fill, -0.32)` |
| Folds | `finish()`: a crisp darker band on the lower edge, a light band on the top edge of every sheet |
| Patterns | `pat()` prints onto the current sheet only (`source-atop`); `blossom()` is a small sheet of its own |
| Soft shadows | `press()` inside a part, and a small ring of faint copies per part in `Doll.draw` |
| Paper grain | `grainPattern()`, applied at half strength |
| Palette | `P` in `dolls.ts` |

## Rules learned while getting here

- No outlines in black and no white rims around pieces.
- Keep the grain faint; at full strength it reads as sand on skin.
- No hand-cut wobble or thick card edges: the references are clean.
- Mountains must not read as pyramids: keep them low and folded into several facets.
- Eyes must look soft: the lash line follows the top of the eye, no slanted brow strokes.
