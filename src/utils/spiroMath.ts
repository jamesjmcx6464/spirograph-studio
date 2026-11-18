import { GearCircle, InkStroke, PathChunk, ResolvedLink, StrokePoint } from '../types/spirograph';
import { InkPalette } from '../constants/theme';

export function computeChain(circles: GearCircle[]): ResolvedLink[] {
  const resolved: ResolvedLink[] = [];
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < circles.length; i++) {
    const c = circles[i];
    let radius: number;
    let speedDeg: number;

    if (i === 0) {
      radius = c.radius;
      speedDeg = c.speedDeg;
    } else {
      switch (c.mode) {
        case 'GLOBAL':
          radius = c.radiusGlobal;
          speedDeg = c.speedGlobal;
          break;
        case 'ENGINE': {
          const engine = resolved[0];
          radius = c.radiusEngineMult * (engine ? engine.radius : 140);
          speedDeg = c.speedEngineMult * (engine ? engine.speedDeg : 50);
          break;
        }
        case 'PREVIOUS': {
          const prev = resolved[i - 1];
          if (prev) {
            radius = c.radiusPrevMult * prev.radius;
            speedDeg = c.speedPrevMult * prev.speedDeg;
          } else {
            radius = c.radiusPrevMult * 140;
            speedDeg = c.speedPrevMult * 50;
          }
          break;
        }
      }
    }

    const rad = (c.angle * Math.PI) / 180;
    const px = cx + Math.cos(rad) * radius;
    const py = cy + Math.sin(rad) * radius;

    resolved.push({
      id: c.id,
      radius,
      speedDeg,
      cx,
      cy,
      px,
      py,
      isPen: c.isPen,
      color: c.color,
    });

    cx = px;
    cy = py;
  }

  return resolved;
}

export const CHUNK_SIZE = 1200;

/**
 * Ensures a stroke has pre-compiled Path2D chunks for ultra-fast GPU rendering.
 */
export function ensureStrokeChunks(stroke: InkStroke): void {
  if (stroke.chunks && (stroke.chunks.length > 0 || stroke.activePath)) {
    return;
  }
  if (!stroke.points || stroke.points.length === 0) return;

  stroke.chunks = [];
  let active = new Path2D();
  active.moveTo(stroke.points[0].x, stroke.points[0].y);

  let chunkStart = 0;
  for (let i = 1; i < stroke.points.length; i++) {
    active.lineTo(stroke.points[i].x, stroke.points[i].y);
    if (i - chunkStart >= CHUNK_SIZE) {
      stroke.chunks.push({
        path: active,
        startIdx: chunkStart,
        endIdx: i,
      });
      chunkStart = i;
      active = new Path2D();
      active.moveTo(stroke.points[i].x, stroke.points[i].y);
    }
  }

  stroke.lastChunkEndIdx = chunkStart;
  stroke.activePath = active;
}

/**
 * Appends a point to an active stroke, maintaining high-performance Path2D chunks.
 * Rejects sub-pixel redundant samples while guaranteeing sub-pixel curve fidelity.
 */
export function appendPointToStroke(stroke: InkStroke, x: number, y: number): boolean {
  if (stroke.points.length === 0) {
    stroke.points.push({ x, y });
    const p = new Path2D();
    p.moveTo(x, y);
    stroke.activePath = p;
    stroke.chunks = stroke.chunks || [];
    stroke.lastChunkEndIdx = 0;
    return true;
  }

  const last = stroke.points[stroke.points.length - 1];
  const dx = x - last.x;
  const dy = y - last.y;
  const distSq = dx * dx + dy * dy;

  // Minimum threshold: 0.85px (squared = 0.72)
  // Captures every smooth curve arc while avoiding duplicate stacked vertices
  if (distSq < 0.72) {
    return false;
  }

  stroke.points.push({ x, y });

  if (!stroke.activePath) {
    stroke.activePath = new Path2D();
    stroke.activePath.moveTo(last.x, last.y);
  }
  stroke.activePath.lineTo(x, y);

  const startIdx = stroke.lastChunkEndIdx ?? 0;
  const currentChunkLen = stroke.points.length - startIdx;
  if (currentChunkLen >= CHUNK_SIZE) {
    stroke.chunks = stroke.chunks || [];
    stroke.chunks.push({
      path: stroke.activePath,
      startIdx,
      endIdx: stroke.points.length - 1,
    });
    stroke.lastChunkEndIdx = stroke.points.length - 1;
    const nextPath = new Path2D();
    nextPath.moveTo(x, y);
    stroke.activePath = nextPath;
  }

  return true;
}

export interface VirtualSimResult {
  updatedCircles: GearCircle[];
  strokesChanged: boolean;
  totalNewPoints: number;
}

/**
 * Runs a fixed-step virtual simulation decoupled from display frame rate.
 * Even if the frame rate drops or stutters, the virtual clock advances with
 * guaranteed sub-degree angular steps and sub-pixel spatial resolution,
 * preventing any straight chord lines or polygonal artifacts.
 */
export function runVirtualSimulation(
  circles: GearCircle[],
  activeStrokes: Map<number, InkStroke>,
  strokesList: InkStroke[],
  realDt: number,
  accumulatorRef: { current: number },
  globalSpeedMult: number,
  inkWeight: number
): VirtualSimResult {
  if (realDt <= 0 || circles.length === 0) {
    return { updatedCircles: circles, strokesChanged: false, totalNewPoints: 0 };
  }

  // 1. Clamp realDt to prevent massive delta bursts (e.g. from tab blur or system freeze)
  const clampedDt = Math.min(realDt, 0.20);
  accumulatorRef.current += clampedDt;

  // 2. Compute gear chain dynamics (radii, speeds)
  const chain = computeChain(circles);
  let maxAngularSpeed = 10;
  for (let i = 0; i < chain.length; i++) {
    const spd = Math.abs(chain[i].speedDeg) * globalSpeedMult;
    if (spd > maxAngularSpeed) maxAngularSpeed = spd;
  }

  // Calculate maximum tip speed of any pen in pixels per second
  let maxPenLinearSpeed = 20;
  for (let i = 0; i < chain.length; i++) {
    if (chain[i].isPen) {
      let speedSum = 0;
      for (let j = 0; j <= i; j++) {
        speedSum += chain[j].radius * (Math.abs(chain[j].speedDeg) * (Math.PI / 180)) * globalSpeedMult;
      }
      if (speedSum > maxPenLinearSpeed) maxPenLinearSpeed = speedSum;
    }
  }

  // 3. Virtual fixed step size (fine resolution):
  // Target: at most 0.18 degrees per step (smooth curvature)
  // Target: at most 0.85 pixels per step (smooth continuous ink line)
  const dtAngle = 0.18 / Math.max(maxAngularSpeed, 1);
  const dtLinear = 0.85 / Math.max(maxPenLinearSpeed, 1);
  const simDt = Math.max(0.0002, Math.min(0.002, Math.min(dtAngle, dtLinear)));

  // Pre-calculate per-circle parameters for fast inner simulation loop
  const circleSpeeds = chain.map(c => c.speedDeg * globalSpeedMult);
  const circleRadii = chain.map(c => c.radius);
  const isPenArray = chain.map(c => c.isPen);
  const circleColors = chain.map(c => c.color);
  const circleIds = chain.map(c => c.id);

  let strokesChanged = false;
  let totalNewPoints = 0;
  let stepsCount = 0;
  const MAX_STEPS = 350; // Safety cap to avoid freezing main thread under catastrophic lag

  while (accumulatorRef.current >= simDt && stepsCount < MAX_STEPS) {
    accumulatorRef.current -= simDt;
    stepsCount++;

    // Advance circle angles by simDt
    for (let i = 0; i < circles.length; i++) {
      circles[i].angle = (circles[i].angle + circleSpeeds[i] * simDt) % 360;
    }

    // Compute continuous pen tip positions at this virtual time
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < circles.length; i++) {
      const rad = (circles[i].angle * Math.PI) / 180;
      const px = cx + Math.cos(rad) * circleRadii[i];
      const py = cy + Math.sin(rad) * circleRadii[i];

      if (isPenArray[i]) {
        const id = circleIds[i];
        const color = circleColors[i];

        let stroke = activeStrokes.get(id);
        if (
          !stroke ||
          stroke.color !== color ||
          stroke.weight !== inkWeight ||
          stroke.points.length >= 60000
        ) {
          const newStroke: InkStroke = {
            id,
            color,
            weight: inkWeight,
            points: [{ x: px, y: py }],
            chunks: [],
            activePath: new Path2D(),
            lastChunkEndIdx: 0,
          };
          newStroke.activePath!.moveTo(px, py);
          activeStrokes.set(id, newStroke);
          strokesList.push(newStroke);
          strokesChanged = true;
          totalNewPoints++;
        } else {
          const added = appendPointToStroke(stroke, px, py);
          if (added) {
            strokesChanged = true;
            totalNewPoints++;
          }
        }
      }

      cx = px;
      cy = py;
    }
  }

  // Prevent accumulator backlog runaway if browser hung
  if (stepsCount >= MAX_STEPS) {
    accumulatorRef.current = Math.min(accumulatorRef.current, simDt * 2);
  }

  return {
    updatedCircles: circles,
    strokesChanged,
    totalNewPoints,
  };
}

export interface SimulationStepResult {
  updatedCircles: GearCircle[];
  newStrokesAdded: InkStroke[];
}

export function runSimulationTick(
  circles: GearCircle[],
  activeStrokes: Map<number, InkStroke>,
  strokesList: InkStroke[],
  dt: number,
  globalSpeedMult: number,
  inkWeight: number
): { updatedCircles: GearCircle[]; strokesChanged: boolean } {
  const acc = { current: 0 };
  const res = runVirtualSimulation(
    circles,
    activeStrokes,
    strokesList,
    dt,
    acc,
    globalSpeedMult,
    inkWeight
  );
  return { updatedCircles: res.updatedCircles, strokesChanged: res.strokesChanged };
}

// Export / Import Helpers

export function exportLabeled(circles: GearCircle[], globalSpeed: number, inkWeight: number): string {
  const lines: string[] = [];
  lines.push(`speed=${globalSpeed.toFixed(2)}, weight=${inkWeight.toFixed(2)}`);

  circles.forEach((c, i) => {
    if (i === 0) {
      const penStr = c.isPen ? `pen ${c.color}` : 'bolt';
      lines.push(`C1: engine  r=${c.radius.toFixed(2)}  s=${c.speedDeg.toFixed(2)}  ${penStr}`);
    } else {
      const modeLabel = c.mode === 'PREVIOUS' ? 'prev' : c.mode === 'ENGINE' ? 'engine' : 'global';
      let rStr: string;
      let sStr: string;
      switch (c.mode) {
        case 'GLOBAL':
          rStr = c.radiusGlobal.toFixed(2);
          sStr = c.speedGlobal.toFixed(2);
          break;
        case 'ENGINE':
          rStr = `${c.radiusEngineMult.toFixed(2)}x`;
          sStr = `${c.speedEngineMult.toFixed(2)}x`;
          break;
        case 'PREVIOUS':
        default:
          rStr = `${c.radiusPrevMult.toFixed(2)}x`;
          sStr = `${c.speedPrevMult.toFixed(2)}x`;
          break;
      }
      const penStr = c.isPen ? `pen ${c.color}` : 'bolt';
      lines.push(`C${i + 1}: ${modeLabel}  r=${rStr}  s=${sStr}  ${penStr}`);
    }
  });

  return lines.join('\n');
}

export function exportFlatArray(circles: GearCircle[], globalSpeed: number, inkWeight: number): string {
  const items: string[] = [];
  items.push(globalSpeed.toFixed(3));
  items.push(inkWeight.toFixed(3));
  items.push(`${circles.length}`);

  circles.forEach((c, i) => {
    const modeNum = i === 0 || c.mode === 'GLOBAL' ? 0 : c.mode === 'ENGINE' ? 1 : 2;
    let r: number;
    let s: number;
    if (i === 0) {
      r = c.radius;
      s = c.speedDeg;
    } else {
      switch (c.mode) {
        case 'GLOBAL':
          r = c.radiusGlobal;
          s = c.speedGlobal;
          break;
        case 'ENGINE':
          r = c.radiusEngineMult;
          s = c.speedEngineMult;
          break;
        case 'PREVIOUS':
        default:
          r = c.radiusPrevMult;
          s = c.speedPrevMult;
          break;
      }
    }

    let colorIdx = InkPalette.indexOf(c.color);
    if (colorIdx < 0) colorIdx = 0;

    items.push(`${modeNum}`);
    items.push(r.toFixed(3));
    items.push(s.toFixed(3));
    items.push(c.isPen ? '1' : '0');
    items.push(`${colorIdx}`);
  });

  return `[${items.join(',')}]`;
}

export function exportEquation(circles: GearCircle[], globalSpeed: number): string {
  const chain = computeChain(circles);
  const g = globalSpeed;
  const lines: string[] = [];
  lines.push('// t in seconds, angles in degrees (multiply by π/180 for radians)');
  lines.push(`// global speed ×${g.toFixed(2)} is folded into omega below`);
  lines.push('// each pen is the partial sum of every circle up to it\n');

  let anyPen = false;
  chain.forEach((link, k) => {
    if (link.isPen) {
      anyPen = true;
      const xTerms: string[] = [];
      const yTerms: string[] = [];
      for (let i = 0; i <= k; i++) {
        const r = chain[i].radius.toFixed(2);
        const w = (chain[i].speedDeg * g).toFixed(2);
        xTerms.push(`${r}·sin(${w}t)`);
        yTerms.push(`${r}·cos(${w}t)`);
      }
      lines.push(`Pen at Circle ${k + 1} (${link.color}):`);
      lines.push(`x(t) = ${xTerms.join(' + ')}`);
      lines.push(`y(t) = ${yTerms.join(' + ')}\n`);
    }
  });

  if (!anyPen) {
    lines.push('(no active pens — enable Pen on at least one gear)');
  }

  return lines.join('\n');
}

export function parseSetupCode(text: string): {
  speedMult: number;
  weight: number;
  circles: GearCircle[];
} {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Input is empty');

  if (trimmed.startsWith('[')) {
    return parseFlatArray(trimmed);
  } else {
    return parseLabeled(trimmed);
  }
}

function parseFlatArray(text: string) {
  const clean = text.replace(/^\[/, '').replace(/\]$/, '').trim();
  const tokens = clean.split(',').map(s => s.trim());
  if (tokens.length < 3) throw new Error('Invalid array format: too few tokens');

  const speedMult = parseFloat(tokens[0]) || 1.0;
  const weight = parseFloat(tokens[1]) || 2.0;
  const count = parseInt(tokens[2], 10);
  if (isNaN(count) || count <= 0) throw new Error('Invalid circle count');

  let idx = 3;
  const circles: GearCircle[] = [];

  for (let i = 0; i < count; i++) {
    if (idx + 4 >= tokens.length) throw new Error('Incomplete circle parameters in array');
    const modeNum = parseInt(tokens[idx++], 10) || 0;
    const r = parseFloat(tokens[idx++]) || 100;
    const s = parseFloat(tokens[idx++]) || 50;
    const isPen = parseInt(tokens[idx++], 10) === 1;
    const colorIdx = parseInt(tokens[idx++], 10) || 0;
    const color = InkPalette[colorIdx % InkPalette.length] || InkPalette[0];

    const mode = modeNum === 1 ? 'ENGINE' : modeNum === 2 ? 'PREVIOUS' : 'GLOBAL';
    circles.push(buildCircle(i, mode, r, s, isPen, color));
  }

  return { speedMult, weight, circles };
}

function parseLabeled(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let speedMult = 1.0;
  let weight = 2.0;

  const header = lines.find(l => l.toLowerCase().includes('speed'));
  if (header) {
    const sMatch = /speed\s*=\s*(-?[\d.]+)/i.exec(header);
    const wMatch = /weight\s*=\s*(-?[\d.]+)/i.exec(header);
    if (sMatch) speedMult = parseFloat(sMatch[1]) || 1.0;
    if (wMatch) weight = parseFloat(wMatch[1]) || 2.0;
  }

  const circleLines = lines.filter(l => /^C\d+\s*:/i.test(l));
  if (circleLines.length === 0) throw new Error('No gear lines found (expected C1: ...)');

  const circles = circleLines.map((line, i) => {
    let mode: GearCircle['mode'] = 'GLOBAL';
    if (i > 0) {
      if (/engine/i.test(line)) mode = 'ENGINE';
      else if (/prev/i.test(line)) mode = 'PREVIOUS';
    }

    const rMatch = /r=(-?[\d.]+)/i.exec(line);
    const sMatch = /s=(-?[\d.]+)/i.exec(line);
    const r = rMatch ? parseFloat(rMatch[1]) : 100;
    const s = sMatch ? parseFloat(sMatch[1]) : 50;
    const isPen = /pen/i.test(line);

    const hexMatch = /#([0-9A-Fa-f]{6})/i.exec(line);
    const color = hexMatch ? hexMatch[0].toUpperCase() : InkPalette[i % InkPalette.length];

    return buildCircle(i, mode, r, s, isPen, color);
  });

  return { speedMult, weight, circles };
}

function buildCircle(
  index: number,
  mode: GearCircle['mode'],
  r: number,
  s: number,
  isPen: boolean,
  color: string
): GearCircle {
  const id = index + 1;
  if (index === 0) {
    return {
      id,
      mode: 'GLOBAL',
      radius: r,
      radiusGlobal: r,
      radiusEngineMult: 1.0,
      radiusPrevMult: 1.0,
      speedDeg: s,
      speedGlobal: s,
      speedEngineMult: 1.0,
      speedPrevMult: 1.0,
      angle: -90,
      initialAngle: -90,
      isPen,
      color,
    };
  } else {
    return {
      id,
      mode,
      radius: 100,
      radiusGlobal: mode === 'GLOBAL' ? r : 140,
      radiusEngineMult: mode === 'ENGINE' ? r : 0.5,
      radiusPrevMult: mode === 'PREVIOUS' ? r : 0.5,
      speedDeg: 50,
      speedGlobal: mode === 'GLOBAL' ? s : 50,
      speedEngineMult: mode === 'ENGINE' ? s : 1.5,
      speedPrevMult: mode === 'PREVIOUS' ? s : -1.5,
      angle: -90,
      initialAngle: -90,
      isPen,
      color,
    };
  }
}
