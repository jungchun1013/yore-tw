import type { PropModule } from './kit';
import { house } from './house';
import { cabin } from './cabin';
import { rusticHut } from './rusticHut';
import { logCabin } from './logCabin';
import { spruce } from './spruce';
import { fence } from './fence';
import { tree } from './tree';
import { pond } from './pond';
import { stele } from './stele';
import { wisp } from './wisp';
import { ship } from './ship';
import { boulder, rose, sprout, volcano } from './small';
import { marker, ruin } from './ruin';
import { deer } from './deer';

/** Every prop type a scene file may place, by name. */
export const PROPS: Record<string, PropModule> = { house, cabin, rusticHut, logCabin, spruce, fence, tree, pond, stele, wisp, ship, rose, volcano, sprout, boulder, ruin, marker, deer };
