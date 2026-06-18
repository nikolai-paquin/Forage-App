import { motion } from 'framer-motion';
import { Plus } from './icons';

export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title="Add a save (⌘N)"
      className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-full text-accent-ink"
      style={{ background: 'var(--ink)', boxShadow: 'var(--shadow-pop)' }}
    >
      <Plus size={24} />
    </motion.button>
  );
}
