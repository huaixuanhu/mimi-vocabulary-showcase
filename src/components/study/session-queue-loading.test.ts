import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactNode } from "react";
import { ActivePracticeSession } from "@/components/practice/active-practice-session";
import { ReviewSession } from "@/components/review/review-session";
import type { DailyStudyQueueResult } from "@/components/study/use-daily-study";
import type { ReviewProfile, StudyActivityType, StudyZone } from "@/lib/daily-study/types";
import { getSelectedPersonId } from "@/lib/people/repository";
import { addVocabularyItem, createEmptyVocabularyData } from "@/lib/vocabulary/repository";

// As in the workspace recovery tests, use a synchronous hook host in Node.
// Effects are captured so a test can replay React's development Strict Mode
// mount (setup, cleanup, setup) on the session-loading effect alone.
type EffectSetup = () => void | (() => void);
const host = vi.hoisted(() => ({
  cursor: 0,
  cells: [] as unknown[],
  effects: [] as { setup: EffectSetup; deps?: readonly unknown[] }[],
  study: null as unknown,
}));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState(initial: unknown) {
      const index = host.cursor++;
      if (!(index in host.cells)) host.cells[index] = typeof initial === "function" ? initial() : initial;
      return [host.cells[index], (next: unknown) => {
        host.cells[index] = typeof next === "function" ? next(host.cells[index]) : next;
      }];
    },
    useRef(initial: unknown) {
      const index = host.cursor++;
      if (!(index in host.cells)) host.cells[index] = { current: initial };
      return host.cells[index];
    },
    useMemo: (factory: () => unknown) => factory(),
    useEffect(setup: EffectSetup, deps?: readonly unknown[]) {
      host.effects.push({ setup, deps });
    },
  };
});
vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => false,
}));
vi.mock("@/components/study/use-daily-study", () => ({
  useDailyStudy: () => host.study,
  createStudyIdempotencyKey: () => "test-idempotency-key",
}));
vi.mock("@/components/sound-provider", () => ({
  useMimiSound: () => ({ settings: { reviewComplete: false } }),
}));
vi.mock("@/components/use-word-pronunciation", () => ({
  useWordPronunciation: () => ({ isPlaying: false, play: async () => {} }),
}));

type QueueInput = Readonly<{
  reviewProfile: ReviewProfile;
  activityType: StudyActivityType;
  zone: StudyZone;
}>;

function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return text(node.props.children);
  return typeof node === "string" || typeof node === "number" ? String(node) : "";
}
function fixture() {
  const now = "2026-10-24T00:00:00.000Z";
  let data = createEmptyVocabularyData(now);
  for (const input of [
    { id: "recognition-word", surfaceText: "alpha", learningTrack: "recognition" as const },
    { id: "active-word", surfaceText: "beta", learningTrack: "active" as const },
  ]) {
    data = addVocabularyItem(data, {
      ...input, meaningZh: "测试", source: "manual", timezone: "Australia/Melbourne",
    }, now).data;
  }
  return data;
}
function mountStudy(vocabularyItemId: string) {
  const data = fixture();
  const personId = getSelectedPersonId(data);
  const readQueue = vi.fn(async (input: QueueInput): Promise<DailyStudyQueueResult> => ({
    zone: input.zone,
    entries: [{ vocabularyItemId, promptToken: `prompt-${vocabularyItemId}` }] as unknown as DailyStudyQueueResult["entries"],
    nextCursorToken: null,
    plan: {
      personId,
      planId: "plan-today",
      planVersion: 1,
      localDate: "2026-10-24",
      reviewProfile: input.reviewProfile,
      activityType: input.activityType,
    },
  }));
  host.study = {
    data,
    isLoaded: true,
    storageRuntime: "local",
    commit: vi.fn(),
    today: null,
    readQueue,
    refreshPrompt: vi.fn(),
    recordRating: vi.fn(),
    rollbackRating: vi.fn(),
  };
  return { personId, readQueue };
}
function render(session: () => ReactNode) {
  host.cursor = 0;
  host.effects = [];
  return session();
}
function sessionEffect(deps: readonly unknown[]) {
  const found = host.effects.filter((effect) =>
    effect.deps?.length === deps.length &&
    effect.deps.every((value, index) => Object.is(value, deps[index])),
  );
  expect(found).toHaveLength(1);
  return found[0].setup;
}
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  host.cursor = 0;
  host.cells = [];
  host.effects = [];
  host.study = null;
});

describe.each([
  {
    name: "Recognition Review",
    vocabularyItemId: "recognition-word",
    session: () => ReviewSession({ zone: "new" }),
    deps: (personId: string) => [true, personId, "new"],
    preparing: "Preparing this zone...",
  },
  {
    name: "Active practice",
    vocabularyItemId: "active-word",
    session: () => ActivePracticeSession({ zone: "new", mode: "spell" }),
    deps: (personId: string) => [true, "spell", personId, "new"],
    preparing: "Preparing Active practice...",
  },
])("$name queue loading", ({ vocabularyItemId, session, deps, preparing }) => {
  it("shows the queue after the development Strict Mode mount replays the effect", async () => {
    const { personId, readQueue } = mountStudy(vocabularyItemId);
    render(session);
    const setup = sessionEffect(deps(personId));

    const cleanup = setup();
    if (typeof cleanup === "function") cleanup();
    setup();

    await vi.waitFor(() => expect(text(render(session))).toContain("1 left"));
    expect(text(render(session))).not.toContain(preparing);
    // The cancelled first request is discarded; development may ask twice.
    expect(readQueue).toHaveBeenCalledTimes(2);
  });

  it("keeps one queue request per learner and zone once the queue is applied", async () => {
    const { personId, readQueue } = mountStudy(vocabularyItemId);
    render(session);
    const cleanup = sessionEffect(deps(personId))();

    await vi.waitFor(() => expect(text(render(session))).toContain("1 left"));
    if (typeof cleanup === "function") cleanup();
    render(session);
    sessionEffect(deps(personId))();
    await settle();

    expect(readQueue).toHaveBeenCalledTimes(1);
    expect(text(render(session))).toContain("1 left");
  });
});
