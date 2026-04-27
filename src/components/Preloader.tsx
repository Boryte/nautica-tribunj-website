import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { siteMedia } from '@/lib/site-media';

export const Preloader = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const doneTimer = window.setTimeout(onComplete, 2100);
    return () => window.clearTimeout(doneTimer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] overflow-hidden bg-[hsl(var(--surface-hero))]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(255,158,92,0.14),transparent_18rem),linear-gradient(180deg,rgba(8,14,21,0.94),rgba(8,14,21,1))]" />
        <motion.div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(255,170,105,0.1)] blur-3xl"
          animate={{ opacity: [0.18, 0.36, 0.16], scale: [0.94, 1.08, 0.98] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative flex h-full items-center justify-center">
          <div className="relative flex flex-col items-center">
            <motion.div
              className="relative h-px w-[9rem] overflow-hidden bg-white/10 sm:w-[11rem]"
              initial={{ opacity: 0.2, scaleX: 0.68 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-[hsl(var(--brand-gold))] to-transparent"
                initial={{ x: '-130%' }}
                animate={{ x: '260%' }}
                transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              />
            </motion.div>

            <motion.div
              className="mt-7"
              initial={{ opacity: 0, y: 12, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src={siteMedia.logo.src}
                alt="Nautica Tribunj logo"
                className="h-[10.1rem] w-auto sm:h-[10.45rem]"
                loading="eager"
                decoding="async"
                title="Nautica Tribunj logo"
              />
            </motion.div>

            <motion.div
              aria-hidden="true"
              className="mt-4 h-[2.75rem] w-[8rem] overflow-hidden sm:w-[9rem]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.35 }}
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="absolute left-1/2 h-10 w-5 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.46),rgba(255,255,255,0.04)_72%,transparent_76%)] blur-[8px]"
                  style={{ marginLeft: `${(index - 1) * 0.95}rem`, top: '53%' }}
                  animate={{
                    opacity: [0, 0.28, 0],
                    y: [12, -2, -22],
                    x: [0, index === 1 ? 0 : index === 0 ? -2 : 2, index === 0 ? 3 : -3],
                  }}
                  transition={{
                    duration: 1.7,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.18,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
