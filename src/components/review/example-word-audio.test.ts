import { afterEach, describe, expect, it, vi } from "vitest";
import { ExampleWordActions } from "./example-word-actions";
import { cancelEnglishSpeech, speakEnglishText } from "@/lib/ui/speech-synthesis";
import { createEmptyVocabularyData } from "@/lib/vocabulary/repository";

// Capture the component's real mount cleanups without a browser or provider.
const host = vi.hoisted(() => ({
  effects: [] as (() => void | (() => void))[],
}));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useState: (value: unknown) => [value, vi.fn()],
  useRef: (value: unknown) => ({ current: value }),
  useMemo: (factory: () => unknown) => factory(),
  useId: () => "example-audio-test",
  useEffect: (setup: () => void | (() => void)) => host.effects.push(setup),
}));

afterEach(() => {
  cancelEnglishSpeech();
  host.effects = [];
  vi.unstubAllGlobals();
});

describe("an exiting Recognition card's example audio", () => {
  it("does not stop the next word when the previous answer finishes exiting", async () => {
    ExampleWordActions({
      example: "The previous word has an example.",
      exampleTranslationZh: "上一个词有一个例句。",
      exampleIndex: 0,
      sourceVocabularyItemId: "previous-word",
      sourceSurfaceText: "previous",
      sourceMeaningsZh: ["之前的"],
      sourceExamples: ["The previous word has an example."],
      localPreviewEnabled: true,
      formalRouteEnabled: false,
      data: createEmptyVocabularyData("2026-10-26T00:00:00.000Z"),
      commit: vi.fn(),
    });
    const cleanups = host.effects.map((setup) => setup());
    const pause = vi.fn();
    vi.stubGlobal("Audio", class {
      pause = pause;
      play = async () => {};
      addEventListener() {}
    });

    // AnimatePresence starts the next word before removing the old answer.
    expect(await speakEnglishText("next word", "recognition", {
      sourcePreference: "cloud",
      createRequestId: () => "00000000-0000-4000-8000-000000000007",
      fetchImpl: vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "audio/mpeg" },
      })),
    })).toMatchObject({ status: "spoken" });
    expect(pause).not.toHaveBeenCalled();

    for (const cleanup of cleanups) {
      if (typeof cleanup === "function") cleanup();
    }
    expect(pause).not.toHaveBeenCalled();

    // Explicit global cancellation, such as changing source, still stops it.
    cancelEnglishSpeech();
    expect(pause).toHaveBeenCalledOnce();
  });
});
