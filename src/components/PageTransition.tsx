import { type ReactNode, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export const PageTransition = ({ children, routeKey }: { children: ReactNode; routeKey: string }) => {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion = mounted ? reducedMotion : false;

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="route-shell"
    >
      {children}
      {!prefersReducedMotion ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[120] bg-[radial-gradient(circle_at_50%_24%,rgba(255,174,101,0.12),transparent_18rem),linear-gradient(180deg,rgba(7,12,18,0.18),rgba(7,12,18,0))]"
          initial={{ opacity: 0.14 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0.1 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
    </motion.div>
  );
};
