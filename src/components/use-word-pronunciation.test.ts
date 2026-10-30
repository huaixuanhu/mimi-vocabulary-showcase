import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWordPronunciation } from "./use-word-pronunciation";
import { cancelEnglishSpeech, SPEECH_SOURCE_STORAGE_KEY } from "@/lib/ui/speech-synthesis";

type Effect = { setup: () => void | (() => void); deps: readonly unknown[]; cleanup?: () => void };
const host = vi.hoisted(() => ({ cursor: 0, cells: [] as unknown[], pending: [] as Effect[], mounted: [] as Effect[] }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useState(initial: unknown) {
    const index = host.cursor++;
    if (!(index in host.cells)) host.cells[index] = initial;
    return [host.cells[index], (value: unknown) => { host.cells[index] = value; }];
  },
  useRef(initial: unknown) {
    const index = host.cursor++;
    if (!(index in host.cells)) host.cells[index] = { current: initial };
    return host.cells[index];
  },
  useCallback: (callback: unknown) => callback,
  useEffect: (setup: Effect["setup"], deps: readonly unknown[]) => host.pending.push({ setup, deps }),
}));

function renderPronunciation(activationKey: string | null, autoPlay: boolean, onMessage: Parameters<typeof useWordPronunciation>[0]["onMessage"]) {
  host.cursor = 0;
  host.pending = [];
  // This synchronous Node hook host deliberately supplies React hooks above.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const result = useWordPronunciation({ text: activationKey, purpose: "recognition", activationKey,
    autoPlay, unsupportedMessage: "unsupported", onMessage });
  host.pending.forEach((effect, index) => {
    const previous = host.mounted[index];
    if (previous && effect.deps.length === previous.deps.length &&
      effect.deps.every((value, dependency) => Object.is(value, previous.deps[dependency]))) return;
    previous?.cleanup?.();
    host.mounted[index] = { ...effect, cleanup: effect.setup() || undefined };
  });
  return result;
}

beforeEach(() => {
  // These lifecycle cases exercise mocked cloud audio explicitly. The showcase
  // still defaults to device speech; no real provider request is made here.
  vi.stubGlobal("window", {
    localStorage: { getItem: (key: string) => key === SPEECH_SOURCE_STORAGE_KEY ? "cloud" : null },
  });
});

afterEach(() => {
  for (const effect of host.mounted) effect.cleanup?.();
  cancelEnglishSpeech();
  host.cursor = 0;
  host.cells = [];
  host.pending = [];
  host.mounted = [];
  vi.unstubAllGlobals();
});

describe("word pronunciation activation lifecycle", () => {
  it.each([
    { laterMessage: null, expected: "" },
    { laterMessage: "Rating could not be saved", expected: "Rating could not be saved" },
  ])("clears a recovered playback warning without erasing $laterMessage", async ({ laterMessage, expected }) => {
    const play = vi.fn()
      .mockRejectedValueOnce(new DOMException("requires a gesture", "NotAllowedError"))
      .mockResolvedValue(undefined);
    vi.stubGlobal("Audio", class {
      play = play;
      pause() {}
      addEventListener() {}
    });
    const fetch = vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
      headers: { "content-type": "audio/mpeg", "x-mimi-tts-voice-contract": "audio-recovery-fixture" },
    }));
    vi.stubGlobal("fetch", fetch);
    let message = "";
    const onMessage: Parameters<typeof useWordPronunciation>[0]["onMessage"] = (next) => {
      message = typeof next === "function" ? next(message) : next;
    };
    const word = `recovery ${laterMessage ?? "warning"}`;
    renderPronunciation(word, true, onMessage);
    await vi.waitFor(() => expect(message).toBe("Autoplay was blocked · Tap the sound button"));
    if (laterMessage) message = laterMessage;

    await renderPronunciation(word, true, onMessage).play();
    expect(fetch).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledTimes(2);
    expect(message).toBe(expected);
  });

  it("cancels pending audio on exit and ignores its late failure message", async () => {
    let resolve: (response: Response) => void = () => {};
    let signal: AbortSignal | null | undefined;
    vi.stubGlobal("fetch", vi.fn((_url, init: RequestInit) => {
      signal = init.signal;
      return new Promise<Response>((complete) => { resolve = complete; });
    }));
    const onMessage = vi.fn();
    renderPronunciation("first card", true, onMessage);
    await Promise.resolve();
    expect(signal?.aborted).toBe(false);
    renderPronunciation(null, false, onMessage);
    expect(signal?.aborted).toBe(true);
    resolve(new Response(JSON.stringify({ message: "old request failed" }), { status: 503 }));
    await new Promise((complete) => setTimeout(complete, 0));

    expect(onMessage).not.toHaveBeenCalled();
    expect(renderPronunciation(null, false, onMessage).isPlaying).toBe(false);
  });

  it("allows manual playback on a silent card after cancelling the prior automatic request", async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal("fetch", vi.fn((_url, init: RequestInit) => {
      signals.push(init.signal!);
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    }));
    const onMessage = vi.fn();
    renderPronunciation("dictation card", true, onMessage);
    await Promise.resolve();
    expect(renderPronunciation("dictation card", true, onMessage).isPlaying).toBe(true);
    renderPronunciation("silent spell card", false, onMessage);
    await Promise.resolve();
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(true);
    const silentCard = renderPronunciation("silent spell card", false, onMessage);
    expect(silentCard.isPlaying).toBe(false);

    const manualPlay = silentCard.play();
    expect(signals).toHaveLength(2);
    renderPronunciation(null, false, onMessage);
    await manualPlay;
    expect(signals[1].aborted).toBe(true);
    expect(onMessage).not.toHaveBeenCalled();
  });
});
