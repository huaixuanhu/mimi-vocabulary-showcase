import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SPEECH_SOURCE_PREFERENCE,
  cancelEnglishSpeech,
  DEFAULT_SPEECH_VOICE_PREFERENCE,
  listEnglishSpeechVoices,
  parseSpeechVoicePreference,
  readSpeechSourcePreference,
  selectSpeechVoice,
  speakEnglishText,
  speakWithDeviceVoice,
  type SpeechUtteranceAdapter,
  type SpeechVoiceAdapter,
} from "./speech-synthesis";

afterEach(() => {
  cancelEnglishSpeech();
  vi.unstubAllGlobals();
});

const voices: SpeechVoiceAdapter[] = [
  {
    voiceURI: "basic-us",
    name: "Basic English",
    lang: "en-US",
    default: true,
    localService: true,
  },
  {
    voiceURI: "natural-au",
    name: "Natural English",
    lang: "en-AU",
    default: false,
    localService: false,
  },
  {
    voiceURI: "mandarin",
    name: "Mandarin",
    lang: "zh-CN",
    default: false,
    localService: true,
  },
];

describe("browser English speech", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [null, "device"],
    ["invalid", "device"],
    ["device", "device"],
    ["cloud", "cloud"],
  ])("resolves stored source %s to %s", (stored, expected) => {
    vi.stubGlobal("window", { localStorage: { getItem: () => stored } });
    expect(DEFAULT_SPEECH_SOURCE_PREFERENCE).toBe("device");
    expect(readSpeechSourcePreference()).toBe(expected);
  });

  it("uses browser speech by default without an application API request", async () => {
    const fetchImpl = vi.fn();
    const speak = vi.fn();
    const result = await speakEnglishText("first run", "recognition", {
      fetchImpl,
      synthesis: { cancel: vi.fn(), speak, getVoices: () => voices },
      createUtterance: (text) => ({ text, lang: "", rate: 1, pitch: 0, voice: null }),
    });
    expect(result).toMatchObject({ status: "spoken", source: "device" });
    expect(speak).toHaveBeenCalledOnce();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("returns a calm unsupported state outside a browser", () => {
    expect(speakWithDeviceVoice("adapt")).toEqual({
      status: "unsupported",
      spokenText: "adapt",
    });
  });

  it("cancels the earlier queue and speaks one configured utterance", () => {
    const cancel = vi.fn();
    const speak = vi.fn();
    const utterance: SpeechUtteranceAdapter = {
      text: "",
      lang: "",
      rate: 1,
      pitch: 0,
      voice: null,
    };

    expect(
      speakWithDeviceVoice("  adapt  ", {
        synthesis: { cancel, speak, getVoices: () => voices },
        createUtterance: (text) => ({ ...utterance, text }),
        voicePreference: DEFAULT_SPEECH_VOICE_PREFERENCE,
      }),
    ).toEqual({
      status: "spoken",
      spokenText: "adapt",
      source: "device",
      voiceName: "Natural English",
      voiceLanguage: "en-AU",
    });
    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledWith({
      text: "adapt",
      lang: "en-AU",
      voice: voices[1],
      rate: 0.9,
      pitch: 1,
    });
  });

  it("uses the strict Cloud route when explicitly selected without a silent device fallback", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(Uint8Array.from([0xff, 0xfb, 0x90, 0x64]), {
        status: 200,
        headers: {
          "content-type": "audio/mpeg",
          "x-mimi-tts-cache": "miss",
          "x-mimi-tts-source": "local-fixture",
          "x-mimi-tts-voice-contract": "fixture-v1",
        },
      }),
    );
    const playAudioBlob = vi.fn(async () => undefined);
    const result = await speakEnglishText("adapt", "recognition", {
      fetchImpl,
      createRequestId: () => "00000000-0000-4000-8000-000000000001",
      playAudioBlob,
      sourcePreference: "cloud",
    });

    expect(result).toMatchObject({
      status: "spoken",
      source: "local-fixture",
      cacheStatus: "miss",
    });
    expect(playAudioBlob).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/tts",
      expect.objectContaining({ method: "POST", credentials: "same-origin" }),
    );
  });

  it("routes device choice only through browser speech", async () => {
    const fetchImpl = vi.fn();
    const cancel = vi.fn();
    const speak = vi.fn();
    const result = await speakEnglishText("device only", "settings-preview", {
      sourcePreference: "device",
      fetchImpl,
      synthesis: { cancel, speak, getVoices: () => voices },
      createUtterance: (text) => ({
        text,
        lang: "",
        rate: 1,
        pitch: 0,
        voice: null,
      }),
    });

    expect(result).toMatchObject({ status: "spoken", source: "device" });
    expect(speak).toHaveBeenCalledOnce();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("cancels an earlier Cloud request before device playback", async () => {
    let cloudSignal: AbortSignal | undefined;
    const pendingCloud = speakEnglishText("pending cloud", "recognition", {
      sourcePreference: "cloud",
      createRequestId: () => "00000000-0000-4000-8000-000000000002",
      fetchImpl: vi.fn((_url, init) => {
        cloudSignal = init?.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          cloudSignal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        });
      }),
    });
    await Promise.resolve();

    const deviceResult = await speakEnglishText(
      "device after cloud",
      "settings-preview",
      {
        sourcePreference: "device",
        synthesis: { cancel: vi.fn(), speak: vi.fn(), getVoices: () => voices },
        createUtterance: (text) => ({
          text,
          lang: "",
          rate: 1,
          pitch: 0,
          voice: null,
        }),
      },
    );

    expect(cloudSignal?.aborted).toBe(true);
    expect(deviceResult).toMatchObject({ status: "spoken", source: "device" });
    expect(await pendingCloud).toMatchObject({ status: "cancelled" });
  });

  it("reports browser autoplay blocking without changing voice source", async () => {
    const result = await speakEnglishText("autoplay policy probe", "recognition", {
      sourcePreference: "cloud",
      createRequestId: () => "00000000-0000-4000-8000-000000000003",
      fetchImpl: vi.fn(async () =>
        new Response(Uint8Array.from([0xff, 0xfb, 0x90, 0x64]), {
          status: 200,
          headers: { "content-type": "audio/mpeg" },
        }),
      ),
      playAudioBlob: vi.fn(async () => {
        const error = new Error("play requires a user gesture");
        error.name = "NotAllowedError";
        throw error;
      }),
    });

    expect(result).toEqual({
      status: "unavailable",
      spokenText: "autoplay policy probe",
      source: "cloud",
      message: "Autoplay was blocked · Tap the sound button",
    });
  });

  it("lets only the current owner stop Cloud audio after a playback handoff", async () => {
    const oldOwner = Symbol("old card");
    const nextOwner = Symbol("next card");
    const audio: { pause: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal("Audio", class {
      pause = vi.fn();
      constructor() { audio.push(this); }
      play = async () => {};
      addEventListener() {}
    });
    const cloud = {
      sourcePreference: "cloud" as const,
      createRequestId: () => "00000000-0000-4000-8000-000000000004",
      fetchImpl: vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "audio/mpeg" },
      })),
    };

    await speakEnglishText("first owner word", "example-word", { ...cloud, playbackOwner: oldOwner });
    await speakEnglishText("second owner word", "recognition", { ...cloud, playbackOwner: nextOwner });
    expect(audio[0].pause).toHaveBeenCalledOnce();
    expect(audio[1].pause).not.toHaveBeenCalled();

    cancelEnglishSpeech(oldOwner);
    expect(audio[1].pause).not.toHaveBeenCalled();
    cancelEnglishSpeech(nextOwner);
    expect(audio[1].pause).toHaveBeenCalledOnce();
  });

  it("ignores a stale owner's cleanup and late response while the next Cloud request is pending", async () => {
    const oldOwner = Symbol("old card");
    const nextOwner = Symbol("next card");
    const requests: { signal: AbortSignal; resolve: (response: Response) => void }[] = [];
    const playAudioBlob = vi.fn(async () => {});
    const cloud = {
      sourcePreference: "cloud" as const,
      createRequestId: () => "00000000-0000-4000-8000-000000000005",
      playAudioBlob,
      // Deliberately ignore abort to verify a late response cannot play.
      fetchImpl: vi.fn((_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((resolve) => requests.push({ signal: init!.signal!, resolve }))),
    };
    const oldRequest = speakEnglishText("stale pending word", "example-word", { ...cloud, playbackOwner: oldOwner });
    const nextRequest = speakEnglishText("current pending word", "recognition", { ...cloud, playbackOwner: nextOwner });
    expect(requests[0].signal.aborted).toBe(true);
    cancelEnglishSpeech(oldOwner);
    expect(requests[1].signal.aborted).toBe(false);

    const response = () => new Response(new Uint8Array([1, 2, 3]), {
      headers: { "content-type": "audio/mpeg" },
    });
    requests[0].resolve(response());
    expect(await oldRequest).toMatchObject({ status: "cancelled" });
    expect(playAudioBlob).not.toHaveBeenCalled();
    requests[1].resolve(response());
    expect(await nextRequest).toMatchObject({ status: "spoken" });
    expect(playAudioBlob).toHaveBeenCalledOnce();
  });

  it("scopes device cancellation while keeping explicit source-change cancellation global", async () => {
    const oldOwner = Symbol("old card");
    const nextOwner = Symbol("next card");
    const cancel = vi.fn();
    const synthesis = { cancel, speak: vi.fn(), getVoices: () => voices };
    vi.stubGlobal("window", { speechSynthesis: synthesis });
    const device = {
      sourcePreference: "device" as const,
      synthesis,
      createUtterance: (text: string) => ({ text, lang: "", rate: 1, pitch: 0, voice: null }),
    };
    await speakEnglishText("earlier device word", "example-word", { ...device, playbackOwner: oldOwner });
    await speakEnglishText("next device word", "recognition", { ...device, playbackOwner: nextOwner });
    cancel.mockClear();

    cancelEnglishSpeech(oldOwner);
    expect(cancel).not.toHaveBeenCalled();
    cancelEnglishSpeech(nextOwner);
    expect(cancel).toHaveBeenCalledOnce();
    cancelEnglishSpeech();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it("lists only English voices and gives natural-labelled voices first", () => {
    expect(listEnglishSpeechVoices(voices).map((voice) => voice.voiceURI)).toEqual([
      "natural-au",
      "basic-us",
    ]);
  });

  it("keeps an exact device choice and falls back safely when it disappears", () => {
    const preference = {
      mode: "voice" as const,
      voiceURI: "basic-us",
      name: "Basic English",
      lang: "en-US",
    };
    expect(selectSpeechVoice(voices, preference)?.voiceURI).toBe("basic-us");
    expect(
      selectSpeechVoice(voices.slice(1), preference)?.voiceURI,
    ).toBe("natural-au");
  });

  it("rejects corrupt or non-English stored preferences", () => {
    expect(parseSpeechVoicePreference("not-json")).toEqual(
      DEFAULT_SPEECH_VOICE_PREFERENCE,
    );
    expect(
      parseSpeechVoicePreference(
        JSON.stringify({
          mode: "voice",
          voiceURI: "mandarin",
          name: "Mandarin",
          lang: "zh-CN",
        }),
      ),
    ).toEqual(DEFAULT_SPEECH_VOICE_PREFERENCE);
  });
});
