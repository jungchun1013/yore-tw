/** A scene is pure data: what the world looks like, what stands where, and where it leads.
 *  Sky-style realms that are not spheres get a new `kind` and their own world builder. */
export type LatLon = readonly [lat: number, lon: number];

export interface Mood {
  skyTop: number; skyMid: number; skyLow: number;
  cloud: number; cloudShade: number; halo: number;
  sun: number; shadowTint: number; rim: number;
  grass: number; grassDark: number; grassLight: number; sand: number; path: number;
}

/** A winding path through waypoints; `width` in world units (default 0.6). */
export interface PathDef {
  points: LatLon[];
  width?: number;
  /** How far the path wanders sideways, world units (default 0.35). */
  wind?: number;
}

export interface PropPlacement {
  type: string;
  at: LatLon;
  yaw?: number;
  /** Name other data can point at (exits). */
  id?: string;
  params?: Record<string, unknown>;
}

export interface ExitDef {
  /** id of the prop that acts as the door (usually the ship). */
  prop: string;
  to: string;
  label: { zh: string; en: string };
}

/** How this scene looks from far away, hanging in another scene's sky. */
export interface SkyBody {
  color: number;
  radius: number;
  ring?: number;
  pos: readonly [number, number, number];
}

export interface SceneDef {
  id: string;
  kind: 'planet';
  name: { zh: string; en: string };
  mood: Mood;
  planet: { radius: number; seed: number; paths: PathDef[] };
  /** Built in order; the order also fixes the seeded random sequence. */
  props: PropPlacement[];
  groundCover: { tufts: number; flowers: number };
  /** Where a new game starts. */
  spawn: { at: LatLon; heading: number };
  /** Where you step out when you arrive by ship (defaults to spawn). */
  arrival?: { at: LatLon; heading: number };
  exits: ExitDef[];
  skyBody: SkyBody;
}
