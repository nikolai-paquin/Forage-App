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

  // The project's own colour leads; a warm highlight adds depth (Mercury-like),
  // with no green forced in — keeps covers varied rather than uniformly olive.
  const mesh = `
    radial-gradient(120% 120% at ${x1}% ${y1}%, ${hexA(color, 0.95)} 0%, transparent 58%),
    radial-gradient(85% 85% at ${x2}% ${y2}%, rgba(255, 248, 238, 0.28) 0%, transparent 52%),
    radial-gradient(110% 110% at 88% 12%, ${hexA(color, 0.55)} 0%, transparent 62%),
    linear-gradient(135deg, ${hexA(color, 0.88)}, ${hexA(color, 0.3)})
  `;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0" style={{ background: mesh }} />
      {/* soft inner light for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/10" />
      {/* filmic grain */}
      <div className="noise absolute inset-0 opacity-[0.34] mix-blend-soft-light" />
      {/* refined dither sheen */}
      <div
        className="dither-glow absolute inset-0 opacity-[0.45]"
        style={{ ['--glow' as string]: hexA(color, 0.7) }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
