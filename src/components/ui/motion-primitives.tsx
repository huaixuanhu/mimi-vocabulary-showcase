"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

// Soft springs: dampingRatio = 1 - bounce, so 0.2 settles almost flat and 0.38 overshoots about 8%.
export const softSpring = { type: "spring", visualDuration: 0.42, bounce: 0.2 } as const;
export const reducedFade = { duration: 0.12, ease: "easeOut" } as const;
// A rated card dissolves into the mist while the next one comes into focus.
export const mistCardFrom = { opacity: 0, scale: 0.985, filter: "blur(12px)" } as const;
// transitionEnd drops the finished blur so the card's own glass blur is not left under a filter.
export const mistCardTo = { opacity: 1, scale: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } } as const;
export const mistCardIn = { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } as const;
export const mistExit = {
  opacity: 0,
  scale: 1.03,
  filter: "blur(10px)",
  transition: { duration: 0.32, ease: [0.4, 0, 0.6, 1] },
} as const;
export const answerUnfold = {
  // Translation should be readable promptly while the height settles with a small bounce.
  height: { type: "spring", visualDuration: 0.26, bounce: 0.3 },
  opacity: { duration: 0.12 },
  filter: { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] },
} as const;

type EntranceProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function CalmEntrance({ children, className, delay = 0 }: EntranceProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...softSpring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type CalmCardProps = ComponentProps<typeof motion.div> & {
  delay?: number;
};

export function CalmCard({ children, className, delay = 0, ...props }: CalmCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ ...softSpring, delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type PressableProps = ComponentProps<typeof motion.button>;

// The squash-and-spring press lives in CSS (`.mimi-press`) so buttons and links share it
// and reduced motion can switch it off in one place.
export function PressableButton({ children, className, ...props }: PressableProps) {
  return (
    <motion.button className={className ? `mimi-press ${className}` : "mimi-press"} {...props}>
      {children}
    </motion.button>
  );
}
