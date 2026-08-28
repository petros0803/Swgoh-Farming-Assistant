import { useCallback, useState } from 'react';

export const PREVIEW_WIDTH = 380;
export const PREVIEW_GUTTER = 12;
/** Roughly a full card, used to decide whether it fits below the anchor. */
const PREVIEW_HEIGHT = 320;

/**
 * Anchors a farming card to whatever the pointer is on. Coordinates come from
 * the anchor's own rect rather than CSS offsets, so the card is never clipped by
 * an ancestor's overflow nor shifted by its hover transform.
 */
export function useFarmPreview() {
  const [preview, setPreview] = useState(null);

  const show = useCallback((unit, element, note) => {
    if (!unit) return;

    const rect = element.getBoundingClientRect();
    const flip = window.innerHeight - rect.bottom < PREVIEW_HEIGHT;
    setPreview({
      unit,
      note,
      left: Math.min(
        Math.max(PREVIEW_GUTTER, rect.left),
        window.innerWidth - PREVIEW_WIDTH - PREVIEW_GUTTER
      ),
      top: flip ? rect.top - PREVIEW_GUTTER : rect.bottom + PREVIEW_GUTTER,
      flip
    });
  }, []);

  const hide = useCallback(() => setPreview(null), []);

  return { preview, show, hide };
}
