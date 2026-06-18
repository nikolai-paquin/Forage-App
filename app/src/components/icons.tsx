// Minimal, consistent line icons (1.6 stroke) — no icon dependency.
import type { SVGProps } from 'react';

const base = (props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  ...props,
});

export const Search = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Sun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const Moon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export const Heart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 20s-7-4.4-9.2-8.3C1 8.5 2.6 5 6 5c2 0 3.2 1.2 4 2.3C10.8 6.2 12 5 14 5c3.4 0 5 3.5 3.2 6.7C19 15.6 12 20 12 20Z" />
  </svg>
);

export const Play = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const Link = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M10 13a4 4 0 0 0 5.7.3l2.6-2.6A4 4 0 0 0 12.7 5l-1.3 1.3" />
    <path d="M14 11a4 4 0 0 0-5.7-.3L5.7 13.3A4 4 0 0 0 11.3 19l1.3-1.3" />
  </svg>
);

export const Code = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />
  </svg>
);

export const Sparkle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.5 10.4 12.2 5 10.6 10.4 9 12 3.5Z" />
    <path d="M18.5 16.5 19 18.5 21 19l-2 .5-.5 2-.5-2-2-.5 2-.5.5-2Z" />
  </svg>
);

export const Layers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);

export const Clock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </svg>
);

export const Close = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const Grid = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);

export const Basket = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 9h14l-1.3 9.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5 9Z" />
    <path d="M9 9 12 3l3 6M9.5 13v3M14.5 13v3" />
  </svg>
);

export const Image = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m4 17 5-4 4 3 3-2 4 3" />
  </svg>
);
