import { INK_PALETTE, parseHexColor, toHexString } from '../constants/palette';
import { GearCircle, GearMode, ResolvedLink } from '../types/spirograph';

export const STEP_MULTIPLIERS: number[] = [
  1 / 12,
  1 / 11,
  1 / 10,
  1 / 9,
  1 / 8,
  1 / 7,
  1 / 6,
  1 / 5,
  1 / 4,
  1 / 3,
  1 / 2,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
];

export const STEP_DISPLAY_LABELS: string[] = [
  '1/12', '1/11', '1/10', '1/9', '1/8', '1/7', '1/6', '1/5', '1/4', '1/3', '1/2',
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
];

export const DEFAULT_STEP_INDEX = 11;

export function createGearCircle(overrides: Partial<GearCircle> & { id: number }): GearCircle {
  return {
    mode: GearMode.GLOBAL,
    radius: 1000,
    radiusGlobal: 1000,
    radiusEngineMult: 0.5,
    radiusPrevMult: 0.5,
    radiusBase: null,
    radiusStepIndex: DEFAULT_STEP_INDEX,
    speedDeg: 50,
    speedGlobal: 50,
    speedEngineMult: 1.5,
    speedPrevMult: -1.5,
    speedBase: null,
    speedStepIndex: DEFAULT_STEP_INDEX,
    angle: -90,
    initialAngle: -90,
    isPen: true,
    color: INK_PALETTE[0],
    ...overrides,
  };
}

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
        case GearMode.GLOBAL:
          radius = c.radiusGlobal;
          speedDeg = c.speedGlobal;
          break;
        case GearMode.ENGINE:
          radius = c.radiusEngineMult * (resolved[0]?.radius ?? 140);
          speedDeg = c.speedEngineMult * (resolved[0]?.speedDeg ?? 50);
          break;
        case GearMode.PREVIOUS:
        default: {
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

export function formatDisplayNumber(value: number, maxDecimals: number = 2): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value - Math.trunc(value)) === 0) {
    return String(Math.trunc(value));
  }
  const formatted = value.toFixed(maxDecimals);
  return formatted.replace(/\.?0+$/, '');
}

export function sanitizeNumericInput(input: string, allowNegative: boolean): string | null {
  if (input === '') return '';
  const trimmed = input.trim();
  let hasDot = false;
  let sb = '';

  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (c === '-') {
      if (i === 0 && allowNegative) {
        sb += c;
      } else {
        return null;
      }
    } else if (c === '.') {
      if (!hasDot) {
        hasDot = true;
        sb += c;
      } else {
        return null;
      }
    } else if (c >= '0' && c <= '9') {
      sb += c;
    } else {
      return null;
    }
  }
  return sb;
}

export function exportLabeled(
  circles: GearCircle[],
  globalSpeedMult: number,
  inkWeight: number
): string {
  const lines: string[] = [];
  lines.push(`speed=${globalSpeedMult.toFixed(2)}, weight=${inkWeight.toFixed(2)}`);

  circles.forEach((c, i) => {
    const penStr = c.isPen ? `pen ${toHexString(c.color)}` : 'bolt';
    if (i === 0) {
      lines.push(`C1: engine  r=${c.radius.toFixed(2)}  s=${c.speedDeg.toFixed(2)}  ${penStr}`);
    } else {
      const modeLabel =
        c.mode === GearMode.PREVIOUS
          ? 'prev'
          : c.mode === GearMode.ENGINE
            ? 'engine'
            : 'global';

      const rStr =
        c.mode === GearMode.GLOBAL
          ? c.radiusGlobal.toFixed(2)
          : c.mode === GearMode.ENGINE
            ? `${c.radiusEngineMult.toFixed(2)}x`
            : `${c.radiusPrevMult.toFixed(2)}x`;

      const sStr =
        c.mode === GearMode.GLOBAL
          ? c.speedGlobal.toFixed(2)
          : c.mode === GearMode.ENGINE
            ? `${c.speedEngineMult.toFixed(2)}x`
            : `${c.speedPrevMult.toFixed(2)}x`;

      lines.push(`C${i + 1}: ${modeLabel}  r=${rStr}  s=${sStr}  ${penStr}`);
    }
  });

  return lines.join('\n');
}

export function exportFlatArray(
  circles: GearCircle[],
  globalSpeedMult: number,
  inkWeight: number
): string {
  const items: string[] = [];
  items.push(globalSpeedMult.toFixed(3));
  items.push(inkWeight.toFixed(3));
  items.push(String(circles.length));

  circles.forEach((c, i) => {
    const modeNum = i === 0 || c.mode === GearMode.GLOBAL ? 0 : c.mode === GearMode.ENGINE ? 1 : 2;
    let r: number;
    let s: number;
    if (i === 0) {
      r = c.radius;
      s = c.speedDeg;
    } else if (c.mode === GearMode.GLOBAL) {
      r = c.radiusGlobal;
      s = c.speedGlobal;
    } else if (c.mode === GearMode.ENGINE) {
      r = c.radiusEngineMult;
      s = c.speedEngineMult;
    } else {
      r = c.radiusPrevMult;
      s = c.speedPrevMult;
    }
    let colorIdx = INK_PALETTE.indexOf(toHexString(c.color));
    if (colorIdx < 0) colorIdx = 0;

    items.push(String(modeNum));
    items.push(r.toFixed(3));
    items.push(s.toFixed(3));
    items.push(c.isPen ? '1' : '0');
    items.push(String(colorIdx));
  });

  return `[${items.join(',')}]`;
}

export function exportEquation(circles: GearCircle[], globalSpeedMult: number): string {
  const chain = computeChain(circles);
  const g = globalSpeedMult;
  const lines: string[] = [];
  lines.push('// t in seconds, angles in degrees (multiply by π/180 for radians)');
  lines.push(`// global speed ×${g.toFixed(2)} is folded into omega below`);
  lines.push('// each pen is the partial sum of every circle up to it');
  lines.push('');

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
      lines.push(`Pen at Circle ${k + 1} (${toHexString(link.color)}):`);
      lines.push(`x(t) = ${xTerms.join(' + ')}`);
      lines.push(`y(t) = ${yTerms.join(' + ')}`);
      lines.push('');
    }
  });

  if (!anyPen) {
    lines.push("(no active pens — enable 'Pen' on at least one circle)");
  }

  return lines.join('\n').trimEnd();
}

export interface ParsedSetup {
  speedMult: number;
  weight: number;
  circles: GearCircle[];
}

function buildCircle(
  index: number,
  mode: GearMode,
  r: number,
  s: number,
  isPen: boolean,
  color: string
): GearCircle {
  const circleId = index + 1;
  if (index === 0) {
    return createGearCircle({
      id: circleId,
      mode: GearMode.GLOBAL,
      radius: r,
      radiusGlobal: r,
      speedDeg: s,
      speedGlobal: s,
      angle: -90,
      initialAngle: -90,
      isPen,
      color,
    });
  }
  return createGearCircle({
    id: circleId,
    mode,
    angle: -90,
    initialAngle: -90,
    isPen,
    color,
    radiusGlobal: mode === GearMode.GLOBAL ? r : 140,
    radiusEngineMult: mode === GearMode.ENGINE ? r : 0.5,
    radiusPrevMult: mode === GearMode.PREVIOUS ? r : 0.5,
    speedGlobal: mode === GearMode.GLOBAL ? s : 50,
    speedEngineMult: mode === GearMode.ENGINE ? s : 1.5,
    speedPrevMult: mode === GearMode.PREVIOUS ? s : -1.5,
  });
}

export function parseFlatArray(text: string): ParsedSetup {
  const clean = text.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  const tokens = clean.split(',').map((t) => t.trim());
  if (tokens.length < 3) throw new Error('Invalid array length');

  const parsedSpeed = Number.parseFloat(tokens[0]);
  const speedMult = Number.isFinite(parsedSpeed) ? parsedSpeed : 1.0;
  const parsedWeight = Number.parseFloat(tokens[1]);
  const weight = Number.isFinite(parsedWeight) ? parsedWeight : 2.0;
  const count = Number.parseInt(tokens[2], 10);
  if (!Number.isFinite(count) || count <= 0) throw new Error('Invalid circle count');

  let idx = 3;
  const circles: GearCircle[] = [];
  for (let i = 0; i < count; i++) {
    if (idx + 4 >= tokens.length) throw new Error('Incomplete circle parameters');
    const modeNum = Number.parseInt(tokens[idx++], 10) || 0;
    const rParsed = Number.parseFloat(tokens[idx++]);
    const r = Number.isFinite(rParsed) ? rParsed : 100;
    const sParsed = Number.parseFloat(tokens[idx++]);
    const s = Number.isFinite(sParsed) ? sParsed : 50;
    const isPen = Number.parseInt(tokens[idx++], 10) === 1;
    const colorIdx = Number.parseInt(tokens[idx++], 10) || 0;
    const color = INK_PALETTE[((colorIdx % INK_PALETTE.length) + INK_PALETTE.length) % INK_PALETTE.length];

    const mode =
      modeNum === 1 ? GearMode.ENGINE : modeNum === 2 ? GearMode.PREVIOUS : GearMode.GLOBAL;

    circles.push(buildCircle(i, mode, r, s, isPen, color));
  }

  return { speedMult, weight, circles };
}

export function parseLabeled(text: string): ParsedSetup {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  let speedMult = 1.0;
  let weight = 2.0;

  const header = lines.find((l) => /speed/i.test(l));
  if (header) {
    const speedMatch = header.match(/speed\s*=\s*(-?[\d.]+)/i);
    const weightMatch = header.match(/weight\s*=\s*(-?[\d.]+)/i);
    if (speedMatch) {
      const v = Number.parseFloat(speedMatch[1]);
      if (Number.isFinite(v)) speedMult = v;
    }
    if (weightMatch) {
      const v = Number.parseFloat(weightMatch[1]);
      if (Number.isFinite(v)) weight = v;
    }
  }

  const circleLines = lines.filter((l) => /^C\d+\s*:/i.test(l));
  if (circleLines.length === 0) {
    throw new Error('No circle lines found (expected C1: ...)');
  }

  const circles = circleLines.map((line, i) => {
    let mode = GearMode.GLOBAL;
    if (i > 0) {
      if (/engine/i.test(line)) mode = GearMode.ENGINE;
      else if (/prev/i.test(line)) mode = GearMode.PREVIOUS;
      else mode = GearMode.GLOBAL;
    }

    const rMatch = line.match(/r=(-?[\d.]+)/i);
    const sMatch = line.match(/s=(-?[\d.]+)/i);
    const rParsed = rMatch ? Number.parseFloat(rMatch[1]) : NaN;
    const sParsed = sMatch ? Number.parseFloat(sMatch[1]) : NaN;
    const r = Number.isFinite(rParsed) ? rParsed : 100;
    const s = Number.isFinite(sParsed) ? sParsed : 50;
    const isPen = /pen/i.test(line);
    const hexMatch = line.match(/#([0-9A-Fa-f]{6})/);
    const color = hexMatch
      ? parseHexColor(hexMatch[0])
      : INK_PALETTE[i % INK_PALETTE.length];

    return buildCircle(i, mode, r, s, isPen, color);
  });

  return { speedMult, weight, circles };
}

export function parseSetupCode(text: string): ParsedSetup {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty code');
  const parsed = trimmed.startsWith('[') ? parseFlatArray(trimmed) : parseLabeled(trimmed);
  if (parsed.circles.length === 0) throw new Error('No valid circles found');
  return parsed;
}
