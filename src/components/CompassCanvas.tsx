import React, { useEffect, useRef } from 'react';
import { THEME } from '../constants/palette';
import { CompassInkUiState, GearCircle, InkStroke } from '../types/spirograph';
import { computeChain } from '../utils/gearMath';

interface CompassCanvasProps {
  uiStateRef: React.MutableRefObject<CompassInkUiState>;
  liveCirclesRef: React.MutableRefObject<GearCircle[]>;
  strokesRef: React.MutableRefObject<InkStroke[]>;
  onTick: (dt: number) => void;
  onPan: (dx: number, dy: number) => void;
  onZoom: (
    scale: number,
    pivotX: number,
    pivotY: number,
    width: number,
    height: number
  ) => void;
  onEndPenTapped: () => void;
}

export const CompassCanvas: React.FC<CompassCanvasProps> = ({
  uiStateRef,
  liveCirclesRef,
  strokesRef,
  onTick,
  onPan,
  onZoom,
  onEndPenTapped,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 390, height: 844 });

  // Pointer gesture tracking
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const tapCandidateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const pinchStateRef = useRef<{
    dist: number;
    cx: number;
    cy: number;
  } | null>(null);

  const callbacksRef = useRef({ onTick, onPan, onZoom, onEndPenTapped });
  callbacksRef.current = { onTick, onPan, onZoom, onEndPenTapped };

  // Handle canvas resize with devicePixelRatio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      sizeRef.current = { width: w, height: h };
      const targetW = Math.round(w * dpr);
      const targetH = Math.round(h * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(canvas);
    window.addEventListener('resize', updateSize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Wheel zoom listener (non-passive to prevent browser page zoom)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const pivotX = e.clientX - rect.left;
      const pivotY = e.clientY - rect.top;
      const delta = Math.max(-120, Math.min(120, e.deltaY));
      const scaleFactor = Math.exp(-delta * 0.0022);
      callbacksRef.current.onZoom(scaleFactor, pivotX, pivotY, rect.width, rect.height);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Main 60fps simulation & render loop
  useEffect(() => {
    let rafId = 0;
    let lastTimestamp = 0;

    const renderFrame = (now: number) => {
      if (lastTimestamp > 0 && uiStateRef.current.isPlaying) {
        const dt = Math.min(Math.max((now - lastTimestamp) / 1000, 0.001), 0.05);
        callbacksRef.current.onTick(dt);
      }
      lastTimestamp = now;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const { width, height } = sizeRef.current;
          const state = uiStateRef.current;
          const circles = liveCirclesRef.current;
          const strokes = strokesRef.current;
          const chain = computeChain(circles);

          // Linear triangle wave matching Compose tween(800ms, LinearEasing) + RepeatMode.Reverse
          const phase = ((now % 1600) / 800);
          const triangle = phase <= 1 ? phase : 2 - phase;
          const pulseAlpha = 0.2 + 0.55 * triangle;

          ctx.save();
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          // Clear background
          ctx.fillStyle = THEME.CanvasBg;
          ctx.fillRect(0, 0, width, height);

          const baseScale = Math.min(width, height) / 900;
          const worldScale = Math.max(state.zoom * baseScale, 0.0001);
          const cx = width / 2 + state.panX;
          const cy = height / 2 + state.panY;

          ctx.translate(cx, cy);
          ctx.scale(worldScale, worldScale);

          // 1. Draw Ink Strokes
          const hiddenSet = new Set(state.hiddenLayerIds);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.setLineDash([]);

          for (let i = 0; i < strokes.length; i++) {
            const stroke = strokes[i];
            if (hiddenSet.has(stroke.id)) continue;
            if (stroke.points.length < 2) continue;

            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = Math.max(0.5 / worldScale, stroke.weight);
            if (stroke.path2d) {
              ctx.stroke(stroke.path2d);
            } else {
              ctx.beginPath();
              ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
              for (let j = 1; j < stroke.points.length; j++) {
                ctx.lineTo(stroke.points[j].x, stroke.points[j].y);
              }
              ctx.stroke();
            }
          }

          // 2. Draw Guides (Connecting Rods & Trajectory Circles)
          if (state.showGuides) {
            const guideWidth = 1.2 / worldScale;
            const rodWidth = 1.5 / worldScale;
            const dotRadius = 3 / worldScale;
            const dashLen = 6 / worldScale;

            for (let i = 0; i < chain.length; i++) {
              const link = chain[i];

              // Circle orbit guide
              ctx.save();
              ctx.strokeStyle = 'rgba(110, 95, 69, 0.35)';
              ctx.lineWidth = guideWidth;
              ctx.setLineDash([dashLen, dashLen]);
              ctx.beginPath();
              ctx.arc(link.cx, link.cy, Math.abs(link.radius), 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();

              // Link arm / connecting rod
              ctx.strokeStyle = 'rgba(201, 162, 106, 0.45)';
              ctx.lineWidth = rodWidth;
              ctx.setLineDash([]);
              ctx.beginPath();
              ctx.moveTo(link.cx, link.cy);
              ctx.lineTo(link.px, link.py);
              ctx.stroke();

              // Center pivot joint
              ctx.fillStyle = 'rgba(201, 162, 106, 0.6)';
              ctx.beginPath();
              ctx.arc(link.cx, link.cy, dotRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // 3. Draw Points / Pen Heads / Bolts
          if (state.showPoints) {
            for (let i = 0; i < chain.length; i++) {
              const link = chain[i];
              if (link.isPen) {
                const glowRadius = 12 / worldScale;
                const coreRadius = 5.5 / worldScale;

                // Outer glowing aura
                ctx.save();
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = link.color;
                ctx.beginPath();
                ctx.arc(link.px, link.py, glowRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Inner solid nib
                ctx.fillStyle = link.color;
                ctx.beginPath();
                ctx.arc(link.px, link.py, coreRadius, 0, Math.PI * 2);
                ctx.fill();

                // Bright center highlight
                ctx.fillStyle = THEME.PaperWhite;
                ctx.beginPath();
                ctx.arc(link.px, link.py, coreRadius * 0.4, 0, Math.PI * 2);
                ctx.fill();
              } else {
                const boltRadius = 5.5 / worldScale;
                ctx.fillStyle = THEME.BoltGray;
                ctx.beginPath();
                ctx.arc(link.px, link.py, boltRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = THEME.BoltDark;
                ctx.lineWidth = 1.2 / worldScale;
                ctx.stroke();

                ctx.fillStyle = THEME.BoltDark;
                ctx.beginPath();
                ctx.arc(link.px, link.py, boltRadius * 0.35, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // 4. Trailing End-Pen Pulse Beacon (Tap to add gear indicator)
            if (chain.length > 0) {
              const end = chain[chain.length - 1];
              const pulseRadius = (13 + pulseAlpha * 7) / worldScale;
              ctx.save();
              ctx.globalAlpha = pulseAlpha * 0.4;
              ctx.strokeStyle = THEME.PaperWhite;
              ctx.lineWidth = 1.2 / worldScale;
              ctx.beginPath();
              ctx.arc(end.px, end.py, pulseRadius, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          }

          ctx.restore();
        }
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);
    return () => window.cancelAnimationFrame(rafId);
  }, [liveCirclesRef, strokesRef, uiStateRef]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pointersRef.current.set(e.pointerId, { x, y });

    if (pointersRef.current.size === 1) {
      tapCandidateRef.current = {
        pointerId: e.pointerId,
        startX: x,
        startY: y,
        moved: false,
      };
      pinchStateRef.current = null;
    } else if (pointersRef.current.size === 2) {
      tapCandidateRef.current = null;
      const pts = Array.from(pointersRef.current.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      pinchStateRef.current = {
        dist: Math.hypot(dx, dy),
        cx: (pts[0].x + pts[1].x) / 2,
        cy: (pts[0].y + pts[1].y) / 2,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!pointersRef.current.has(e.pointerId)) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const prev = pointersRef.current.get(e.pointerId)!;
    const dx = x - prev.x;
    const dy = y - prev.y;
    pointersRef.current.set(e.pointerId, { x, y });

    if (pointersRef.current.size === 1) {
      const candidate = tapCandidateRef.current;
      if (candidate && candidate.pointerId === e.pointerId) {
        const totalDist = Math.hypot(x - candidate.startX, y - candidate.startY);
        if (totalDist > 6) {
          candidate.moved = true;
        }
      }
      if (dx !== 0 || dy !== 0) {
        callbacksRef.current.onPan(dx, dy);
      }
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const newDist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      const newCx = (pts[0].x + pts[1].x) / 2;
      const newCy = (pts[0].y + pts[1].y) / 2;

      const prevPinch = pinchStateRef.current;
      if (prevPinch && prevPinch.dist > 5) {
        const scaleFactor = newDist / prevPinch.dist;
        if (Math.abs(scaleFactor - 1) > 0.0001) {
          callbacksRef.current.onZoom(scaleFactor, newCx, newCy, rect.width, rect.height);
        }
        const panDx = newCx - prevPinch.cx;
        const panDy = newCy - prevPinch.cy;
        if (panDx !== 0 || panDy !== 0) {
          callbacksRef.current.onPan(panDx, panDy);
        }
      }
      pinchStateRef.current = { dist: newDist, cx: newCx, cy: newCy };
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }

    const candidate = tapCandidateRef.current;
    if (
      e.type === 'pointerup' &&
      candidate &&
      candidate.pointerId === e.pointerId &&
      !candidate.moved &&
      pointersRef.current.size === 1 &&
      canvas
    ) {
      const rect = canvas.getBoundingClientRect();
      const tapX = e.clientX - rect.left;
      const tapY = e.clientY - rect.top;
      const chain = computeChain(liveCirclesRef.current);
      if (chain.length > 0) {
        const end = chain[chain.length - 1];
        const state = uiStateRef.current;
        const baseScale = Math.min(rect.width, rect.height) / 900;
        const worldScale = state.zoom * baseScale;
        const screenCenterX = rect.width / 2 + state.panX;
        const screenCenterY = rect.height / 2 + state.panY;
        const screenPenX = screenCenterX + end.px * worldScale;
        const screenPenY = screenCenterY + end.py * worldScale;

        const dist = Math.hypot(tapX - screenPenX, tapY - screenPenY);
        if (dist <= 36) {
          callbacksRef.current.onEndPenTapped();
        }
      }
    }

    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      pinchStateRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      tapCandidateRef.current = null;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      className="block w-full h-full touch-none select-none cursor-grab active:cursor-grabbing"
      aria-label="Spirograph simulation canvas"
    />
  );
};
