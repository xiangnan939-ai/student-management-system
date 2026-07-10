import { useEffect, useRef } from 'react';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const FRAME_INTERVAL = 34;

const MatrixRain = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;

    let frame = 0;
    let lastFrameAt = 0;
    let columns = [];
    let fontSize = 16;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const isMatrixTheme = () => document.documentElement.dataset.theme === 'matrix';
    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      fontSize = Math.max(13, Math.min(18, Math.round(width / 96)));

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.font = `600 ${fontSize}px "JetBrains Mono", monospace`;

      const columnCount = Math.ceil(width / fontSize);
      columns = Array.from({ length: columnCount }, () => Math.random() * -(height / fontSize));
      context.clearRect(0, 0, width, height);
    };

    const draw = (time) => {
      if (!isMatrixTheme()) {
        context.clearRect(0, 0, width, height);
        frame = 0;
        return;
      }

      if (time - lastFrameAt < FRAME_INTERVAL) {
        frame = window.requestAnimationFrame(draw);
        return;
      }
      lastFrameAt = time;

      context.fillStyle = 'rgba(2, 7, 3, 0.16)';
      context.fillRect(0, 0, width, height);

      columns.forEach((drop, index) => {
        const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const x = index * fontSize;
        const y = Math.floor(drop) * fontSize;
        const head = Math.random() > 0.93;

        context.fillStyle = head ? 'rgba(214, 255, 204, 0.9)' : 'rgba(91, 255, 108, 0.48)';
        context.fillText(character, x, y);
        columns[index] = drop + 0.72 + Math.random() * 0.48;

        if (y > height && Math.random() > 0.978) {
          columns[index] = Math.random() * -28;
        }
      });

      frame = window.requestAnimationFrame(draw);
    };

    const start = () => {
      if (frame) window.cancelAnimationFrame(frame);
      resize();
      if (!isMatrixTheme()) return;

      if (prefersReducedMotion()) {
        context.fillStyle = 'rgba(2, 7, 3, 0.72)';
        context.fillRect(0, 0, width, height);
        columns.forEach((drop, index) => {
          context.fillStyle = 'rgba(91, 255, 108, 0.35)';
          context.fillText(CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)], index * fontSize, Math.floor(drop + 34) * fontSize);
        });
        return;
      }

      frame = window.requestAnimationFrame(draw);
    };

    const themeObserver = new MutationObserver(start);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener?.('change', start);
    window.addEventListener('resize', start, { passive: true });
    start();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      themeObserver.disconnect();
      motionQuery.removeEventListener?.('change', start);
      window.removeEventListener('resize', start);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-rain-canvas" aria-hidden="true" />;
};

export default MatrixRain;
