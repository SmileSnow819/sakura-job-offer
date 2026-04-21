import React from 'react';

export const NoiseTexture: React.FC = () => (
  <svg style={{ position: 'absolute', width: 0, height: 0 }}>
    <defs>
      <filter id="offerNoise" x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="3"
          seed="5"
          result="noise"
        />
        <feColorMatrix
          type="matrix"
          values="
            0 0 0 0 0.96
            0 0 0 0 0.62
            0 0 0 0 0.04
            0 0 0 0.03 0
          "
          in="noise"
          result="goldNoise"
        />
        <feComposite operator="in" in="goldNoise" in2="SourceGraphic" result="composite" />
      </filter>
    </defs>
  </svg>
);

export default NoiseTexture;
