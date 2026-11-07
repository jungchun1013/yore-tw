/** Furniture catalogue: bought with macarons, placed in one of four floor slots. Each placed piece: +3% production. */
export interface FurnitureDef {
  id: string;
  name: string;
  desc: string;
  cost: number;
  /** what cats do there */
  use: 'nap' | 'rest' | 'play';
  /** cats go inside (drawn behind the item) */
  inside: boolean;
  /** template key in sprites/pixel FURNITURE */
  sprite: string;
}

export const FURNITURE_ITEMS: FurnitureDef[] = [
  { id: 'cushion', name: 'Round cushion', desc: 'A cat flops over and naps on it.', cost: 5_000, use: 'nap', inside: false, sprite: 'cushion_round' },
  { id: 'scratcher', name: 'Scratching log', desc: 'A tree trunk to climb and claw at.', cost: 20_000, use: 'play', inside: false, sprite: 'scratcher' },
  { id: 'cattree', name: 'Scratching post', desc: 'Someone climbs to the top and supervises the shop.', cost: 50_000, use: 'rest', inside: false, sprite: 'cattree' },
  { id: 'basket', name: 'Wicker basket', desc: 'Curl up inside. The handle is for show.', cost: 80_000, use: 'nap', inside: false, sprite: 'basket' },
  { id: 'cathouse', name: 'Red-roof cat house', desc: 'A cat hides inside; the whole house snores.', cost: 100_000, use: 'nap', inside: true, sprite: 'cathouse' },
  { id: 'tent', name: 'Floral teepee', desc: 'One cushion inside. A lamp comes on; sometimes there is yarn.', cost: 250_000, use: 'nap', inside: false, sprite: 'tent' },
  { id: 'tent2', name: 'Canvas teepee', desc: 'Sage canvas, a little lattice window, a rolled blind.', cost: 600_000, use: 'nap', inside: false, sprite: 'tent2' },
  { id: 'hangball', name: 'Hanging ball', desc: 'Swat it and it swings back. Again. Again.', cost: 400_000, use: 'play', inside: false, sprite: 'hangball' },
  { id: 'fishbowl', name: 'Goldfish bowl', desc: 'One goldfish. Endless entertainment.', cost: 150_000, use: 'rest', inside: false, sprite: 'fishbowl' },
  { id: 'bed', name: 'Donut bed', desc: 'The softest nap in the building.', cost: 1_000_000, use: 'nap', inside: false, sprite: 'bed' },
  { id: 'fish', name: 'Giant fish plush', desc: 'Gets hugged and bunny-kicked. Has seen things.', cost: 5_000_000, use: 'nap', inside: false, sprite: 'fish' },
];
export const FURNITURE_BY_ID: Record<string, FurnitureDef> = Object.fromEntries(FURNITURE_ITEMS.map((f) => [f.id, f]));
export const FURNITURE_SLOTS = 4;
export const FURNITURE_BONUS = 0.03;
