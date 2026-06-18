/**
 * Mercury-style soft gradient wash — a muted, dreamy multi-hue background layer.
 * Decorative; sits behind content (the global grain overlays on top of it).
 */
export function SoftWash({
  className = '',
  blur = 36,
  style,
}: {
  className?: string;
  blur?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={`softwash absolute inset-0 -z-10 ${className}`}
      style={{ filter: `blur(${blur}px)`, ...style }}
    />
  );
}
