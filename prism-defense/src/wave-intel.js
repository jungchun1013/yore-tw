import {wavePreview} from './engine.mjs';
const kinds = {normal: ['一般敵人', 0], fast: ['高速敵人', 1], armor: ['重甲敵人', 2], swarm: ['小型敵人', 3], boss: ['首領', 4]};
let previous = '';
export function updateWaveIntel(game, paused) {
  const ended = ['won', 'lost'].includes(game.state), preparing = game.state === 'planning';
  document.querySelector('#hint').textContent = ended ? game.state === 'won' ? '防守成功' : '防線失守' : paused ? '已暫停' : preparing ? '準備階段' : `第 ${game.wave} 波`;
  document.querySelector('#wave-preview-label').textContent = ended ? '' : preparing ? '・下一波情報：' : '・本波敵人：';
  const wave = Math.min(20, game.wave + (preparing ? 1 : 0)), key = ended ? 'ended' : String(wave);
  if (key === previous) return; previous = key;
  document.querySelector('#wave-enemies').innerHTML = ended ? '' : wavePreview(wave).map(({kind, count}) => {
    const [name, cell] = kinds[kind];
    return `<span class="enemy-preview" role="img" aria-label="${name}，${count} 隻" title="${name} × ${count}" style="background-position:${cell % 3 * 50}% ${Math.floor(cell / 3) * 100}%"></span>`;
  }).join('');
}
