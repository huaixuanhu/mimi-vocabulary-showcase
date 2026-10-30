"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { useState } from "react";
import { BrandIdentity } from "@/components/brand-identity";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import {
  appNavItems,
  mobileMoreItem,
  mobileMoreNavItems,
  mobilePrimaryNavItems,
} from "@/lib/stage-two-data";

function isActiveRoute(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

const pebbleSpring = { type: "spring", visualDuration: 0.34, bounce: 0.3 } as const;

export function DesktopSidebar() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <aside className="mimi-rail hidden w-[248px] shrink-0 border-r px-4 py-5 lg:flex lg:flex-col">
      <Link
        href="/"
        className="mimi-brand-home-button mimi-focus-ring block rounded-md"
        aria-label="Go to dashboard"
      >
        <BrandIdentity variant="sidebar" />
      </Link>

      <nav className="mt-8 grid gap-1" aria-label="Main">
        {appNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={active ? "page" : undefined}
              className={`mimi-focus-ring mimi-press group relative flex min-h-11 items-center gap-3 rounded-full px-4 text-sm font-medium ${
                active
                  ? "text-[var(--mimi-on-thumb)]"
                  : "text-[var(--mimi-rail-soft)] hover:bg-[var(--mimi-nav-hover-bg)] hover:text-[var(--mimi-rail-strong)]"
              }`}
            >
              {active && reduceMotion ? (
                <span className="mimi-gel-thumb absolute inset-0 rounded-full" />
              ) : active ? (
                <motion.span
                  layoutId="desktop-nav-active"
                  transition={pebbleSpring}
                  className="mimi-gel-thumb absolute inset-0 rounded-full"
                />
              ) : null}
              <Icon aria-hidden="true" className="relative z-10 size-4 shrink-0" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = mobileMoreNavItems.some((item) => isActiveRoute(pathname, item.href));
  const MoreIcon = mobileMoreItem.icon;

  return (
    <>
      <nav
        className="mimi-mobile-nav fixed inset-x-3 z-20 border p-1.5 backdrop-blur lg:hidden"
        aria-label="Mobile"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
          {mobilePrimaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={active ? "page" : undefined}
                className={`mimi-focus-ring mimi-press relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-full text-[11px] font-semibold ${
                  active ? "text-[var(--mimi-on-thumb)]" : "text-[var(--mimi-text-soft)] hover:text-[var(--mimi-primary-deep)]"
                }`}
              >
                {active && reduceMotion ? (
                  <span className="mimi-gel-thumb absolute inset-x-1 inset-y-0.5 rounded-full" />
                ) : active ? (
                  <motion.span
                    layoutId="mobile-nav-active"
                    transition={pebbleSpring}
                    className="mimi-gel-thumb absolute inset-x-1 inset-y-0.5 rounded-full"
                  />
                ) : null}
                <span className="relative z-10">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="relative z-10">{"mobileLabel" in item ? item.mobileLabel : item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            title={mobileMoreItem.label}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            aria-current={moreActive ? "page" : undefined}
            onClick={() => setMoreOpen(true)}
            className={`mimi-focus-ring mimi-press relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-full text-[11px] font-semibold ${
              moreActive || moreOpen
                ? "text-[var(--mimi-on-thumb)]"
                : "text-[var(--mimi-text-soft)] hover:text-[var(--mimi-primary-deep)]"
            }`}
          >
            {(moreActive || moreOpen) && reduceMotion ? (
              <span className="mimi-gel-thumb absolute inset-x-1 inset-y-0.5 rounded-full" />
            ) : moreActive || moreOpen ? (
              <motion.span
                layoutId="mobile-nav-active"
                transition={pebbleSpring}
                className="mimi-gel-thumb absolute inset-x-1 inset-y-0.5 rounded-full"
              />
            ) : null}
            <span className="relative z-10">
              <MoreIcon aria-hidden="true" className="size-5" />
            </span>
            <span className="relative z-10">{mobileMoreItem.label}</span>
          </button>
        </div>
      </nav>

      <ResponsiveDialog
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        labelledBy="mobile-more-title"
        panelClassName="sm:max-w-md"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="mobile-more-title" className="mimi-display-title text-2xl text-[var(--mimi-text)]">
            More
          </h2>
          <button
            type="button"
            onClick={() => setMoreOpen(false)}
            aria-label="Close More menu"
            className="mimi-icon-button mimi-focus-ring grid size-11 shrink-0 place-items-center"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <nav className="mt-5 grid gap-2" aria-label="More destinations">
          {mobileMoreNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMoreOpen(false)}
                className={`mimi-focus-ring mimi-press flex min-h-14 items-center gap-3 rounded-[20px] border px-4 text-sm font-semibold ${
                  active
                    ? "border-transparent bg-[var(--mimi-primary-soft)] text-[var(--mimi-primary-deep)]"
                    : "border-[var(--mimi-border)] bg-[var(--mimi-surface-strong)] text-[var(--mimi-text)] hover:border-[var(--mimi-border-strong)] hover:shadow-[var(--mimi-shadow-soft)]"
                }`}
              >
                <Icon aria-hidden="true" className="size-5 text-[var(--mimi-primary-dark)]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ResponsiveDialog>
    </>
  );
}
