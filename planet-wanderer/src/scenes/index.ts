import type { SceneDef, SkyBody } from './types';
import { meadow } from './meadow';
import { roseMoon } from './roseMoon';

/** Every scene in the game. Adding a world = one file + one line here. */
export const SCENES: Record<string, SceneDef> = {
  [meadow.id]: meadow,
  [roseMoon.id]: roseMoon,
};

export const FIRST_SCENE = meadow.id;

/** Worlds seen in the sky that cannot be visited yet. */
export const DECOR_BODIES: SkyBody[] = [{ color: 0xc4c2e4, radius: 2.2, pos: [62, -18, -60] }];
