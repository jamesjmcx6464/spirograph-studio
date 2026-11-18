import React, { useEffect, useRef, useCallback } from 'react';
import { GearCircle, InkStroke, ResolvedLink } from '../types/spirograph';
import {
  BoltDark,
  BoltGray,
  BrassDim,
  BrassGold,
  CanvasBg,
  PaperWhite,
} from '../constants/theme';
import { computeChain, ensureStrokeChunks } from '../utils/spiroMath';

interface SpirographCanvasProps {
  circles: GearCircle[];
  strokes: InkStroke[];
  showGuides: boolean;
  showPoints: boolean;
  panX: number;
  panY: number;
  zoom: number;
  hiddenLayerIds?: Set<number>;
  onPan: (dx: number, dy: number) => void;
  onZoom: (scaleFactor: number, pivotX: number, pivotY: number, viewWidth: number, viewHeight: number) => void;
  onResetView?: () => void;
}

export const SpirographCanvas: React.FC<SpirographCanvasProps> = ({
  circles,
  strokes,
  showGuides,
  showPoints,
  panX,
  panY,
  zoom,
  hiddenLayerIds = new Set(),
  onPan,
  onZoom,
  onResetView,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const touchStateRef = useRef<{
    initialDistance?: number;
    lastTouchPos?: { x: number; y: number };
  }>({});

  // Main draw loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;

    // Clear with blueprint dark obsidian background
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = CanvasBg;
    ctx.fillRect(0, 0, width, height);

    // Camera transform: Center of canvas + pan, scaled by zoom
    const centerX = width / 2 + panX * dpr;
    const centerY = height / 2 + panY * dpr;
    const totalZoom = zoom * dpr;

    ctx.translate(centerX, centerY);
    ctx.scale(totalZoom, totalZoom);

    // 1. Draw Ink Strokes (ultra-fast GPU-accelerated Path2D chunks)
    for (let sIdx = 0; sIdx < strokes.length; sIdx++) {
      const stroke = strokes[sIdx];
      if (hiddenLayerIds.has(stroke.id)) continue;
      if (stroke.points.length < 2) continue;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.weight;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (!stroke.chunks && !stroke.activePath) {
        ensureStrokeChunks(stroke);
      }

      // Draw compiled chunks (native C++ / GPU path rasterization)
      if (stroke.chunks && stroke.chunks.length > 0) {
        for (let c = 0; c < stroke.chunks.length; c++) {
          ctx.stroke(stroke.chunks[c].path);
        }
      }

      // Draw active in-progress tail chunk
      if (stroke.activePath) {
        ctx.stroke(stroke.activePath);
      } else {
        const startIdx = stroke.lastChunkEndIdx ?? 0;
        if (startIdx < stroke.points.length - 1) {
          ctx.beginPath();
          ctx.moveTo(stroke.points[startIdx].x, stroke.points[startIdx].y);
          for (let i = startIdx + 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
        }
      }
    }

    // Compute live gear chain positions
    const chain: ResolvedLink[] = computeChain(circles);

    // 2. Draw Guides (Connecting Rods & Trajectory Circles)
    if (showGuides && chain.length > 0) {
      const guideWidth = 1.2 / totalZoom;
      const rodWidth = 1.5 / totalZoom;
      const dotRadius = 3 / totalZoom;

      for (const link of chain) {
        // Orbit circle
        ctx.strokeStyle = 'rgba(110, 95, 69, 0.4)';
        ctx.lineWidth = guideWidth;
        ctx.setLineDash([6 / totalZoom, 6 / totalZoom]);
        ctx.beginPath();
        ctx.arc(link.cx, link.cy, link.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Connecting rod
        ctx.strokeStyle = 'rgba(201, 162, 106, 0.5)';
        ctx.lineWidth = rodWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(link.cx, link.cy);
        ctx.lineTo(link.px, link.py);
        ctx.stroke();

        // Pivot joint center dot
        ctx.fillStyle = 'rgba(201, 162, 106, 0.7)';
        ctx.beginPath();
        ctx.arc(link.cx, link.cy, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw Points / Pen Heads / Bolts
    if (showPoints && chain.length > 0) {
      for (const link of chain) {
        if (link.isPen) {
          // Glowing Pen Nib
          const glowRadius = 13 / totalZoom;
          const coreRadius = 5.5 / totalZoom;

          // Outer glowing aura
          ctx.fillStyle = hexToRgba(link.color, 0.35);
          ctx.beginPath();
          ctx.arc(link.px, link.py, glowRadius, 0, Math.PI * 2);
          ctx.fill();

          // Inner solid nib
          ctx.fillStyle = link.color;
          ctx.beginPath();
          ctx.arc(link.px, link.py, coreRadius, 0, Math.PI * 2);
          ctx.fill();

          // Bright center highlight
          ctx.fillStyle = PaperWhite;
          ctx.beginPath();
          ctx.arc(link.px, link.py, coreRadius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Metallic Bolt Pivot
          const boltRadius = 5.5 / totalZoom;
          ctx.fillStyle = BoltGray;
          ctx.beginPath();
          ctx.arc(link.px, link.py, boltRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = BoltDark;
          ctx.lineWidth = 1.2 / totalZoom;
          ctx.beginPath();
          ctx.arc(link.px, link.py, boltRadius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = BoltDark;
          ctx.beginPath();
          ctx.arc(link.px, link.py, boltRadius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Trailing End-Pen Pulse Beacon
      const end = chain[chain.length - 1];
      if (end) {
        const pulseAlpha = 0.25 + ((Math.sin(performance.now() * 0.005) + 1) / 2) * 0.55;
        const pulseRadius = (13 + pulseAlpha * 8) / totalZoom;
        ctx.strokeStyle = `rgba(231, 227, 218, ${pulseAlpha * 0.5})`;
        ctx.lineWidth = 1.2 / totalZoom;
        ctx.beginPath();
        ctx.arc(end.px, end.py, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [circles, strokes, showGuides, showPoints, panX, panY, zoom, hiddenLayerIds]);

  // Animation frame rendering
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      renderCanvas();
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [renderCanvas]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    onPan(dx, dy);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pivotX = e.clientX - rect.left;
    const pivotY = e.clientY - rect.top;

    const zoomDelta = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    onZoom(zoomDelta, pivotX, pivotY, rect.width, rect.height);
  };

  // Touch handlers (pan and pinch-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStateRef.current.initialDistance = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - lastMousePosRef.current.x;
      const dy = e.touches[0].clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      onPan(dx, dy);
    } else if (e.touches.length === 2 && touchStateRef.current.initialDistance) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();

      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      const ratio = distance / touchStateRef.current.initialDistance;

      const pivotX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const pivotY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      touchStateRef.current.initialDistance = distance;
      onZoom(ratio, pivotX, pivotY, rect.width, rect.height);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchStateRef.current.initialDistance = undefined;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}
