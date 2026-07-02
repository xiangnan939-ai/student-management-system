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
          baseFrequency="0.009 0.032"
          numOctaves="3"
          seed="11"
          result="liquidNoise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="liquidNoise"
          scale="9"
          xChannelSelector="R"
          yChannelSelector="G"
          result="displaced"
        />
        <feGaussianBlur in="displaced" stdDeviation="0.12" />
      </filter>

      <filter id="liquid-glass-edge" x="-18%" y="-18%" width="136%" height="136%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.018 0.052"
          numOctaves="2"
          seed="19"
          result="edgeNoise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="edgeNoise"
          scale="5"
          xChannelSelector="R"
          yChannelSelector="B"
        />
      </filter>
    </defs>
  </svg>
);

export default LiquidGlassFilters;
