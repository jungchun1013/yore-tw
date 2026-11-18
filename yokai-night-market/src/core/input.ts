// Keyboard plus a floating touch stick: press anywhere on the play field and drag.
const keys = new Set<string>();
let stickId = -1, sx = 0, sy = 0, dx = 0, dy = 0;
let stickEl: HTMLElement | null = null, knobEl: HTMLElement | null = null;
export let usedTouch = false;

const MAP: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
};
const RADIUS = 56;

export function initInput(field: HTMLElement): void {
  stickEl = document.createElement('div'); stickEl.className = 'stick';
  knobEl = document.createElement('div'); knobEl.className = 'knob';
  stickEl.appendChild(knobEl);
  field.appendChild(stickEl);

  window.addEventListener('keydown', (e) => { if (MAP[e.code]) { keys.add(e.code); e.preventDefault(); } });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); release(); });

  field.addEventListener('pointerdown', (e) => {
    if (stickId !== -1) return;
    if (e.pointerType !== 'mouse') usedTouch = true;
    stickId = e.pointerId; sx = e.clientX; sy = e.clientY; dx = dy = 0;
    field.setPointerCapture?.(e.pointerId);
    if (stickEl) { stickEl.style.display = 'block'; stickEl.style.left = `${sx}px`; stickEl.style.top = `${sy}px`; }
    if (knobEl) knobEl.style.transform = 'translate(-50%, -50%)';
    e.preventDefault();
  });
  field.addEventListener('pointermove', (e) => {
    if (e.pointerId !== stickId) return;
    let x = e.clientX - sx, y = e.clientY - sy;
    const len = Math.hypot(x, y);
    if (len > RADIUS) { x = (x / len) * RADIUS; y = (y / len) * RADIUS; }
    dx = x / RADIUS; dy = y / RADIUS;
    if (knobEl) knobEl.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  });
  const up = (e: PointerEvent): void => { if (e.pointerId === stickId) release(); };
  field.addEventListener('pointerup', up);
  field.addEventListener('pointercancel', up);
}

function release(): void {
  stickId = -1; dx = dy = 0;
  if (stickEl) stickEl.style.display = 'none';
}

export function resetInput(): void { keys.clear(); release(); }

export function readInput(): [number, number] {
  let x = dx, y = dy;
  for (const k of keys) { x += MAP[k][0]; y += MAP[k][1]; }
  const len = Math.hypot(x, y);
  if (len > 1) { x /= len; y /= len; }
  return [x, y];
}
