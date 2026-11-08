import * as THREE from 'three';

export interface InputHandlers {
  drag(dx: number, dy: number): void;
  zoom(delta: number): void;
  tap(x: number, y: number): void;
  interact(): void;
}

/** Keyboard + mouse + touch, turned into a few intents. */
export class Input {
  private keys = new Set<string>();
  private pointers = new Map<number, { x: number; y: number; sx: number; sy: number }>();
  private dragging = false;
  private pinchDist = 0;

  constructor(canvas: HTMLCanvasElement, h: InputHandlers) {
    addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if ((k === 'e' || k === ' ') && !e.repeat) {
        e.preventDefault();
        h.interact();
      }
      this.keys.add(k);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
      this.dragging = false;
      if (this.pointers.size === 2) this.pinchDist = this.span();
    });
    canvas.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (this.pointers.size === 2) {
        const d = this.span();
        h.zoom((d - this.pinchDist) * 0.004);
        this.pinchDist = d;
        this.dragging = true;
        return;
      }
      if (!this.dragging && Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6) this.dragging = true;
      if (this.dragging) h.drag(dx, dy);
    });
    canvas.addEventListener('pointerup', (e) => {
      const p = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (p && !this.dragging && this.pointers.size === 0) h.tap(e.clientX, e.clientY);
    });
    canvas.addEventListener('pointercancel', (e) => this.pointers.delete(e.pointerId));
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      h.zoom(-e.deltaY * 0.0012);
    }, { passive: false });
  }

  private span() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /** WASD / arrows as (x = right, y = up); zero when idle. */
  get stick() {
    const v = new THREE.Vector2();
    const k = this.keys;
    if (k.has('w') || k.has('arrowup')) v.y += 1;
    if (k.has('s') || k.has('arrowdown')) v.y -= 1;
    if (k.has('a') || k.has('arrowleft')) v.x -= 1;
    if (k.has('d') || k.has('arrowright')) v.x += 1;
    return v;
  }
}
