/** Enlarge native pixel drawings without smoothing or changing their logical size. */
export const OBJECT_DENSITY = 4;

export function scaleObject(c: HTMLCanvasElement, density: number): HTMLCanvasElement {
  if (density === 1) return c;
  const out = document.createElement('canvas'); out.width = c.width * density; out.height = c.height * density;
  const x = out.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  x.drawImage(c, 0, 0, out.width, out.height);
  return out;
}
