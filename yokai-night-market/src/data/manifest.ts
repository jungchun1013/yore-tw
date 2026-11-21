// Every picture the game uses is registered here, one entry each. Loaders, the street, the
// furniture list and the art backlog all read this file; nothing else hard-codes a picture.
//
// status:
//   approved     the user accepted this picture; it is live
//   placeholder  live, but standing in for something not drawn yet (see docs/art/BACKLOG.md)
//   pending      requested from Codex; anything that depends on it stays out of the game until
//                its file exists (an enemy does not spawn, a prop is skipped)
// source:
//   tainan  single PNG in public/art/tainan/<key>.png (cut by art-source/tainan/*.py)
//   atlas   cell of public/art/paper-atlas.png (Codex's first 3x3 sheet)
//   puppet  parts + rig.json in public/art/puppets/<key>/ (see docs/art/RIG-SPEC.md)

export type AssetKind = 'sprite' | 'puppet' | 'tile' | 'backdrop';
export type AssetStatus = 'approved' | 'placeholder' | 'pending';
export type AssetLayer = 'building' | 'decor' | 'tree' | 'character' | 'enemy' | 'food' | 'item' | 'fauna';

export interface Asset {
  key: string;
  kind: AssetKind;
  layer: AssetLayer;
  height: number;               // in-game height in logical px
  status: AssetStatus;
  source: 'tainan' | 'atlas' | 'puppet';
  cell?: number;                // atlas cell 0..8
  footprint?: [number, number]; // floor cells it occupies when placed (width, depth)
  tags?: string[];              // 'furniture' can be placed; 'landmark' stands on the street; 'stall'; 'fauna'
  replaces?: string[];          // older sprite keys this picture is drawn for
  name?: string;                // working label for editors and the backlog, not shown to players
}

const a = (key: string, layer: AssetLayer, height: number, status: AssetStatus, extra: Partial<Asset> = {}): Asset =>
  ({ key, kind: 'sprite', layer, height, status, source: 'tainan', ...extra });

export const ASSETS: Asset[] = [
  // ---- buildings: Codex redraw v3 and the ink-print sheet (approved 2026-11-18) ----
  a('chihkan', 'building', 150, 'approved', { tags: ['landmark'], name: '赤崁樓' }),
  a('shennong', 'building', 130, 'approved', { tags: ['landmark'], name: '神農街屋' }),
  a('hayashi', 'building', 170, 'approved', { tags: ['landmark'], name: '林百貨' }),
  a('confucius', 'building', 120, 'placeholder', { tags: ['landmark'], replaces: ['redgate'], name: '孔廟全臺首學門（Codex 實景稿，待核可）' }),
  a('machiya', 'building', 130, 'approved', { tags: ['landmark'], name: '日式町屋' }),
  a('noodleStall', 'building', 84, 'approved', { tags: ['stall'], name: '擔仔麵攤' }),
  a('brickHouse', 'building', 120, 'approved', { tags: ['landmark'], name: '紅磚洋樓' }),
  a('woodHouse', 'building', 100, 'approved', { tags: ['landmark'], name: '日式木屋' }),
  // first 3x3 sheet
  a('stall', 'building', 106, 'approved', { source: 'atlas', cell: 3, tags: ['stall'], name: '店鋪' }),
  a('shrine', 'building', 110, 'approved', { source: 'atlas', cell: 4, tags: ['landmark'], name: '小祠' }),
  a('torii', 'building', 108, 'approved', { source: 'atlas', cell: 5, tags: ['landmark'], name: '鳥居' }),
  // requested
  a('literature', 'building', 124, 'placeholder', { tags: ['landmark'], name: '臺灣文學館（舊臺南州廳；Codex 紙雕試畫，待核可）' }),
  a('panggongSide', 'building', 130, 'placeholder', { tags: ['landmark'], name: '泮宮石坊（斜角）' }),
  a('confuciusWall', 'decor', 54, 'placeholder', { tags: ['connector'], name: '孔廟紅圍牆' }),
  a('plumeria', 'tree', 86, 'placeholder', { name: '雞蛋花' }),
  a('norfolkPine', 'tree', 190, 'placeholder', { name: '南洋杉' }),
  a('rainTree', 'tree', 150, 'placeholder', { name: '雨豆樹' }),
  a('panggong', 'building', 110, 'placeholder', { tags: ['landmark'], name: '泮宮石坊（Codex 實景稿，待核可）' }),
  a('butokuden', 'building', 120, 'placeholder', { tags: ['landmark'], name: '武德殿（Codex 紙雕稿，待核可）' }),
  a('weather', 'building', 130, 'pending', { tags: ['landmark'], name: '臺南測候所' }),
  a('police', 'building', 120, 'pending', { tags: ['landmark'], name: '舊臺南警察署' }),
  a('firehall', 'building', 150, 'pending', { tags: ['landmark'], name: '合同廳舍' }),
  a('bank', 'building', 120, 'pending', { tags: ['landmark'], name: '日本勸業銀行臺南支店' }),

  // ---- decor ----
  a('swordLionWall', 'decor', 46, 'approved', { replaces: ['swordlion'], tags: ['furniture'], footprint: [1, 1], name: '劍獅壁飾' }),
  a('lantern', 'decor', 40, 'approved', { replaces: ['lanterns'], tags: ['furniture'], footprint: [1, 1], name: '紅燈籠' }),
  a('tileFlower', 'decor', 22, 'approved', { tags: ['furniture'], footprint: [1, 1], name: '花磚' }),
  a('censer', 'decor', 30, 'approved', { tags: ['furniture'], footprint: [1, 1], name: '香爐' }),
  a('stoneLantern', 'decor', 65, 'approved', { source: 'atlas', cell: 8, replaces: ['andon'], tags: ['furniture'], footprint: [1, 1], name: '石燈籠' }),

  // ---- pieces that join buildings (request 14-connectors, Codex from real references; awaiting approval) ----
  a('woodFence', 'decor', 34, 'placeholder', { tags: ['furniture', 'connector'], footprint: [3, 1], name: '木柵欄' }),
  a('ixoraHedge', 'decor', 32, 'placeholder', { tags: ['furniture', 'connector'], footprint: [3, 1], name: '矮仙丹樹叢' }),
  a('brickLowWall', 'decor', 34, 'placeholder', { tags: ['furniture', 'connector'], footprint: [3, 1], name: '紅磚矮牆' }),
  a('bambooFence', 'decor', 32, 'placeholder', { tags: ['furniture', 'connector'], footprint: [3, 1], name: '竹籬' }),
  a('potRow', 'decor', 40, 'placeholder', { tags: ['furniture', 'connector'], footprint: [3, 1], name: '一排盆栽' }),
  a('greenHedge', 'decor', 30, 'placeholder', { tags: ['furniture', 'connector'], footprint: [3, 1], name: '月橘綠籬' }),

  // ---- trees ----
  a('sakura', 'tree', 120, 'approved', { source: 'atlas', cell: 6, tags: ['furniture'], footprint: [2, 2], name: '櫻花' }),
  a('maple', 'tree', 120, 'placeholder', { source: 'atlas', cell: 7, replaces: ['phoenix'], tags: ['furniture'], footprint: [2, 2], name: '楓樹（暫代鳳凰木）' }),
  a('banyan', 'tree', 150, 'placeholder', { name: '榕樹（待核可）' }),
  a('flameTree', 'tree', 120, 'placeholder', { name: '鳳凰木（待核可）' }),
  a('royalPalm', 'tree', 150, 'placeholder', { name: '大王椰子（待核可）' }),
  a('literatureSide', 'building', 102, 'placeholder', { name: '文學館側翼（待核可）' }),
  a('literatureWall', 'decor', 30, 'placeholder', { tags: ['connector'], name: '文學館矮圍牆（待核可）' }),

  // ---- characters ----
  a('miko', 'character', 50, 'approved', { name: '小滿' }),
  a('sayo', 'character', 50, 'approved', { name: '小夜（小滿換色）' }),
  a('fox', 'character', 52, 'approved', { name: '狐狸' }),
  { key: 'miko', kind: 'puppet', layer: 'character', height: 50, status: 'placeholder', source: 'puppet', name: '小滿紙偶（由整張圖拆件）' },
  { key: 'sayo', kind: 'puppet', layer: 'character', height: 50, status: 'placeholder', source: 'puppet', name: '小夜紙偶' },
  { key: 'fox', kind: 'puppet', layer: 'character', height: 52, status: 'placeholder', source: 'puppet', name: '狐狸紙偶（由整張圖拆件）' },

  // ---- animals on the street (request 12-fauna) ----
  a('malayanNightHeron', 'fauna', 34, 'pending', { tags: ['fauna'], name: '黑冠麻鷺' }),
  a('spottedDove', 'fauna', 18, 'pending', { tags: ['fauna'], name: '珠頸斑鳩' }),

  // ---- enemies ----
  a('chochin', 'enemy', 40, 'approved', { source: 'atlas', cell: 2, name: '提燈妖' }),
  a('kuroneko', 'enemy', 34, 'pending', { name: '黑貓' }),
  a('hebi', 'enemy', 26, 'pending', { name: '小青蛇' }),
  a('fengshi', 'enemy', 52, 'pending', { name: '風獅爺' }),
  a('bixi', 'enemy', 46, 'pending', { name: '贔屭' }),

  // ---- food (goods at the stall) ----
  a('danzai', 'food', 24, 'placeholder', { name: '擔仔麵（待加配料）' }),
  a('milkfish', 'food', 24, 'approved', { name: '虱目魚湯' }),
  a('wagui', 'food', 17, 'placeholder', { name: '碗粿（待重畫）' }),
  a('pengbing', 'food', 24, 'approved', { name: '椪餅' }),
  a('dango', 'food', 24, 'approved', { name: '糰子' }),
  a('lurou', 'food', 24, 'pending', { name: '滷肉飯' }),
];

export const SPRITE_ASSETS = ASSETS.filter((x) => x.kind === 'sprite');
export const PUPPET_ASSETS = ASSETS.filter((x) => x.kind === 'puppet');
export const ASSET: Record<string, Asset> = Object.fromEntries(SPRITE_ASSETS.map((x) => [x.key, x]));

// Keys still waiting for a picture. The loader removes a key when its file loads, so a new
// monster or building appears as soon as its PNG is cut into public/art/tainan.
export const PENDING_ART = new Set<string>(SPRITE_ASSETS.filter((x) => x.status === 'pending').map((x) => x.key));

// older sprite key -> the picture that replaces it
export const REPLACES: Record<string, string> = {};
for (const x of SPRITE_ASSETS) for (const old of x.replaces ?? []) REPLACES[old] = x.key;

export const withTag = (tag: string): Asset[] => SPRITE_ASSETS.filter((x) => x.tags?.includes(tag));
