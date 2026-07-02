import { useEffect } from 'react';

const TARGET_SELECTOR = [
  '.glass-panel',
  '.btn-primary',
  '.btn-secondary',
  '.theme-card',
  '.input-field',
].join(',');

const resetTarget = (target) => {
  if (!target) return;
  target.style.removeProperty('--liquid-local-x');
  target.style.removeProperty('--liquid-local-y');
  target.style.removeProperty('--liquid-tilt-x');
  target.style.removeProperty('--liquid-tilt-y');
};

const LiquidGlassInteraction = () => {
  useEffect(() => {
    let frame = 0;
    let lastTarget = null;

    const handlePointerMove = (event) => {
      if (frame) return;

      frame = window.requestAnimationFrame(() => {
        frame = 0;

        const root = document.documentElement;
        const xRatio = event.clientX / Math.max(window.innerWidth, 1);
        const yRatio = event.clientY / Math.max(window.innerHeight, 1);

        root.style.setProperty('--liquid-screen-x', `${(xRatio * 100).toFixed(2)}%`);
        root.style.setProperty('--liquid-screen-y', `${(yRatio * 100).toFixed(2)}%`);

        const target = event.target instanceof Element ? event.target.closest(TARGET_SELECTOR) : null;
        if (target !== lastTarget) {
          resetTarget(lastTarget);
          lastTarget = target;
        }

        if (!target) return;

        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const localX = ((event.clientX - rect.left) / rect.width) * 100;
        const localY = ((event.clientY - rect.top) / rect.height) * 100;
        const dx = (localX - 50) / 50;
        const dy = (localY - 50) / 50;

        target.style.setProperty('--liquid-local-x', `${localX.toFixed(2)}%`);
        target.style.setProperty('--liquid-local-y', `${localY.toFixed(2)}%`);
        target.style.setProperty('--liquid-tilt-x', `${(-dy * 1.8).toFixed(2)}deg`);
        target.style.setProperty('--liquid-tilt-y', `${(dx * 2.2).toFixed(2)}deg`);
      });
    };

    const handlePointerLeave = () => {
      resetTarget(lastTarget);
      lastTarget = null;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      resetTarget(lastTarget);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return null;
};

export default LiquidGlassInteraction;
