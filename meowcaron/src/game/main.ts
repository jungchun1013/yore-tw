import Phaser from 'phaser';
import type { GameController } from '../core/controller';
import { CafeScene } from './scenes/CafeScene';
import { UI } from '../content/palette';

export function startPhaser(ctrl: GameController): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: UI.bg,
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%', autoCenter: Phaser.Scale.NO_CENTER },
    input: { activePointers: 3 },
    scene: [new CafeScene(ctrl)],
    audio: { noAudio: true },
    banner: false,
  });
}
