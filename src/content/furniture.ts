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
  { id: 'scratcher', name: 'Scratching post', desc: 'Claws out: a long, satisfying scratch.', cost: 20_000, use: 'play', inside: false, sprite: 'scratcher' },
  { id: 'cattree', name: 'Cat tree', desc: 'Someone climbs up and supervises the shop.', cost: 50_000, use: 'rest', inside: false, sprite: 'cattree' },
  { id: 'cathouse', name: 'Red-roof cat house', desc: 'A cat hides inside; the whole house snores.', cost: 100_000, use: 'nap', inside: true, sprite: 'cathouse' },
  { id: 'tent', name: 'Blue tent', desc: 'A lamp comes on inside. Sometimes there is yarn.', cost: 250_000, use: 'nap', inside: true, sprite: 'tent' },
  { id: 'hangball', name: 'Hanging ball', desc: 'Swat it and it swings back. Again. Again.', cost: 400_000, use: 'play', inside: false, sprite: 'hangball' },
  { id: 'bed', name: 'Donut bed', desc: 'The softest nap in the building.', cost: 1_000_000, use: 'nap', inside: false, sprite: 'bed' },
  { id: 'fish', name: 'Giant fish plush', desc: 'Gets hugged and bunny-kicked. Has seen things.', cost: 5_000_000, use: 'nap', inside: false, sprite: 'fish' },
];
export const FURNITURE_BY_ID: Record<string, FurnitureDef> = Object.fromEntries(FURNITURE_ITEMS.map((f) => [f.id, f]));
export const FURNITURE_SLOTS = 4;
export const FURNITURE_BONUS = 0.03;
