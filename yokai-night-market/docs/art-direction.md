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

## How the code maps to it

| Brief | Where |
|---|---|
| Separate cutouts joined at pins | `Doll` in `doll.ts`: a tree of parts, each turning on its own pivot; a pose is only angles and offsets |
| Each filled shape is a cut sheet | `fs()` / `press()` in `kit.ts`: every filled shape inside a part becomes its own sheet |
| Hand-cut edges | `roughPath()`: outlines are traced with a small, smooth wander, scaled down on small pieces |
| Visible cardstock edge | `press()`: a darker copy of the sheet stepped down-right under it |
| Foam spacers, AO, contact shadow | `press()` inside a part, and the ring of faint offset copies per part in `Doll.draw` (further for higher parts) |
| Washi fibres and pigment | `grainPattern()`: soft blotches, long light fibres, a faint tooth |
| Light from the upper left | lit upper-left cut edge and shadows falling down-right |
| Palette | `P` in `dolls.ts` |

## Rules learned while getting here

- No outlines and no white rims around pieces. Volume comes only from stacking.
- Keep the grain subtle; at full strength it reads as sand on skin.
- Edges are crisp card, not rounded clay: thin lit edge, thin dark edge.
- Copy the look of the references, never their characters.
