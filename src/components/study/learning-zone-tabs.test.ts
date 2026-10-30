import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LearningZoneTabs } from "./learning-zone-tabs";

const motionState = vi.hoisted(() => ({
  reduced: false,
  animatedSpan: vi.fn(),
}));

// Observe the component's opt-in to shared layout animation at the Motion boundary.
// This Node test does not simulate browser animation frames or OS preferences.
vi.mock("motion/react", () => ({
  useReducedMotion: () => motionState.reduced,
  motion: {
    span: (props: ComponentProps<"span"> & { layoutId?: string; transition?: unknown }) => {
      const { layoutId, transition, ...domProps } = props;
      motionState.animatedSpan({ layoutId, transition });
      return createElement("span", domProps);
    },
  },
}));

beforeEach(() => motionState.animatedSpan.mockClear());

describe.each([
  { label: "Recognition learning zone", route: "/review" },
  { label: "Active learning zone", route: "/practice-lab?mode=spell" },
])("$label motion preference", ({ label, route }) => {
  const separator = route.includes("?") ? "&" : "?";
  const reviewHref = `${route}${separator}zone=review`;
  const newLearningHref = `${route}${separator}zone=new`;

  function render(zone: "review" | "new") {
    return renderToStaticMarkup(createElement(LearningZoneTabs, {
      zone, label, reviewHref, newLearningHref,
    }));
  }

  it("switches the selected zone without opting into position animation when motion is reduced", () => {
    motionState.reduced = true;
    for (const zone of ["review", "new"] as const) {
      const html = render(zone);
      const selectedLink = html.match(/<a\b[^>]*aria-current="page"[^>]*>/g);
      expect(selectedLink).toHaveLength(1);
      expect(selectedLink?.[0]).toContain(
        `href="${(zone === "review" ? reviewHref : newLearningHref).replaceAll("&", "&amp;")}"`,
      );
      expect(html).toContain("Review</span>");
      expect(html).toContain("New Learning</span>");
      expect(html.match(/mimi-gel-thumb/g)).toHaveLength(1);
    }
    expect(motionState.animatedSpan).not.toHaveBeenCalled();
  });

  it("keeps the existing shared spring marker for normal motion", () => {
    motionState.reduced = false;
    render("review");
    render("new");
    expect(motionState.animatedSpan).toHaveBeenCalledTimes(2);
    for (const [props] of motionState.animatedSpan.mock.calls) {
      expect(props).toEqual({
        layoutId: `zone-thumb-${label}`,
        transition: { type: "spring", visualDuration: 0.34, bounce: 0.3 },
      });
    }
  });
});
