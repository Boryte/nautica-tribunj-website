import { type ReactNode, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const viewport = { once: true, margin: '-10% 0px -12% 0px' };

export const revealStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.06,
    },
  },
};

export const revealItem = {
  hidden: { opacity: 0, y: 26, scale: 0.985, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export const revealSoftItem = {
  hidden: { opacity: 0, y: 18, scale: 0.992, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] },
  },
};

export const RevealGroup = ({
  children,
  className,
  as: Component = motion.div,
  delayChildren = 0.06,
  staggerChildren = 0.09,
}: {
  children: ReactNode;
  className?: string;
  as?: typeof motion.div;
  delayChildren?: number;
  staggerChildren?: number;
}) => {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion = mounted ? reducedMotion : false;

  return (
    <Component
      className={className}
      variants={prefersReducedMotion ? undefined : {
        hidden: {},
        visible: {
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      initial={prefersReducedMotion ? undefined : 'hidden'}
      whileInView={prefersReducedMotion ? undefined : 'visible'}
      viewport={prefersReducedMotion ? undefined : viewport}
    >
      {children}
    </Component>
  );
};

export const Reveal = ({
  children,
  className,
  delay = 0,
  soft = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  soft?: boolean;
}) => {
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersReducedMotion = mounted ? reducedMotion : false;

  return (
    <motion.div
      className={cn(className)}
      variants={prefersReducedMotion ? undefined : soft ? revealSoftItem : revealItem}
      transition={prefersReducedMotion ? undefined : { delay }}
    >
      {children}
    </motion.div>
  );
};
