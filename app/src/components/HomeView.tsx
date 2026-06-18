import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, Project } from '../types';
import { GradientCover } from './GradientCover';
import { MasonryGrid } from './MasonryGrid';
import { Clock, Plus } from './icons';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const thumb = (i: Item) => (i.type === 'video' ? i.poster : i.media);

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">{children}</h3>
  );
}

function ClusterCard({
  project,
  items,
  seed,
  onOpen,
}: {
  project: Project;
  items: Item[];
  seed: number;
  onOpen: () => void;
}) {
  const inProj = items.filter((i) => i.projectIds.includes(project.id));
  const thumbs = inProj.map(thumb).filter(Boolean) as string[];

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className="group w-[230px] shrink-0 text-left"
    >
      <div className="relative aspect-[5/4] overflow-hidden rounded-xl bg-surface-2">
        {thumbs.length > 0 ? (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[2px]">
            {Array.from({ length: 4 }).map((_, i) => {
              const t = thumbs[i % thumbs.length];
              return (
                <div key={i} className="overflow-hidden bg-surface-2">
                  <img
                    src={t}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <GradientCover color={project.color} seed={seed} className="h-full w-full" />
        )}
        <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: project.color }} />
        <span className="flex-1 truncate text-[13px] text-ink">{project.name}</span>
        <span className="tnum text-[12px] text-faint">{inProj.length}</span>
      </div>
    </motion.button>
  );
}

export function HomeView({
  onOpen,
  onCapture,
}: {
  onOpen: (i: Item) => void;
  onCapture: () => void;
}) {
  const { items, projects, setView } = useForage();

  const feed = [...items].sort((a, b) => b.createdAt - a.createdAt);
  const revisit = items
    .filter((i) => thumb(i))
    .sort((a, b) => a.lastSeenAt - b.lastSeenAt)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-[1500px] px-6 pb-28 pt-8">
      {/* Quiet greeting — the gallery is the star */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <h1 className="text-[21px] tracking-tight text-ink">
          {greeting()}, Nikolai.{' '}
          <span className="text-muted">Here's what you're foraging.</span>
        </h1>
      </motion.div>

      {/* Clusters — projects as image mosaics */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8"
      >
        <div className="mb-3 flex items-baseline justify-between">
          <SectionLabel>Clusters</SectionLabel>
          <button
            onClick={() => setView({ kind: 'library' })}
            className="text-[12px] text-muted transition hover:text-ink"
          >
            All finds →
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {projects.map((p, i) => (
            <ClusterCard
              key={p.id}
              project={p}
              items={items}
              seed={i + 1}
              onOpen={() => setView({ kind: 'project', projectId: p.id })}
            />
          ))}
          <button
            onClick={onCapture}
            className="flex aspect-[5/4] w-[120px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong text-muted transition hover:border-accent hover:text-accent"
          >
            <Plus width={20} height={20} />
            <span className="text-[12px]">New</span>
          </button>
        </div>
      </motion.section>

      {/* Worth revisiting — resurfacing, kept subtle */}
      {revisit.length >= 2 && (
        <motion.section
          {...fadeUp}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9"
        >
          <div className="mb-3 flex items-center gap-1.5">
            <Clock width={13} height={13} className="text-accent" />
            <SectionLabel>Worth revisiting</SectionLabel>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {revisit.map((it) => (
              <motion.button
                key={it.id}
                whileHover={{ y: -4 }}
                onClick={() => onOpen(it)}
                title={it.title}
                className="group h-32 w-44 shrink-0 overflow-hidden rounded-xl bg-surface-2"
              >
                <img
                  src={thumb(it)}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              </motion.button>
            ))}
          </div>
        </motion.section>
      )}

      {/* The feed — the gallery */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="mt-10"
      >
        <div className="mb-4">
          <SectionLabel>Recently foraged</SectionLabel>
        </div>
        <MasonryGrid items={feed} onOpen={onOpen} />
      </motion.section>
    </div>
  );
}
