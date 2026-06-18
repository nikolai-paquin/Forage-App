import { motion } from 'framer-motion';
import { useForage } from '../lib/store';
import type { Item, Project } from '../types';
import { GradientCover } from './GradientCover';
import { DitherGlow } from './DitherGlow';
import { SoftWash } from './SoftWash';
import { Clock, Plus, Sparkle } from './icons';
import { timeAgo } from '../lib/util';

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function thumb(i: Item) {
  return i.type === 'video' ? i.poster : i.media;
}

function ProjectCard({
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
  const thumbs = inProj.filter((i) => thumb(i)).slice(0, 3);

  return (
    <motion.button
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className="group w-[280px] shrink-0 text-left"
    >
      <GradientCover
        color={project.color}
        seed={seed}
        className="flex h-44 flex-col justify-between rounded-3xl p-4"
      >
        <div className="flex items-start justify-between">
          <span className="tnum rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-medium text-white/95 backdrop-blur-md">
            {inProj.length} items
          </span>
          <div className="flex -space-x-2">
            {thumbs.map((t) => (
              <span
                key={t.id}
                className="h-8 w-8 overflow-hidden rounded-full border-2 border-white/70 shadow"
              >
                <img src={thumb(t)} alt="" className="h-full w-full object-cover" />
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="display text-[22px] text-white drop-shadow-sm">{project.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-[12px] text-white/75">{project.brief}</p>
        </div>
      </GradientCover>
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

  const weekAgo = Date.now() - 7 * 86_400_000;
  const newThisWeek = items.filter((i) => i.createdAt > weekAgo).length;

  // Hero: a striking favorite to resurface, else the most recent with media.
  const withMedia = items.filter((i) => thumb(i));
  const featured =
    withMedia.find((i) => i.favorite) ??
    [...withMedia].sort((a, b) => b.createdAt - a.createdAt)[0];

  const recent = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, 7);

  return (
    <div className="relative isolate mx-auto max-w-6xl px-6 pb-28 pt-10">
      <SoftWash className="-top-24 h-[560px] opacity-90" blur={56} />
      <DitherGlow className="-top-6 left-10 h-56 w-[460px] opacity-35" />

      {/* Greeting */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <p className="text-[12px] font-medium uppercase tracking-[0.2em] text-muted">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="display mt-2 text-[40px] text-ink sm:text-[52px]">
          {greeting()}, Nikolai.
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          <span className="tnum text-ink">{items.length}</span> finds across{' '}
          <span className="tnum text-ink">{projects.length}</span> projects
          {newThisWeek > 0 && (
            <>
              {' '}· <span className="tnum text-accent">{newThisWeek}</span> foraged this week
            </>
          )}
        </p>
      </motion.div>

      {/* Hero — featured resurfacing */}
      {featured && (
        <motion.button
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4 }}
          onClick={() => onOpen(featured)}
          className="group relative mt-8 block h-[320px] w-full overflow-hidden rounded-[28px] text-left"
          style={{ boxShadow: 'var(--shadow-pop)' }}
        >
          <img
            src={thumb(featured)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="noise absolute inset-0 opacity-[0.18] mix-blend-soft-light" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-7">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-white backdrop-blur-md">
                <Clock width={12} height={12} /> Worth a second look
              </span>
              <h2 className="display mt-3 text-[30px] text-white sm:text-[36px]">
                {featured.title}
              </h2>
              <p className="mt-1.5 text-[13px] text-white/80">
                {featured.source} · saved {timeAgo(featured.createdAt)}
              </p>
            </div>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-[13px] font-medium text-black transition group-hover:gap-2.5 sm:inline-flex">
              Open →
            </span>
          </div>
        </motion.button>
      )}

      {/* Projects */}
      <div className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="display text-[20px] text-ink">Your projects</h3>
          <button
            onClick={() => setView({ kind: 'library' })}
            className="text-[13px] text-muted transition hover:text-accent"
          >
            See everything →
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              items={items}
              seed={i + 1}
              onOpen={() => setView({ kind: 'project', projectId: p.id })}
            />
          ))}
          <button
            onClick={onCapture}
            className="flex h-44 w-[160px] shrink-0 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border-strong text-muted transition hover:border-accent hover:text-accent"
          >
            <Plus width={22} height={22} />
            <span className="text-[13px]">New find</span>
          </button>
        </div>
      </div>

      {/* Recently foraged */}
      <div className="mt-12">
        <h3 className="display mb-4 text-[20px] text-ink">Recently foraged</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {recent.map((it) => (
            <motion.button
              key={it.id}
              whileHover={{ y: -4 }}
              onClick={() => onOpen(it)}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-border"
              style={{ background: it.palette[1] }}
              title={it.title}
            >
              {thumb(it) ? (
                <img
                  src={thumb(it)}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    background: `linear-gradient(140deg, ${it.palette[0]}, ${it.palette[1]})`,
                  }}
                >
                  <Sparkle width={18} height={18} className="text-white/80" />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-[10.5px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                {it.title}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
