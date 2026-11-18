export const THEME = {
  CanvasBg: '#0A0D10',
  PanelBg: '#12161B',
  PanelBgElevated: '#161C22',
  PanelEdge: '#1F262E',
  PanelEdgeFocused: '#323D4A',
  EngineCardBg: '#241C14',

  BrassGold: '#C9A26A',
  BrassDim: '#6E5F45',
  BrassGlow: 'rgba(201, 162, 106, 0.2)',
  BoltGray: '#8B95A1',
  BoltDark: '#4B525B',

  InkAmber: '#E39B3E',
  TealAccent: '#5FD3C4',
  TealGlow: 'rgba(95, 211, 196, 0.2)',
  PaperWhite: '#E7E3DA',
  MutedGray: '#7B838C',
  DangerRed: '#E85C5C',
  SuccessGreen: '#5FD3C4',
  VioletAccent: '#8E7CE8',
  TutorialBlue: '#64B5F6',
  GoldenAmber: '#FFB74D',
} as const;

export const INK_PALETTE: string[] = [
  '#E39B3E', // Amber / Ochre Ink
  '#5FD3C4', // Mint / Cyan
  '#C9A26A', // Brass Gold
  '#E7E3DA', // Parchment / Paper
  '#E85C5C', // Ruby Crimson
  '#8E7CE8', // Electric Violet
  '#4DD0E1', // Glacier Blue
  '#FF80AB', // Rose Quartz
];

export function toHexString(color: string): string {
  const clean = color.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(clean)) return clean;
  return INK_PALETTE[0];
}

export function parseHexColor(hex: string, defaultColor: string = INK_PALETTE[0]): string {
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return `#${clean.toUpperCase()}`;
  }
  return defaultColor;
}
