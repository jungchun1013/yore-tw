/** What the player has done, kept apart from what is on screen. Scenes read their
 *  per-scene slot when they load; saving to storage comes later. */
export interface SceneState {
  visits: number;
}

export interface GameState {
  sceneId: string;
  scenes: Record<string, SceneState>;
}

export function newGame(first: string): GameState {
  return { sceneId: first, scenes: {} };
}

export function sceneSlot(state: GameState, id: string): SceneState {
  return (state.scenes[id] ??= { visits: 0 });
}
