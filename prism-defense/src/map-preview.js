import {makePath,COLS,ROWS,goalCourt} from './engine.mjs';
export function mapPreview(map) {
  const path = makePath(map), road = new Set(path.map(p => p.join(','))), first = path[0], end = path.at(-1), stone = new Set(goalCourt(path).map(p=>p.join(',')));
  const cells = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) cells.push(`<rect x="${x*20}" y="${y*20}" width="20" height="20" fill="${stone.has(x+','+y)?'#b1b0ad':road.has(x+','+y)?'#d0bb9b':(x*13+y*7)%3===0?'#b8c29f':'#c1c9ab'}"/>`);
  const ex = end[0]*20+10, ey = end[1]*20+10;
  return `<svg viewBox="0 0 ${COLS*20} ${ROWS*20}" role="img" aria-label="${map.name}地圖平面圖，綠點為入口，粉紅菱形為終點" data-map-preview="${map.id}" shape-rendering="crispEdges">${cells.join('')}<circle cx="${first[0]*20+10}" cy="${first[1]*20+10}" r="7" fill="#5e806b"/><path d="M${ex} ${ey-9}l8 9-8 9-8-9z" fill="#bc858d"/></svg>`;
}
