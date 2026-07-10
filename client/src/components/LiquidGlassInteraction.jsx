import { useEffect } from 'react';

const TARGET_SELECTOR = [
  '.glass-panel',
  '.btn-primary',
  '.btn-secondary',
  '.theme-card',
].join(',');

const resetTarget = (target) => {
  if (!target) return;
  target.style.removeProperty('--liquid-local-x');
  target.style.removeProperty('--liquid-local-y');
};

const shouldTrackLiquidGlass = () => {
  if (document.documentElement.dataset.theme !== 'liquid-glass') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return window.matchMedia('(pointer: fine)').matches;
};

const LiquidGlassInteraction = () => {
  useEffect(() => {
    let frame = 0;
    let latestEvent = null;
    let lastTarget = null;
    let lastRect = null;
    let lastRectAt = 0;
    let lastRunAt = 0;
    let lastLocalX = null;
    let lastLocalY = null;

    const handlePointerMove = (event) => {
      latestEvent = event;
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const currentEvent = latestEvent;
        if (!currentEvent) return;

        const now = performance.now();
        if (now - lastRunAt < 40) return;
        lastRunAt = now;

        if (!shouldTrackLiquidGlass()) {
          resetTarget(lastTarget);
          lastTarget = null;
          lastRect = null;
          return;
        }

        const target = currentEvent.target instanceof Element ? currentEvent.target.closest(TARGET_SELECTOR) : null;
        if (target !== lastTarget) {
          resetTarget(lastTarget);
          lastTarget = target;
          lastRect = null;
          lastLocalX = null;
          lastLocalY = null;
        }

        if (!target) return;

        const needsRect = !lastRect || now - lastRectAt > 240;
        const rect = needsRect ? target.getBoundingClientRect() : lastRect;
        if (needsRect) {
          lastRect = rect;
          lastRectAt = now;
        }
        if (!rect.width || !rect.height) return;

        const localX = ((currentEvent.clientX - rect.left) / rect.width) * 100;
        const localY = ((currentEvent.clientY - rect.top) / rect.height) * 100;
        if (
          lastLocalX !== null &&
          lastLocalY !== null &&
          Math.abs(localX - lastLocalX) < 2.2 &&
          Math.abs(localY - lastLocalY) < 2.2
        ) {
          return;
        }
        lastLocalX = localX;
        lastLocalY = localY;

        target.style.setProperty('--liquid-local-x', `${localX.toFixed(1)}%`);
        target.style.setProperty('--liquid-local-y', `${localY.toFixed(1)}%`);
      });
    };

    const handlePointerLeave = () => {
      resetTarget(lastTarget);
      lastTarget = null;
      lastRect = null;
      latestEvent = null;
    };

    const handleThemeOrMotionChange = () => {
      if (shouldTrackLiquidGlass()) return;
      resetTarget(lastTarget);
      lastTarget = null;
      lastRect = null;
    };

    const observer = new MutationObserver(handleThemeOrMotionChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener?.('change', handleThemeOrMotionChange);

    const pointerQuery = window.matchMedia('(pointer: fine)');
    pointerQuery.addEventListener?.('change', handleThemeOrMotionChange);

    const handleScrollOrResize = () => {
      lastRect = null;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resetTarget(lastTarget);
      observer.disconnect();
      motionQuery.removeEventListener?.('change', handleThemeOrMotionChange);
      pointerQuery.removeEventListener?.('change', handleThemeOrMotionChange);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
    };
  }, []);

  return null;
};

export default LiquidGlassInteraction;
