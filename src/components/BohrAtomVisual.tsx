interface BohrAtomVisualProps {
  symbol: string;
  atomicNumber: number;
  shells: number[];
  size?: number;
}

export function BohrAtomVisual({
  symbol,
  atomicNumber,
  shells,
  size = 210,
}: BohrAtomVisualProps) {
  const center = 110;
  const maxRadius = 92;
  const minRadius = 34;
  const shellCount = Math.max(1, shells.length);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      className="mx-auto select-none overflow-visible"
      aria-label={`نموذج بور لذرة ${symbol}`}
    >
      <defs>
        <radialGradient id="nucleusGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="var(--p-secondary)" />
          <stop offset="100%" stopColor="var(--p-primary)" />
        </radialGradient>
        <filter id="electronGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient radial halo */}
      <circle
        cx={center}
        cy={center}
        r={98}
        fill="var(--p-primary)"
        fillOpacity="0.06"
      />

      {shells.map((electronCount, shellIdx) => {
        const radius =
          shellCount === 1
            ? 56
            : minRadius + ((maxRadius - minRadius) * shellIdx) / (shellCount - 1);
        const spinClass =
          shellIdx % 3 === 0
            ? 'orbit-spin-slow'
            : shellIdx % 3 === 1
              ? 'orbit-spin-med'
              : 'orbit-spin-fast';

        return (
          <g key={shellIdx}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="1.2"
              strokeDasharray={shellIdx === shellCount - 1 ? '4 4' : undefined}
            />
            <g className={spinClass}>
              {Array.from({ length: electronCount }).map((_, eIdx) => {
                const angle = (eIdx / electronCount) * Math.PI * 2;
                const ex = center + radius * Math.cos(angle);
                const ey = center + radius * Math.sin(angle);
                return (
                  <circle
                    key={eIdx}
                    cx={ex}
                    cy={ey}
                    r={shellIdx === shellCount - 1 ? 4.2 : 3.2}
                    fill={shellIdx === shellCount - 1 ? 'var(--p-secondary)' : 'var(--p-primary)'}
                    filter="url(#electronGlow)"
                  />
                );
              })}
            </g>
          </g>
        );
      })}

      {/* Nucleus */}
      <circle cx={center} cy={center} r={22} fill="url(#nucleusGrad)" />
      <text
        x={center}
        y={center - 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize="14"
        fontWeight="800"
        fontFamily="JetBrains Mono, monospace"
      >
        {symbol}
      </text>
      <text
        x={center}
        y={center + 13}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fillOpacity="0.85"
        fontSize="8.5"
        fontWeight="600"
        fontFamily="JetBrains Mono, monospace"
      >
        Z={atomicNumber}
      </text>
    </svg>
  );
}
