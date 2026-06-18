import { Frame } from './icons';

export function SpacesView() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-40 text-center">
      <div className="mb-4 text-faint">
        <Frame size={36} strokeWidth={1.5} />
      </div>
      <p className="text-[17px] font-medium text-ink">No spaces yet</p>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted">
        Spaces are infinite canvases — drop images, sticky notes, and shapes anywhere you want.
      </p>
      <button
        className="mt-5 rounded-full px-4 py-2 text-[13px] font-medium text-accent-ink"
        style={{ background: 'var(--ink)' }}
      >
        Create your first space
      </button>
    </div>
  );
}
