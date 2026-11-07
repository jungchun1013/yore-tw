import type { GameController } from '../src/core/controller';
import type { analytics } from '../src/core/events';
import type * as sprites from '../src/game/sprites/pixel';
declare global { interface Window { __mc?: { ctrl: GameController; analytics: typeof analytics; sprites: typeof sprites; hero?: () => { x: number; y: number }; debug?: { spawnCustomer(): void; customer(): { x: number; y: number; mode: string; species: string } | null; roamer(): { x: number; y: number; gen: string } | null; bless(): void; timeSkip(): void; shootStar(): { x: number; y: number } | null; star(): { x: number; y: number } | null; social(kind: string): boolean; furniture(): string[] } } } }
export {};
