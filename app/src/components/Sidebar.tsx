import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { View } from '../types';
import { Basket, Clock, Grid, Layers } from './icons';

function NavRow({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
        active ? 'text-ink' : 'text-muted hover:text-ink'
      }`}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 -z-10 rounded-lg bg-surface-2"
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
        />
      )}
      <span className={active ? 'text-accent' : ''}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className="rounded-full bg-surface-2 px-1.5 text-[11px] tabular-nums text-muted">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function Sidebar() {
  const { view, setView, projects, basketCount, storyboards } = useForage();
  const is = (v: View) => {
    if (v.kind !== view.kind) return false;
    if (v.kind === 'project' && view.kind === 'project') return v.projectId === view.projectId;
    if (v.kind === 'storyboard' && view.kind === 'storyboard')
      return v.storyboardId === view.storyboardId;
    return v.kind !== 'project' && v.kind !== 'storyboard';
  };

  return (
    <aside className="flex w-[228px] shrink-0 flex-col gap-5 border-r border-border px-3 pb-4 pt-3">
      <div className="px-2.5 pt-1">
        <div className="flex items-center gap-2">
          <span
            className="grid h-7 w-7 place-items-center rounded-lg text-accent-ink"
            style={{ background: 'var(--accent)' }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 3c0 5-2.4 7.6-6 9 3.6 1.4 6 4 6 9 0-5 2.4-7.6 6-9-3.6-1.4-6-4-6-9Z" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Forage</span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        <NavRow
          active={is({ kind: 'library' })}
          onClick={() => setView({ kind: 'library' })}
          icon={<Grid width={17} height={17} />}
          label="Library"
        />
        <NavRow
          active={is({ kind: 'basket' })}
          onClick={() => setView({ kind: 'basket' })}
          icon={<Basket width={17} height={17} />}
          label="Basket"
          badge={basketCount}
        />
      </nav>

      <div className="flex flex-col gap-0.5">
        <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-faint">
          Projects
        </p>
        {projects.map((p) => (
          <NavRow
            key={p.id}
            active={is({ kind: 'project', projectId: p.id })}
            onClick={() => setView({ kind: 'project', projectId: p.id })}
            icon={
              <span
                className="block h-2.5 w-2.5 rounded-full"
                style={{ background: p.color }}
              />
            }
            label={p.name}
          />
        ))}
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-faint">
          Storyboards
        </p>
        {storyboards.map((sb) => {
          const p = projects.find((pr) => pr.id === sb.projectId);
          return (
            <NavRow
              key={sb.id}
              active={is({ kind: 'storyboard', storyboardId: sb.id })}
              onClick={() => setView({ kind: 'storyboard', storyboardId: sb.id })}
              icon={<Layers width={16} height={16} style={{ color: p?.color }} />}
              label={sb.title}
            />
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-0.5 border-t border-border pt-3">
        <NavRow
          active={false}
          onClick={() => {}}
          icon={<Clock width={17} height={17} />}
          label="Digest"
        />
      </div>
    </aside>
  );
}
