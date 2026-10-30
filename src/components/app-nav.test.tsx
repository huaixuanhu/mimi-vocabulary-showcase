import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DesktopSidebar, MobileBottomNav } from "./app-nav";

const navigationState = vi.hoisted(() => ({
  pathname: "/review",
  reduced: false,
  animatedSpan: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => navigationState.pathname }));
vi.mock("@/components/brand-identity", () => ({ BrandIdentity: () => null }));
vi.mock("@/components/ui/responsive-dialog", () => ({ ResponsiveDialog: () => null }));

// Observe shared-layout opt-in; this does not simulate browser frames or OS settings.
vi.mock("motion/react", () => ({
  useReducedMotion: () => navigationState.reduced,
  motion: {
    span: (props: ComponentProps<"span"> & { layoutId?: string; transition?: unknown }) => {
      const { layoutId, transition, ...domProps } = props;
      navigationState.animatedSpan({ layoutId, transition });
      return createElement("span", domProps);
    },
  },
}));

beforeEach(() => navigationState.animatedSpan.mockClear());

describe.each([
  { label: "desktop", Component: DesktopSidebar, layoutId: "desktop-nav-active" },
  { label: "mobile", Component: MobileBottomNav, layoutId: "mobile-nav-active" },
])("$label navigation motion preference", ({ Component, layoutId }) => {
  it("keeps the active destination visible without shared position animation when motion is reduced", () => {
    navigationState.reduced = true;
    for (const pathname of ["/review", "/settings"]) {
      navigationState.pathname = pathname;
      const html = renderToStaticMarkup(createElement(Component));
      const selectedDestination = html.match(/<(?:a|button)\b[^>]*aria-current="page"[^>]*>/g);
      expect(selectedDestination).toHaveLength(1);
      expect(html.match(/mimi-gel-thumb/g)).toHaveLength(1);
      expect(selectedDestination?.[0]).toContain("text-[var(--mimi-on-thumb)]");
      // Settings is represented by More in the mobile dock.
      expect(selectedDestination?.[0]).toContain(
        Component === MobileBottomNav && pathname === "/settings" ? 'title="More"' : `href="${pathname}"`,
      );
    }
    expect(navigationState.animatedSpan).not.toHaveBeenCalled();
  });

  it("keeps the shared spring marker for normal motion", () => {
    navigationState.reduced = false;
    for (const pathname of ["/review", "/settings"]) {
      navigationState.pathname = pathname;
      renderToStaticMarkup(createElement(Component));
    }
    expect(navigationState.animatedSpan).toHaveBeenCalledTimes(2);
    for (const [props] of navigationState.animatedSpan.mock.calls) {
      expect(props).toEqual({
        layoutId,
        transition: { type: "spring", visualDuration: 0.34, bounce: 0.3 },
      });
    }
  });
});
