// Only the view moves. Combat and the isometric projection retain their own coordinates.
export class BoardCamera {
  constructor(width, height) { this.width = width; this.height = height; this.min = .75; this.max = 2.5; this.reset(); }
  reset() { this.zoom = 1; this.x = 0; this.y = 0; }
  toWorld(x, y) {
    return {x: (x - this.width / 2 - this.x) / this.zoom + this.width / 2,
      y: (y - this.height / 2 - this.y) / this.zoom + this.height / 2};
  }
  toScreen(x, y) {
    return {x: (x - this.width / 2) * this.zoom + this.width / 2 + this.x,
      y: (y - this.height / 2) * this.zoom + this.height / 2 + this.y};
  }
  clamp() {
    const dx = Math.max(0, (this.zoom - 1) * this.width / 2), dy = Math.max(0, (this.zoom - 1) * this.height / 2);
    this.x = Math.max(-dx, Math.min(dx, this.x)); this.y = Math.max(-dy, Math.min(dy, this.y));
  }
  zoomAt(value, x = this.width / 2, y = this.height / 2) {
    const p = this.toWorld(x, y); this.zoom = Math.max(this.min, Math.min(this.max, value));
    this.x = x - this.width / 2 - (p.x - this.width / 2) * this.zoom;
    this.y = y - this.height / 2 - (p.y - this.height / 2) * this.zoom; this.clamp();
  }
  pan(dx, dy) { this.x += dx; this.y += dy; this.clamp(); }
}
