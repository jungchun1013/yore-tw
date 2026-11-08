import { PAL } from '../render/palette';
import type { SceneDef } from './types';

/** A small rose-tinted moon: blossom trees, one great rose, a quiet pool. Mostly here to
 *  prove travel between scenes; its look is a first sketch. */
export const roseMoon: SceneDef = {
  id: 'rose-moon',
  kind: 'planet',
  name: { zh: '玫瑰月', en: 'Rose Moon' },
  mood: {
    skyTop: 0x6c9fc4, skyMid: 0xb4d3df, skyLow: 0xf3ebe4,
    cloud: 0xfdf8f4, cloudShade: 0xe2d7dc, halo: 0xfbefee,
    sun: 0xfff0e0, shadowTint: 0x6a5f9e, rim: 0xf4dce4,
    grass: 0xd8c4c0, grassDark: 0xc4acb2, grassLight: 0xe8d8cf, sand: 0xefe3d0, path: 0xe2cfc0,
  },
  planet: {
    radius: 6,
    seed: 3,
    paths: [[[6, 14], [18, -8]]],
  },
  props: [
    { type: 'ship', id: 'ship', at: [4, 18], yaw: 200 },
    { type: 'rose', at: [22, -14], params: { scale: 3 } },
    { type: 'tree', at: [30, 20], yaw: 40, params: { scale: 0.9, leaf: 0xe6bcc4, leaf2: 0xd6a8b8 } },
    { type: 'tree', at: [-20, 40], yaw: 200, params: { scale: 0.75, leaf: 0xd6a8b8, leaf2: 0xeccfd2 } },
    { type: 'pond', at: [-14, -22], params: { radius: 0.9, depth: 0.3 } },
    { type: 'boulder', at: [-35, 100] },
    { type: 'boulder', at: [40, 150] },
    { type: 'boulder', at: [-10, -110] },
    { type: 'sprout', at: [10, 200] },
    { type: 'wisp', at: [-4, -2] },
  ],
  groundCover: { tufts: 330, flowers: 90 },
  spawn: { at: [-2, 14], heading: 180 },
  arrival: { at: [-2, 14], heading: 180 },
  exits: [{ prop: 'ship', to: 'meadow', label: { zh: '搭太空艇回 初始草原星', en: 'Fly back to Meadow Star' } }],
  skyBody: { color: 0xe8c4c0, radius: 3.2, ring: PAL.flowerB, pos: [-55, 30, -70] },
};
