import type { PropModule } from './kit';
import { house } from './house';
import { cabin } from './cabin';
import { campfire } from './campfire';
import { cushionTent, windowTent } from './tents';
import { ridgeTent } from './ridgeTent';
import { pyramidTent } from './pyramidTent';
import { rusticHut } from './rusticHut';
import { logCabin } from './logCabin';
import { spruce } from './spruce';
import { fence } from './fence';
import { tree } from './tree';
import { gardenTree } from './gardenTree';
import { baobab } from './baobab';
import { pond } from './pond';
import { stele } from './stele';
import { wisp } from './wisp';
import { ship } from './ship';
import { boulder, rose, sprout, volcano } from './small';
import { marker, ruin } from './ruin';
import { spirit } from './spiritAnimal';

/** Every prop type a scene file may place, by name. */
export const PROPS: Record<string, PropModule> = { house, cabin, campfire, cushionTent, windowTent, ridgeTent, pyramidTent, rusticHut, logCabin, spruce, fence, tree, gardenTree, baobab, pond, stele, wisp, ship, rose, volcano, sprout, boulder, ruin, marker, spirit };
