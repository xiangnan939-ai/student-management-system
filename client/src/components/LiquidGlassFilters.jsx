const LiquidGlassFilters = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="liquid-filter-defs"
    width="0"
    height="0"
  >
    <defs>
      <filter id="liquid-glass-ripple" x="-12%" y="-12%" width="124%" height="124%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.038"
          numOctaves="2"
          seed="11"
          result="liquidNoise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="liquidNoise"
          scale="7"
          xChannelSelector="R"
          yChannelSelector="G"
          result="displaced"
        />
        <feGaussianBlur in="displaced" stdDeviation="0.16" />
      </filter>
    </defs>
  </svg>
);

export default LiquidGlassFilters;
