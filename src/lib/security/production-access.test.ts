import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireProductionAccess, withPrivateAccessHeaders } from "./production-access";

const accessMock = vi.hoisted(() => vi.fn());
vi.mock("./cloudflare-access", () => ({ verifyCloudflareAccess: accessMock }));

const authorization = `Basic ${Buffer.from("mimi:test-password").toString("base64")}`;
const production = {
  VERCEL_ENV: "production",
  MIMI_BASIC_AUTH_USER: "mimi",
  MIMI_BASIC_AUTH_PASSWORD: "test-password",
  MIMI_PRODUCTION_CUTOVER_MODE: "live",
};

function request(withBasic = false) {
  return new Request("https://mimi.example/api/storage/data", {
    headers: withBasic ? { authorization } : undefined,
  });
}

describe("Production access selection", () => {
  beforeEach(() => accessMock.mockReset());
  afterEach(() => vi.unstubAllEnvs());

  it("preserves Basic Auth without a mode or with explicit basic", async () => {
    for (const mode of [undefined, "basic"]) {
      const env = { ...production, MIMI_PRODUCTION_AUTH_MODE: mode };
      const denied = await requireProductionAccess(request(), env);
      expect(denied?.status).toBe(401);
      expect(denied?.headers.get("www-authenticate")).toContain("Basic");
      expect(await requireProductionAccess(request(true), env)).toBeNull();
    }
    expect(accessMock).not.toHaveBeenCalled();
  });

  it.each(["", " ", " cloudflare", "cloudflare ", "BASIC", "both", "unknown"])(
    "fails closed for invalid explicit mode %j even with valid credentials",
    async (mode) => {
      const response = await requireProductionAccess(request(true), {
        ...production,
        MIMI_PRODUCTION_AUTH_MODE: mode,
      });
      expect(response?.status).toBe(503);
      expect(response?.headers.get("cache-control")).toBe("no-store");
      expect(response?.headers.has("retry-after")).toBe(false);
      expect(accessMock).not.toHaveBeenCalled();
    },
  );

  it("does not change the non-Production entrance", async () => {
    expect(await requireProductionAccess(request(), {
      VERCEL_ENV: "preview",
      MIMI_PRODUCTION_AUTH_MODE: "cloudflare",
    })).toBeNull();
    expect(accessMock).not.toHaveBeenCalled();
  });

  it.each(["unauthorized", "unavailable"])(
    "never falls back to valid Basic credentials after Cloudflare %s",
    async (result) => {
      accessMock.mockResolvedValue(result);
      const response = await requireProductionAccess(request(true), {
        ...production,
        MIMI_PRODUCTION_AUTH_MODE: "cloudflare",
        MIMI_PRODUCTION_CUTOVER_MODE: "maintenance",
      });
      expect(response?.status).toBe(result === "unauthorized" ? 401 : 503);
      expect(response?.headers.has("www-authenticate")).toBe(false);
      expect(response?.headers.has("retry-after")).toBe(false);
      expect(await response?.text()).toBe("");
    },
  );

  it.each([undefined, "unknown", "maintenance"])(
    "keeps successful Cloudflare authentication blocked for cutover %j",
    async (mode) => {
      accessMock.mockResolvedValue("allowed");
      const response = await requireProductionAccess(request(), {
        VERCEL_ENV: "production",
        MIMI_PRODUCTION_AUTH_MODE: "cloudflare",
        MIMI_PRODUCTION_CUTOVER_MODE: mode,
      });
      expect(response?.status).toBe(503);
      expect(response?.headers.get("retry-after")).toBe("60");
      expect(await response?.text()).toContain("A short update is in progress");
    },
  );

  it.each(["live", "schema6-readiness"])(
    "allows verified Cloudflare access through to the independent %s guards",
    async (mode) => {
      accessMock.mockResolvedValue("allowed");
      expect(await requireProductionAccess(request(), {
        VERCEL_ENV: "production",
        MIMI_PRODUCTION_AUTH_MODE: "cloudflare",
        MIMI_PRODUCTION_CUTOVER_MODE: mode,
      })).toBeNull();
    },
  );

  it("reads its default configuration from the server environment", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("MIMI_PRODUCTION_AUTH_MODE", "cloudflare");
    vi.stubEnv("MIMI_PRODUCTION_CUTOVER_MODE", "live");
    accessMock.mockResolvedValue("allowed");
    const incoming = request();
    expect(await requireProductionAccess(incoming)).toBeNull();
    expect(accessMock).toHaveBeenCalledWith(incoming, process.env);
  });
});

describe("private access response headers", () => {
  it("preserves response identity and framework Vary tokens while preventing storage", () => {
    const response = new Response("private", {
      headers: {
        "cache-control": "public, max-age=600",
        vary: "RSC, Next-Router-State-Tree, Origin, authorization, AUTHORIZATION",
      },
    });
    expect(withPrivateAccessHeaders(response)).toBe(response);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("vary")).toBe(
      "RSC, Next-Router-State-Tree, Origin, authorization, Cf-Access-Jwt-Assertion",
    );
  });

  it("keeps an existing wildcard Vary intact", () => {
    const response = new Response(null, { headers: { vary: "*" } });
    withPrivateAccessHeaders(response);
    expect(response.headers.get("vary")).toBe("*");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
