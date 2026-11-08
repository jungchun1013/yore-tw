import type { PropModule } from './kit';
import { house } from './house';
import { fence } from './fence';
import { tree } from './tree';
import { pond } from './pond';
import { stele } from './stele';
import { wisp } from './wisp';
import { ship } from './ship';
import { boulder, rose, sprout, volcano } from './small';
import { marker, ruin } from './ruin';

/** Every prop type a scene file may place, by name. */
export const PROPS: Record<string, PropModule> = { house, fence, tree, pond, stele, wisp, ship, rose, volcano, sprout, boulder, ruin, marker };
