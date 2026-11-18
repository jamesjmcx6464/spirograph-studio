import { THEME } from '../constants/palette';
import { InkStroke } from '../types/spirograph';

export function renderStrokesToPngBlob(
  strokes: InkStroke[],
  width: number = 2048,
  height: number = 2048
): Promise<{ dataUrl: string; blob: Blob | null }> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve({ dataUrl: '', blob: null });
      return;
    }

    // Background color: #0A0D10
    ctx.fillStyle = THEME.CanvasBg;
    ctx.fillRect(0, 0, width, height);

    if (strokes.length === 0) {
      const dataUrl = canvas.toDataURL('image/png');
      canvas.toBlob((blob) => resolve({ dataUrl, blob }), 'image/png');
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let hasPoints = false;

    for (const s of strokes) {
      for (const p of s.points) {
        hasPoints = true;
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }

    if (!hasPoints) {
      const dataUrl = canvas.toDataURL('image/png');
      canvas.toBlob((blob) => resolve({ dataUrl, blob }), 'image/png');
      return;
    }

    const padding = 80;
    const strokeWidthSpan = Math.max(maxX - minX, 10);
    const strokeHeightSpan = Math.max(maxY - minY, 10);
    const scale = Math.min(
      (width - padding * 2) / strokeWidthSpan,
      (height - padding * 2) / strokeHeightSpan
    );

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-midX, -midY);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const s of strokes) {
      const pts = s.points;
      if (pts.length < 2) continue;

      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.weight;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);

      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const p0 = pts[i];
          const p1 = pts[i + 1];
          const qMidX = (p0.x + p1.x) / 2;
          const qMidY = (p0.y + p1.y) / 2;
          ctx.quadraticCurveTo(p0.x, p0.y, qMidX, qMidY);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
      }

      ctx.stroke();
    }

    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');
    canvas.toBlob((blob) => resolve({ dataUrl, blob }), 'image/png');
  });
}
