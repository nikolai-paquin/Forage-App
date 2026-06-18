/** A grainy mesh-gradient surface — the tactile, analog "cover" look. */
import type { ReactNode } from 'react';

const hexA = (hex: string, alpha: number) => {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
};

export function GradientCover({
  color,
  seed = 0,
  className = '',
  children,
}: {
  color: string;
  seed?: number;
  className?: string;
  children?: ReactNode;
}) {
  // Shift the mesh by seed so each cover feels individual.
  const x1 = 12 + ((seed * 23) % 40);
  const y1 = 10 + ((seed * 37) % 35);
  const x2 = 70 - ((seed * 17) % 30);
  const y2 = 75 - ((seed * 29) % 30);

  const mesh = `
    radial-gradient(120% 120% at ${x1}% ${y1}%, ${hexA(color, 0.95)} 0%, transparent 55%),
    radial-gradient(90% 90% at ${x2}% ${y2}%, var(--accent) 0%, transparent 50%),
    radial-gradient(100% 100% at 85% 15%, ${hexA(color, 0.6)} 0%, transparent 60%),
    linear-gradient(135deg, ${hexA(color, 0.85)}, ${hexA(color, 0.35)})
  `;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ background: mesh }} />
      {/* soft inner light for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10" />
      {/* filmic grain */}
      <div className="noise absolute inset-0 opacity-[0.22] mix-blend-soft-light" />
      {/* refined dither sheen */}
      <div
        className="dither-glow absolute inset-0 opacity-30"
        style={{ ['--glow' as string]: hexA(color, 0.6) }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
