import { THEME } from '../constants/palette';
import { TutorialCategory } from '../types/spirograph';

export const TUTORIAL_CATEGORIES: TutorialCategory[] = [
  {
    id: 'basics',
    title: 'Basics',
    subtitle: 'Core mechanics, base engines & gear harmonics',
    iconName: 'school',
    accentColor: THEME.BrassGold,
    lessons: [
      {
        id: 'basics_1',
        number: '01',
        title: 'The Base Engine & Global Speed',
        summary: 'Master Circle 0 as the central pivot of all planetary motion.',
        placeholderContent:
          'Lesson 1 details placeholder.\n\nLearn how the root engine radius defines the primary orbiting arm, and how adjusting Global Speed accelerates mathematical curve tracing in real-time.',
      },
      {
        id: 'basics_2',
        number: '02',
        title: 'Adding Child Gears & Harmonic Linkages',
        summary: 'Chain secondary and tertiary arms to generate compound geometric curves.',
        placeholderContent:
          'Lesson 2 details placeholder.\n\nUnderstand how each attached circle inherits the origin tip of its parent gear to construct intricate epitrochoid and hypotrochoid trajectories.',
      },
      {
        id: 'basics_3',
        number: '03',
        title: 'Relative vs. Global Mode Coordinate Systems',
        summary: 'Compare global angular rotation against relative gear ratios.',
        placeholderContent:
          'Lesson 3 details placeholder.\n\nDiscover how Relative Engine and Relative Previous multiplier modes automatically scale harmonic frequencies when modifying upstream gear parameters.',
      },
      {
        id: 'basics_4',
        number: '04',
        title: 'Pen Placement, Nib Inking & Color Palettes',
        summary: 'Enable pen tracing on specific joints and choose custom ink colors.',
        placeholderContent:
          'Lesson 4 details placeholder.\n\nConfigure active pens across one or multiple gears simultaneously to generate multi-colored interlocking geometric art.',
      },
    ],
  },
  {
    id: 'complex_machines',
    title: 'Complex Machines',
    subtitle: 'Multi-arm assemblies, counter-rotations & symmetry nodes',
    iconName: 'settings',
    accentColor: THEME.TealAccent,
    lessons: [
      {
        id: 'complex_1',
        number: '01',
        title: 'Multi-Arm Planetary Configurations',
        summary: 'Construct 4-gear and 5-gear harmonic linkages with balanced radius ratios.',
        placeholderContent:
          'Lesson 1 details placeholder.\n\nExplore high-order linkage configurations where decaying radius lengths produce delicate fractal lace patterns and star rosettes.',
      },
      {
        id: 'complex_2',
        number: '02',
        title: 'Counter-Rotational Symmetries & Node Cusp Formations',
        summary: 'Harness negative gear speeds to create sharp star points and loops.',
        placeholderContent:
          'Lesson 2 details placeholder.\n\nLearn the mathematical relationship between positive and negative rotational frequencies in determining the exact number of cusps (petals) in a rosette.',
      },
      {
        id: 'complex_3',
        number: '03',
        title: 'Multi-Pen Layering & Switchboard Control',
        summary: 'Isolate and manage individual gear inks with the Layers switchboard.',
        placeholderContent:
          'Lesson 3 details placeholder.\n\nMaster the top-right Layers dashboard to independently toggle visibility, clear specific stroke paths, and compose multi-layer blueprints.',
      },
      {
        id: 'complex_4',
        number: '04',
        title: 'Resonant Speed Ratios & Closed Curve Loops',
        summary: 'Calculate rational fraction ratios that produce clean closed-loop curves.',
        placeholderContent:
          'Lesson 4 details placeholder.\n\nUnderstand greatest common divisors (GCD) and integer speed ratios that allow drawings to loop perfectly back into their starting position.',
      },
    ],
  },
  {
    id: 'golden_ratio',
    title: 'The Golden Ratio',
    subtitle: 'Divine proportions, Fibonacci sequences & irrational spirals',
    iconName: 'autoAwesome',
    accentColor: THEME.GoldenAmber,
    lessons: [
      {
        id: 'golden_1',
        number: '01',
        title: 'The Divine Proportion (φ ≈ 1.618033...)',
        summary: 'Incorporate the golden ratio into arm radius steps and angular velocities.',
        placeholderContent:
          'Lesson 1 details placeholder.\n\nDiscover how setting radius ratios to 1.618 and 0.618 produces organic, nature-inspired spiraling geometries that mirror sunflowers and nautilus shells.',
      },
      {
        id: 'golden_2',
        number: '02',
        title: 'Fibonacci Harmonic Speed Ratios',
        summary: 'Employ Fibonacci integers (1, 2, 3, 5, 8, 13, 21...) for natural phyllotaxis.',
        placeholderContent:
          'Lesson 2 details placeholder.\n\nLearn how successive Fibonacci gear speed combinations generate balanced, non-overlapping petal distributions with maximum visual harmony.',
      },
      {
        id: 'golden_3',
        number: '03',
        title: 'Golden Spiral Leaf & Petal Packing',
        summary: 'Balance radial expansion against rotation to simulate biological growth.',
        placeholderContent:
          'Lesson 3 details placeholder.\n\nExplore the golden angle (137.5°) and how continuous micro-stepping creates dense, mesmerizing sacred geometry mandalas.',
      },
      {
        id: 'golden_4',
        number: '04',
        title: 'Irrational Stepping & Aperiodic Flow',
        summary: 'Generate quasi-periodic non-repeating curves that never trace the same path.',
        placeholderContent:
          'Lesson 4 details placeholder.\n\nExperiment with irrational speed multipliers to produce infinite non-repeating spirographic tapestries.',
      },
    ],
  },
];
