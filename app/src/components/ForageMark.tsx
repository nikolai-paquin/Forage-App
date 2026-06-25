/** The Forage mark — four leaves meeting at a center pinwheel. Renders in
 *  `currentColor`, so it inverts naturally with the surrounding text color
 *  (white on the dark chip in light mode, dark in dark mode). */
export function ForageMark({ size = 18, className }: { size?: number; className?: string }) {
  const petal = `
    M 470 284 L 470 400 Q 470 470 400 470 L 284 470
    C 300 392 332 332 256 256
    C 332 332 392 300 470 284 Z
    M 322 322 C 360 332 404 376 414 414 C 376 404 332 360 322 322 Z
    M 360 360 L 410 360 L 410 410 L 360 410 Z
  `;
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="currentColor"
      fillRule="evenodd"
      className={className}
      aria-hidden="true"
    >
      {[0, 90, 180, 270].map((a) => (
        <path key={a} d={petal} transform={`rotate(${a} 256 256)`} />
      ))}
    </svg>
  );
}
