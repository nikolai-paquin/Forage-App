/**
 * Ambient olive glow rendered as a refined ordered-dither dot field.
 * Decorative only — sits behind content, never intercepts pointer events.
 */
export function DitherGlow({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={`dither-glow absolute -z-10 ${className}`}
      style={style}
    />
  );
}
