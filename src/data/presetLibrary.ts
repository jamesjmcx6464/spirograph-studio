import { INK_PALETTE } from '../constants/palette';
import { CuratedPreset, GearMode } from '../types/spirograph';
import { createGearCircle } from '../utils/gearMath';

export const PRESET_LIBRARY: CuratedPreset[] = [
  {
    id: 'character_avatar',
    title: 'Character Silhouette',
    subtitle: 'Harmonic Figure with Looped Limbs',
    category: 'Featured',
    description:
      'A 4-tier coupled epicyclic system that traces an anthropomorphic figure with curved arms, torso, and looping legs.',
    formulaSummary: 'R1: 20px (50°/s) → R2: ×4.9 (-0.2x) → R3: ×0.7 (-1.5x) → R4: ×0.3 (7.0x)',
    speedMult: 1.0,
    weight: 2.0,
    circles: [
      createGearCircle({ id: 1, radius: 20, radiusGlobal: 20, speedDeg: 50, isPen: false, color: INK_PALETTE[0] }),
      createGearCircle({ id: 2, mode: GearMode.PREVIOUS, radiusPrevMult: 4.9, speedPrevMult: -0.2, isPen: false, color: INK_PALETTE[0] }),
      createGearCircle({ id: 3, mode: GearMode.PREVIOUS, radiusPrevMult: 0.7, speedPrevMult: -1.5, isPen: false, color: INK_PALETTE[0] }),
      createGearCircle({ id: 4, mode: GearMode.PREVIOUS, radiusPrevMult: 0.3, speedPrevMult: 7.0, isPen: true, color: INK_PALETTE[0] }),
    ],
  },
  {
    id: 'spiro_flower',
    title: 'Classic Spirograph',
    subtitle: '3-Gear Harmonic Flower',
    category: 'Spirographs',
    description:
      'A balanced trio of counter-rotating arms producing a delicate multi-lobed floral hypocycloid.',
    formulaSummary: 'R1: 1000px (50°/s) → R2: 500px (-150°/s) → R3: 250px (-100°/s)',
    speedMult: 1.0,
    weight: 7.0,
    circles: [
      createGearCircle({ id: 1, radius: 1000, radiusGlobal: 1000, speedDeg: 50, isPen: false, color: INK_PALETTE[0] }),
      createGearCircle({ id: 2, mode: GearMode.PREVIOUS, radiusPrevMult: 0.5, speedPrevMult: -3.0, isPen: false, color: INK_PALETTE[1] }),
      createGearCircle({ id: 3, mode: GearMode.PREVIOUS, radiusPrevMult: 0.5, speedPrevMult: -2.0, isPen: true, color: INK_PALETTE[0] }),
    ],
  },
  {
    id: 'golden_bloom',
    title: 'Golden Ratio Bloom',
    subtitle: 'Phi Harmonic Epicycles',
    category: 'Harmonics',
    description:
      'Epicycles scaled by the golden ratio (~1.618) generating an organic phyllotaxis mandala bloom.',
    formulaSummary: 'R1: 1000px (50°/s) → R2: 618px (80.9°/s) → R3: 382px (-80.9°/s) → R4: 236px (80.9°/s)',
    speedMult: 1.0,
    weight: 7.0,
    circles: [
      createGearCircle({ id: 1, radius: 1000, radiusGlobal: 1000, speedDeg: 50, isPen: false, color: INK_PALETTE[2] }),
      createGearCircle({ id: 2, mode: GearMode.PREVIOUS, radiusPrevMult: 0.618, speedPrevMult: 1.618, isPen: false, color: INK_PALETTE[1] }),
      createGearCircle({ id: 3, mode: GearMode.PREVIOUS, radiusPrevMult: 0.618, speedPrevMult: -1.618, isPen: true, color: INK_PALETTE[1] }),
      createGearCircle({ id: 4, mode: GearMode.PREVIOUS, radiusPrevMult: 0.618, speedPrevMult: -1.618, isPen: true, color: INK_PALETTE[0] }),
    ],
  },
  {
    id: 'fourier_square',
    title: 'Fourier Epicycle Wave',
    subtitle: 'Odd Harmonic Series (1f, 3f, 5f)',
    category: 'Fourier',
    description:
      'Simulating Fourier series epicycles where radii drop by 1/(2n-1) and angular velocities follow odd integer multiples.',
    formulaSummary: 'Σ (1/k) · sin(k·ωt), k ∈ {1, 3, 5, 7}',
    speedMult: 1.0,
    weight: 7.0,
    circles: [
      createGearCircle({ id: 1, radius: 1000, radiusGlobal: 1000, speedDeg: 50, isPen: false, color: INK_PALETTE[2] }),
      createGearCircle({ id: 2, mode: GearMode.ENGINE, radiusEngineMult: 0.333, speedEngineMult: 3.0, isPen: false, color: INK_PALETTE[1] }),
      createGearCircle({ id: 3, mode: GearMode.ENGINE, radiusEngineMult: 0.2, speedEngineMult: 5.0, isPen: false, color: INK_PALETTE[5] }),
      createGearCircle({ id: 4, mode: GearMode.ENGINE, radiusEngineMult: 0.143, speedEngineMult: 7.0, isPen: true, color: INK_PALETTE[0] }),
    ],
  },
  {
    id: 'hypotrochoid_star',
    title: 'Pentagram Nebula',
    subtitle: '5-Cusp Hypocycloid Star',
    category: 'Spirographs',
    description:
      'Fast outer planetary gear orbiting an engine ring creating sharp 5-pointed celestial geometry.',
    formulaSummary: 'R1: 1000px (50°/s) → R2: 400px (-250°/s) → R3: 200px (500°/s)',
    speedMult: 1.0,
    weight: 7.0,
    circles: [
      createGearCircle({ id: 1, radius: 1000, radiusGlobal: 1000, speedDeg: 50, isPen: false, color: INK_PALETTE[2] }),
      createGearCircle({ id: 2, mode: GearMode.GLOBAL, radiusGlobal: 400, speedGlobal: -250, isPen: false, color: INK_PALETTE[4] }),
      createGearCircle({ id: 3, mode: GearMode.GLOBAL, radiusGlobal: 200, speedGlobal: 500, isPen: true, color: INK_PALETTE[1] }),
    ],
  },
  {
    id: 'trefoil_knot',
    title: 'Trefoil Epicyclic Knot',
    subtitle: 'Topological 3-Fold Loop',
    category: 'Harmonics',
    description:
      'Two resonant frequencies producing a self-weaving 3D-projected trefoil ribbon curve.',
    formulaSummary: 'R1: 1000px (50°/s) → R2: 600px (-75°/s) → R3: 396px (150°/s)',
    speedMult: 1.0,
    weight: 8.0,
    circles: [
      createGearCircle({ id: 1, radius: 1000, radiusGlobal: 1000, speedDeg: 50, isPen: true, color: INK_PALETTE[5] }),
      createGearCircle({ id: 2, mode: GearMode.PREVIOUS, radiusPrevMult: 0.6, speedPrevMult: -1.5, isPen: false, color: INK_PALETTE[1] }),
      createGearCircle({ id: 3, mode: GearMode.PREVIOUS, radiusPrevMult: 0.66, speedPrevMult: -2.0, isPen: true, color: INK_PALETTE[0] }),
    ],
  },
  {
    id: 'rose_rhodonea',
    title: 'Rhodonea Rose Curve',
    subtitle: '8-Petal Polar Geometry',
    category: 'Curves',
    description:
      'Classic mathematical rose curve (r = a · cos(kθ)) synthesized by coupled rotating arms.',
    formulaSummary: 'R1: 900px (50°/s) → R2: 900px (-50°/s) → R3: 300px (250°/s)',
    speedMult: 1.0,
    weight: 7.0,
    circles: [
      createGearCircle({ id: 1, radius: 900, radiusGlobal: 900, speedDeg: 50, isPen: false, color: INK_PALETTE[2] }),
      createGearCircle({ id: 2, mode: GearMode.GLOBAL, radiusGlobal: 900, speedGlobal: -50, isPen: false, color: INK_PALETTE[4] }),
      createGearCircle({ id: 3, mode: GearMode.GLOBAL, radiusGlobal: 300, speedGlobal: 250, isPen: true, color: INK_PALETTE[4] }),
    ],
  },
  {
    id: 'double_pendulum',
    title: 'Coupled Chaos Lace',
    subtitle: '4-Tiered Fine Mesh',
    category: 'Harmonics',
    description:
      'Four nested gears with irrational speed ratios generating non-repeating dense lace textures.',
    formulaSummary: 'R1: 800px (50°/s) → R2: 500px (-135°/s) → R3: 320px (290°/s) → R4: 180px (-590°/s)',
    speedMult: 1.0,
    weight: 6.0,
    circles: [
      createGearCircle({ id: 1, radius: 800, radiusGlobal: 800, speedDeg: 50, isPen: false, color: INK_PALETTE[2] }),
      createGearCircle({ id: 2, mode: GearMode.GLOBAL, radiusGlobal: 500, speedGlobal: -135, isPen: false, color: INK_PALETTE[1] }),
      createGearCircle({ id: 3, mode: GearMode.GLOBAL, radiusGlobal: 320, speedGlobal: 290, isPen: true, color: INK_PALETTE[1] }),
      createGearCircle({ id: 4, mode: GearMode.GLOBAL, radiusGlobal: 180, speedGlobal: -590, isPen: true, color: INK_PALETTE[0] }),
    ],
  },
  {
    id: 'cardioid_dual',
    title: 'Dual Pen Cardioid',
    subtitle: 'Synchronized Twin Orbits',
    category: 'Curves',
    description:
      'Two active pens drawing intertwined cardioid orbits simultaneously in distinct ink colors.',
    formulaSummary: 'R1: 1000px (50°/s) [Pen 1] → R2: 500px (100°/s) [Pen 2]',
    speedMult: 1.0,
    weight: 7.0,
    circles: [
      createGearCircle({ id: 1, radius: 1000, radiusGlobal: 1000, speedDeg: 50, isPen: true, color: INK_PALETTE[2] }),
      createGearCircle({ id: 2, mode: GearMode.PREVIOUS, radiusPrevMult: 0.5, speedPrevMult: 2.0, isPen: true, color: INK_PALETTE[0] }),
    ],
  },
];
