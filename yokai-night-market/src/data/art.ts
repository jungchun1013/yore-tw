// Enemies whose art is still being drawn. Spawning skips them; the art loader removes an id
// once its picture has loaded, so a new monster appears as soon as its PNG is in public/art/tainan.
export const PENDING_ART = new Set<string>(['kuroneko', 'hebi', 'fengshi', 'bixi']);
