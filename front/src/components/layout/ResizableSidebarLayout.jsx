import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_WIDTH = 280
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 350
const STEP = 16

function clamp(value) {
  return Math.min(Math.max(value, MIN_WIDTH), MAX_WIDTH)
}

function storedWidth(storageKey) {
  const stored = Number(localStorage.getItem(storageKey))
  return Number.isFinite(stored) ? clamp(stored) : DEFAULT_WIDTH
}

export default function ResizableSidebarLayout({ children, sidebar, storageKey, className = '' }) {
  const layoutRef = useRef(null)
  const resizerRef = useRef(null)
  const [width, setWidthState] = useState(() => storedWidth(storageKey))

  const setWidth = useCallback((nextWidth) => {
    const clamped = clamp(Math.round(nextWidth))
    setWidthState(clamped)
    localStorage.setItem(storageKey, String(clamped))
  }, [storageKey])

  useEffect(() => {
    const resizer = resizerRef.current
    if (!resizer) return

    resizer.setAttribute('aria-valuemin', String(MIN_WIDTH))
    resizer.setAttribute('aria-valuemax', String(MAX_WIDTH))
    resizer.setAttribute('aria-valuenow', String(width))
  }, [width])

  const resizeFromPointer = useCallback((event) => {
    setWidth(window.innerWidth - event.clientX)
  }, [setWidth])

  const handlePointerDown = useCallback((event) => {
    event.preventDefault()
    layoutRef.current?.classList.add('is-resizing-sidebar')
    resizerRef.current?.setPointerCapture?.(event.pointerId)
    resizeFromPointer(event)
  }, [resizeFromPointer])

  const handlePointerMove = useCallback((event) => {
    if (!resizerRef.current?.hasPointerCapture?.(event.pointerId)) return
    resizeFromPointer(event)
  }, [resizeFromPointer])

  const endResize = useCallback((event) => {
    if (resizerRef.current?.hasPointerCapture?.(event.pointerId)) {
      resizerRef.current.releasePointerCapture?.(event.pointerId)
    }
    layoutRef.current?.classList.remove('is-resizing-sidebar')
  }, [])

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setWidth(width + STEP)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setWidth(width - STEP)
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setWidth(MIN_WIDTH)
    }
    if (event.key === 'End') {
      event.preventDefault()
      setWidth(MAX_WIDTH)
    }
  }, [setWidth, width])

  return (
    <div
      ref={layoutRef}
      className={`app-layout app-layout--sidebar-right ${className}`}
      style={{ '--sidebar-width': `${width}px` }}
    >
      <main id="content" className="app-content">
        {children}
      </main>

      <aside className="app-sidebar-container user-sidebar-shell">
        <div
          ref={resizerRef}
          className="sidebar-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar barra lateral"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onKeyDown={handleKeyDown}
        />
        {sidebar}
      </aside>
    </div>
  )
}
