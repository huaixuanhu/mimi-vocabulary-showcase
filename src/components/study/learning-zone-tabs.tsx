"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { StudyZone } from "@/lib/daily-study/types";

type LearningZoneTabsProps = Readonly<{
  zone: StudyZone;
  reviewHref: string;
  newLearningHref: string;
  label: string;
}>;

const learningZones = [
  { value: "review", label: "Review" },
  { value: "new", label: "New Learning" },
] as const;

const thumbSpring = { type: "spring", visualDuration: 0.34, bounce: 0.3 } as const;

export function LearningZoneTabs({
  zone,
  reviewHref,
  newLearningHref,
  label,
}: LearningZoneTabsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <nav
      aria-label={label}
      className="mimi-glass-tray grid grid-cols-2 rounded-full p-1"
    >
      {learningZones.map((item) => {
        const active = zone === item.value;
        const href = item.value === "review" ? reviewHref : newLearningHref;

        return (
          <Link
            key={item.value}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`mimi-focus-ring mimi-press relative flex min-h-11 items-center justify-center rounded-full px-3 text-sm font-semibold ${
              active
                ? "text-[var(--mimi-on-thumb)]"
                : "text-[var(--mimi-text-soft)] hover:text-[var(--mimi-primary-deep)]"
            }`}
          >
            {active && reduceMotion ? (
              <span className="mimi-gel-thumb absolute inset-0 rounded-full" />
            ) : active ? (
              <motion.span
                layoutId={`zone-thumb-${label}`}
                transition={thumbSpring}
                className="mimi-gel-thumb absolute inset-0 rounded-full"
              />
            ) : null}
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
