import React, { useEffect, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { THEME } from '../constants/palette';
import { InkStroke } from '../types/spirograph';
import { renderStrokesToPngBlob } from '../utils/pngExport';

interface ExportImageDialogProps {
  strokes: InkStroke[];
  title: string | null;
  onDismiss: () => void;
}

export const ExportImageDialog: React.FC<ExportImageDialogProps> = ({
  strokes,
  title,
  onDismiss,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [pngBlob, setPngBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsGenerating(true);

    const timer = window.setTimeout(() => {
      renderStrokesToPngBlob(strokes, 2048, 2048).then(({ dataUrl, blob }) => {
        if (!cancelled) {
          setPreviewUrl(dataUrl);
          setPngBlob(blob);
          setIsGenerating(false);
        }
      });
    }, 30);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [strokes]);

  const safeFilename = (title || 'spirograph_studio_creation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `${safeFilename || 'spirograph_studio'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canShareFile = (() => {
    if (!pngBlob || typeof navigator === 'undefined' || !navigator.canShare) return false;
    try {
      const file = new File([pngBlob], `${safeFilename || 'spirograph_studio'}.png`, {
        type: 'image/png',
      });
      return navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  })();

  const handleShare = async () => {
    if (!pngBlob || !navigator.share) return;
    try {
      const file = new File([pngBlob], `${safeFilename || 'spirograph_studio'}.png`, {
        type: 'image/png',
      });
      await navigator.share({
        title: title || 'Spirograph Studio Creation',
        files: [file],
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-[20px] p-6 shadow-2xl"
        style={{
          backgroundColor: THEME.PanelBg,
          border: `1px solid ${THEME.PanelEdge}`,
        }}
      >
        <h3
          className="text-[15px] font-bold tracking-[0.05em]"
          style={{ color: THEME.BrassGold }}
        >
          EXPORT ARTWORK
        </h3>

        <p className="mt-1.5 font-mono text-[11px]" style={{ color: THEME.MutedGray }}>
          Ultra-high resolution 2048×2048 vector-smooth PNG rendering.
        </p>

        <div className="mt-3.5 flex justify-center">
          <div
            className="flex aspect-square w-[90%] items-center justify-center overflow-hidden rounded-[12px]"
            style={{
              backgroundColor: THEME.CanvasBg,
              border: `1px solid ${THEME.PanelEdge}`,
            }}
          >
            {isGenerating ? (
              <div
                className="h-8 w-8 animate-spin rounded-full border-[3px] border-t-transparent"
                style={{
                  borderColor: THEME.BrassGold,
                  borderTopColor: 'transparent',
                }}
              />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Artwork preview"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="font-mono text-[12px]" style={{ color: THEME.MutedGray }}>
                No artwork strokes to render
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg px-3 py-2 font-mono text-[11px] hover:bg-white/5 cursor-pointer"
            style={{ color: THEME.MutedGray }}
          >
            CLOSE
          </button>

          {canShareFile && (
            <button
              type="button"
              onClick={handleShare}
              disabled={!pngBlob}
              className="flex items-center gap-1.5 rounded-[8px] px-3 py-2 font-mono text-[11px] font-bold disabled:opacity-50 cursor-pointer"
              style={{
                border: `1px solid ${THEME.BrassGold}`,
                color: THEME.BrassGold,
              }}
            >
              <Share2 className="h-4 w-4" />
              <span>SHARE</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={!previewUrl}
            className="flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 font-mono text-[11px] font-bold disabled:opacity-50 cursor-pointer"
            style={{
              backgroundColor: THEME.BrassGold,
              color: THEME.CanvasBg,
            }}
          >
            <Download className="h-4 w-4" />
            <span>SAVE PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
