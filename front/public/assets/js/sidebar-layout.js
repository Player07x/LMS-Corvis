const DEFAULT_MIN = 280;
const DEFAULT_MAX = 480;
const DEFAULT_WIDTH = 350;
const STEP = 16;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function readStoredWidth(storageKey, min, max) {
  const stored = Number(localStorage.getItem(storageKey));
  return Number.isFinite(stored) ? clamp(stored, min, max) : DEFAULT_WIDTH;
}

export function initResizableSidebar({
  layout,
  sidebarContainer,
  storageKey,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
} = {}) {
  if (!layout || !sidebarContainer || !storageKey) return null;

  const resizer = sidebarContainer.querySelector('.sidebar-resizer');
  if (!resizer) return null;

  const setWidth = (value, persist = true) => {
    const width = clamp(Math.round(value), min, max);
    layout.style.setProperty('--sidebar-width', `${width}px`);
    resizer.setAttribute('aria-valuemin', String(min));
    resizer.setAttribute('aria-valuemax', String(max));
    resizer.setAttribute('aria-valuenow', String(width));
    if (persist) localStorage.setItem(storageKey, String(width));
    return width;
  };

  setWidth(readStoredWidth(storageKey, min, max), false);

  const updateFromPointer = event => {
    setWidth(window.innerWidth - event.clientX);
  };

  resizer.addEventListener('pointerdown', event => {
    event.preventDefault();
    layout.classList.add('is-resizing-sidebar');
    resizer.setPointerCapture?.(event.pointerId);
    updateFromPointer(event);
  });

  resizer.addEventListener('pointermove', event => {
    if (!resizer.hasPointerCapture?.(event.pointerId)) return;
    updateFromPointer(event);
  });

  const endResize = event => {
    if (resizer.hasPointerCapture?.(event.pointerId)) {
      resizer.releasePointerCapture?.(event.pointerId);
    }
    layout.classList.remove('is-resizing-sidebar');
  };

  resizer.addEventListener('pointerup', endResize);
  resizer.addEventListener('pointercancel', endResize);

  resizer.addEventListener('keydown', event => {
    const current = Number(resizer.getAttribute('aria-valuenow')) || DEFAULT_WIDTH;
    let next = null;

    if (event.key === 'ArrowLeft') next = current + STEP;
    if (event.key === 'ArrowRight') next = current - STEP;
    if (event.key === 'Home') next = min;
    if (event.key === 'End') next = max;

    if (next === null) return;
    event.preventDefault();
    setWidth(next);
  });

  return { setWidth };
}
