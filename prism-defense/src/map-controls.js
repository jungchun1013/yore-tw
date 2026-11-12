export function mountMapControls(canvas, camera, {onPick, onHover}) {
  const out = document.querySelector('#zoom-out'), reset = document.querySelector('#zoom-reset'), into = document.querySelector('#zoom-in');
  const pointers = new Map(); let pinched = false;
  const point = e => { const r = canvas.getBoundingClientRect(); return {x: (e.clientX - r.left) / r.width * camera.width, y: (e.clientY - r.top) / r.height * camera.height}; };
  function sync() {
    reset.textContent = Math.round(camera.zoom * 100) + '%';
    out.disabled = camera.zoom <= camera.min; into.disabled = camera.zoom >= camera.max;
    canvas.dataset.zoom = camera.zoom.toFixed(3); canvas.dataset.panX = camera.x.toFixed(3); canvas.dataset.panY = camera.y.toFixed(3);
    canvas.classList.toggle('zoomed', camera.zoom > 1);
  }
  const changed = () => { onHover(null); sync(); };
  out.addEventListener('click', () => { camera.zoomAt(camera.zoom - .25); changed(); });
  into.addEventListener('click', () => { camera.zoomAt(camera.zoom + .25); changed(); });
  reset.addEventListener('click', () => { camera.reset(); changed(); });
  canvas.addEventListener('wheel', e => {
    e.preventDefault(); const p = point(e);
    const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? camera.height : 1);
    camera.zoomAt(camera.zoom * Math.exp(-delta * .002), p.x, p.y); changed();
  }, {passive: false});
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    canvas.focus({preventScroll: true}); const p = point(e);
    pointers.set(e.pointerId, {...p, start: p, dragged: false}); canvas.setPointerCapture(e.pointerId);
    if (pointers.size > 1) { pinched = true; for (const p of pointers.values()) p.dragged = true; onHover(null); }
  });
  canvas.addEventListener('pointermove', e => {
    const p = point(e), old = pointers.get(e.pointerId);
    if (!old) { onHover(camera.toWorld(p.x, p.y)); return; }
    if (pointers.size > 1) {
      const other = [...pointers.entries()].find(([id]) => id !== e.pointerId)[1];
      const distance = Math.hypot(old.x - other.x, old.y - other.y), next = Math.hypot(p.x - other.x, p.y - other.y);
      const mid = {x: (old.x + other.x) / 2, y: (old.y + other.y) / 2};
      if (distance > 0) camera.zoomAt(camera.zoom * next / distance, mid.x, mid.y);
      camera.pan((p.x - old.x) / 2, (p.y - old.y) / 2);
      pointers.set(e.pointerId, {...old, ...p, dragged: true}); changed(); return;
    }
    const threshold = 6 * camera.width / canvas.getBoundingClientRect().width;
    const dragged = old.dragged || Math.hypot(p.x - old.start.x, p.y - old.start.y) > threshold;
    if (dragged) {
      camera.pan(p.x - (old.dragged ? old.x : old.start.x), p.y - (old.dragged ? old.y : old.start.y));
      canvas.classList.add('dragging'); changed();
    }
    pointers.set(e.pointerId, {...old, ...p, dragged});
  });
  function release(e, cancel = false) {
    const old = pointers.get(e.pointerId); if (!old) return;
    const p = point(e);
    if (!cancel && !pinched && !old.dragged && p.x >= 0 && p.x <= camera.width && p.y >= 0 && p.y <= camera.height) onPick(camera.toWorld(p.x, p.y));
    pointers.delete(e.pointerId);
    if (!pointers.size) { pinched = false; canvas.classList.remove('dragging'); }
  }
  canvas.addEventListener('pointerup', e => release(e));
  canvas.addEventListener('pointercancel', e => release(e, true));
  canvas.addEventListener('lostpointercapture', e => release(e, true));
  canvas.addEventListener('pointerleave', () => onHover(null));
  sync(); return {sync};
}
