export interface TourActionContext {
  openGears: () => void;
  closeGears: () => void;
  openPenLayers: () => void;
  closePenLayers: () => void;
  openLoad: () => void;
  closeLoad: () => void;
  openPresets: () => void;
  closePresets: () => void;
  resumePlay: () => void;
  isPaused: () => boolean;
  showToast: (msg: string) => void;
}

export interface TourStep {
  id: string;
  targetSelector: string | null;
  title: string;
  text: string;
  onEnter?: (context: TourActionContext) => void;
  onLeave?: (context: TourActionContext) => void;
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
}

export const LESSONS: Lesson[] = [
  {
    id: 'overview',
    name: 'Overview',
    description: 'A quick tour of each button and what it does',
    steps: [
      {
        id: 'welcome',
        targetSelector: null,
        title: 'Welcome to Spirograph Studio',
        text: 'Welcome to Spirograph Studio! This quick overview shows what each button does. Press Next or Enter to move on.',
      },
      {
        id: 'canvas',
        targetSelector: '[data-tour="canvas"]',
        title: 'Canvas',
        text: 'This is your canvas. Your gears draw the pattern here.',
      },
      {
        id: 'zoom-center',
        targetSelector: '[data-tour="camera-dock"]',
        title: 'Zoom & Center Panel',
        text: 'These buttons zoom in and out and re-center your view.',
      },
      {
        id: 'pen-layers-btn',
        targetSelector: '[data-tour="pen-layers-btn"]',
        title: 'Pen Layers Button',
        text: 'This opens Pen Layers, where you manage your pen lines.',
      },
      {
        id: 'snapshot-btn',
        targetSelector: '[data-tour="snapshot-btn"]',
        title: 'Snapshot Button',
        text: 'This takes an instant high-resolution PNG snapshot of your drawing.',
      },
      {
        id: 'play-pause-btn',
        targetSelector: '[data-tour="play-pause-btn"]',
        title: 'Play & Pause Button',
        text: 'This starts and pauses the drawing animation.',
      },
      {
        id: 'bookmark-btn',
        targetSelector: '[data-tour="bookmark-btn"]',
        title: 'Bookmark Button',
        text: 'This saves your current design with a name.',
      },
      {
        id: 'gears-btn',
        targetSelector: '[data-tour="gears-btn"]',
        title: 'GEARS Button',
        text: 'This opens a menu where you can add and change gears.',
      },
      {
        id: 'load-btn',
        targetSelector: '[data-tour="load-btn"]',
        title: 'LOAD Button',
        text: 'This opens the gallery of presets and your saved designs, plus export options.',
      },
      {
        id: 'settings-btn',
        targetSelector: '[data-tour="settings-btn"]',
        title: 'SETTINGS Button',
        text: 'This lets you tune global speed, line weight, orbit guides, and clear the ink.',
      },
      {
        id: 'learn-btn',
        targetSelector: '[data-tour="learn-btn"]',
        title: 'LEARN Button',
        text: 'Open LEARN any time for more lessons in the Tutorial menu.',
      },
    ],
  },
  {
    id: 'gears',
    name: 'Gears',
    description: 'How to configure, size, color, add, and layer gears',
    steps: [
      {
        id: 'gear-card',
        targetSelector: '[data-tour="gear-card-1"]',
        title: 'Gear Cards',
        text: 'Each card in the list represents one gear in the chain, with its number and role.',
        onEnter: ctx => ctx.openGears(),
      },
      {
        id: 'gear-radius-speed',
        targetSelector: '[data-tour="gear-radius-speed-1"]',
        title: 'Radius & Speed Controls',
        text: "Adjust the gear's radius and speed using manual number boxes, multiplier buttons, or shortcut chips.",
        onEnter: ctx => ctx.openGears(),
      },
      {
        id: 'gear-bolt-pen',
        targetSelector: '[data-tour="gear-bolt-pen-1"]',
        title: 'BOLT vs PEN',
        text: 'Switch between BOLT (an invisible guide pivot) and PEN (draws ink on the canvas).',
        onEnter: ctx => ctx.openGears(),
      },
      {
        id: 'gear-colors',
        targetSelector: '[data-tour="gear-colors-1"]',
        title: 'Pen Color Swatches',
        text: 'Choose from 8 distinct ink colors for each pen gear.',
        onEnter: ctx => ctx.openGears(),
      },
      {
        id: 'add-gear',
        targetSelector: '[data-tour="add-gear-btn"]',
        title: 'ADD Button',
        text: 'ADD puts a new gear at the end of the chain to create more intricate patterns.',
        onEnter: ctx => ctx.openGears(),
      },
      {
        id: 'layer-gear',
        targetSelector: '[data-tour="layer-gear-btn"]',
        title: 'LAYER Button',
        text: 'LAYER copies the last gear to start a fresh pen line on top.',
        onEnter: ctx => ctx.openGears(),
      },
      {
        id: 'remove-gear',
        targetSelector: '[data-tour*="last-remove-gear-btn"], [data-tour*="last-gear-header"]',
        title: 'Remove Gear',
        text: 'Tap the remove icon on any added gear to delete it from the chain.',
        onEnter: ctx => ctx.openGears(),
      },
    ],
  },
  {
    id: 'pen-layers',
    name: 'Pen Layers',
    description: 'Manage active pen lines, hide or show layers, and clear individual ink',
    steps: [
      {
        id: 'pen-layers-header',
        targetSelector: '[data-tour="pen-layers-header-actions"]',
        title: 'Active Lines & Bulk Controls',
        text: 'The top counter shows active lines, and you can show or hide every line with one tap.',
        onEnter: ctx => ctx.openPenLayers(),
      },
      {
        id: 'pen-layers-guide',
        targetSelector: '[data-tour="pen-layers-guide-row"]',
        title: 'Guides & Add Pen',
        text: 'Gears marked Guide Only do not draw ink, but tapping Add Pen turns them into drawing pens.',
      },
      {
        id: 'pen-layers-toggle',
        targetSelector: '[data-tour="pen-layers-pen-toggle"]',
        title: 'Show or Hide Line',
        text: "Flip the switch on any pen row to turn that line on or off without losing your drawing.",
      },
      {
        id: 'pen-layers-clear',
        targetSelector: '[data-tour="pen-layers-clear-btn"]',
        title: 'Clear Pen Ink',
        text: "Tap the trash can on a pen row to clear only that gear's ink strokes.",
        onLeave: ctx => ctx.closePenLayers(),
      },
    ],
  },
  {
    id: 'moving',
    name: 'Moving Around',
    description: 'Camera controls, keyboard shortcuts, zooming, and panning',
    steps: [
      {
        id: 'moving-play-pause',
        targetSelector: '[data-tour="play-pause-btn"]',
        title: 'Play and Pause',
        text: 'Press Space or click the large gold button at any time to pause or resume drawing.',
      },
      {
        id: 'moving-zoom',
        targetSelector: '[data-tour="camera-dock"]',
        title: 'Zooming In and Out',
        text: 'Use the + and − buttons or press + and − on your keyboard to zoom in and out.',
      },
      {
        id: 'moving-center',
        targetSelector: '[data-tour="crosshair-btn"]',
        title: 'Center Camera',
        text: 'Click the crosshair or press 0 or Home on your keyboard to center your view at origin.',
      },
      {
        id: 'moving-pan',
        targetSelector: '[data-tour="canvas"]',
        title: 'Pan the Canvas',
        text: 'Click and drag anywhere on the canvas or pinch with two fingers to pan freely.',
      },
      {
        id: 'moving-keyboard-shortcuts',
        targetSelector: '[data-tour="learn-btn"]',
        title: 'Keyboard Shortcuts',
        text: 'Press Space to play or pause, + and − to zoom, 0 or Home to center, Enter for the next step and Esc to close the tutorial.',
      },
    ],
  },
  {
    id: 'save-load',
    name: 'Save, Load & Export',
    description: 'Saving designs, preset library, and exporting code or PNG snapshots',
    steps: [
      {
        id: 'save-bookmark',
        targetSelector: '[data-tour="bookmark-btn"]',
        title: 'Save Design',
        text: 'Tap the bookmark icon to name and save your current design directly in your browser.',
      },
      {
        id: 'load-presets',
        targetSelector: '[data-tour="load-presets-btn"]',
        title: 'Presets Gallery',
        text: 'LOAD opens the gallery with presets ready to explore.',
        onEnter: ctx => ctx.openLoad(),
        onLeave: ctx => ctx.closeLoad(),
      },
      {
        id: 'saved-gallery',
        targetSelector: '[data-tour="saved-designs-tab"]',
        title: 'Saved Designs Gallery',
        text: 'The gallery holds all your custom creations so you can reload them anytime.',
        onEnter: ctx => {
          ctx.closeLoad();
          ctx.openPresets();
        },
        onLeave: ctx => ctx.closePresets(),
      },
      {
        id: 'export-formats',
        targetSelector: '[data-tour="load-export-section"]',
        title: 'Export Formats',
        text: 'Export your design as labeled text, a compact array, or mathematical equations.',
        onEnter: ctx => {
          ctx.closePresets();
          ctx.openLoad();
        },
        onLeave: ctx => ctx.closeLoad(),
      },
      {
        id: 'export-snapshot',
        targetSelector: '[data-tour="snapshot-btn"]',
        title: 'PNG Image Snapshot',
        text: 'Tap the photo button at top right to download a high-resolution PNG image of your pattern.',
        onEnter: ctx => ctx.closeLoad(),
      },
    ],
  },
];
