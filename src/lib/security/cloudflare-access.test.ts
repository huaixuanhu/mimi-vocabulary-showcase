import { exportJWK, generateKeyPair, SignJWT, type JWTPayload } from "jose";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const issuer = "https://mimi-test.cloudflareaccess.com";
const audience = "mimi-production-audience";
const configuration = {
  MIMI_CF_ACCESS_TEAM_DOMAIN: issuer,
  MIMI_CF_ACCESS_AUD: audience,
};
let signingKey: CryptoKey;
let otherSigningKey: CryptoKey;
let publicJwk: Awaited<ReturnType<typeof exportJWK>>;
let rotatedJwk: Awaited<ReturnType<typeof exportJWK>>;
let verifyAccess: typeof import("./cloudflare-access").verifyCloudflareAccess;
let fetchKeys: ReturnType<typeof vi.fn>;

async function token(overrides: JWTPayload = {}, key = signingKey, kid = "trusted-key") {
  return new SignJWT({
    iss: issuer,
    aud: [audience],
    sub: "synthetic-user",
    exp: Math.floor(Date.now() / 1_000) + 300,
    ...overrides,
  }).setProtectedHeader({ alg: "RS256", kid }).sign(key);
}

function request(assertion?: string, extraHeaders: Record<string, string> = {}) {
  return new Request("https://mimi.example/api/storage/data", {
    headers: {
      ...(assertion ? { "cf-access-jwt-assertion": assertion } : {}),
      ...extraHeaders,
    },
  });
}

describe("Cloudflare Access signed assertion", () => {
  beforeAll(async () => {
    const trusted = await generateKeyPair("RS256");
    const other = await generateKeyPair("RS256");
    signingKey = trusted.privateKey;
    otherSigningKey = other.privateKey;
    publicJwk = { ...await exportJWK(trusted.publicKey), kid: "trusted-key", alg: "RS256" };
    rotatedJwk = { ...await exportJWK(other.publicKey), kid: "rotated-key", alg: "RS256" };
  });

  beforeEach(async () => {
    vi.resetModules();
    verifyAccess = (await import("./cloudflare-access")).verifyCloudflareAccess;
    fetchKeys = vi.fn(async () => Response.json({ keys: [publicJwk] }));
    vi.stubGlobal("fetch", fetchKeys);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("validates a signed user assertion using only the configured team's public keys", async () => {
    const incoming = request(await token());
    expect(await verifyAccess(incoming, configuration)).toBe("allowed");
    expect(await verifyAccess(incoming, configuration)).toBe("allowed");
    expect(fetchKeys).toHaveBeenCalledOnce();
    expect(fetchKeys).toHaveBeenCalledWith(`${issuer}/cdn-cgi/access/certs`, expect.objectContaining({
      method: "GET", redirect: "manual", signal: expect.any(AbortSignal),
    }));
  });

  it("accepts a trailing origin slash without changing the expected issuer", async () => {
    expect(await verifyAccess(request(await token()), {
      ...configuration, MIMI_CF_ACCESS_TEAM_DOMAIN: `${issuer}/`,
    })).toBe("allowed");
  });

  it.each([
    undefined, "", "mimi-test.cloudflareaccess.com", "http://mimi-test.cloudflareaccess.com",
    "https://cloudflareaccess.com", "https://mimi.example", "https://mimi-test.cloudflareaccess.com.evil.example",
    "https://mimi-test.cloudflareaccess.com:443", "https://user@mimi-test.cloudflareaccess.com",
    "https://mimi-test.cloudflareaccess.com/path", "https://mimi-test.cloudflareaccess.com?x=1",
    "https://mimi-test.cloudflareaccess.com#fragment", " https://mimi-test.cloudflareaccess.com",
  ])("rejects unsupported configured team origin %j before fetching keys", async (teamDomain) => {
    expect(await verifyAccess(request(await token()), {
      ...configuration, MIMI_CF_ACCESS_TEAM_DOMAIN: teamDomain,
    })).toBe("unavailable");
    expect(fetchKeys).not.toHaveBeenCalled();
  });

  it.each([undefined, "", " ", " audience", "two audiences"])(
    "rejects missing or ambiguous audience %j before fetching keys",
    async (value) => {
      expect(await verifyAccess(request(await token()), {
        ...configuration, MIMI_CF_ACCESS_AUD: value,
      })).toBe("unavailable");
      expect(fetchKeys).not.toHaveBeenCalled();
    },
  );

  it("does not accept identity, cookie or Basic headers instead of a signed assertion", async () => {
    expect(await verifyAccess(request(undefined, {
      "cf-access-authenticated-user-email": "synthetic@example.invalid",
      authorization: "Basic c3ludGhldGljOnRlc3Q=",
      cookie: `CF_Authorization=${await token()}`,
    }), configuration)).toBe("unauthorized");
    expect(fetchKeys).not.toHaveBeenCalled();
  });

  it.each([
    { iss: undefined }, { iss: "https://other.cloudflareaccess.com" },
    { aud: undefined }, { aud: "another-private-project" },
    { exp: undefined }, { exp: 1 },
    { sub: undefined }, { sub: "" }, { sub: "   " },
  ])("rejects missing, wrong or expired required claims %j", async (claims) => {
    expect(await verifyAccess(request(await token(claims)), configuration)).toBe("unauthorized");
  });

  it("rejects a token before its not-before time", async () => {
    const assertion = await token({ nbf: Math.floor(Date.now() / 1_000) + 120 });
    expect(await verifyAccess(request(assertion), configuration)).toBe("unauthorized");
  });

  it("rejects a wrong signature and a changed payload", async () => {
    expect(await verifyAccess(request(await token({}, otherSigningKey)), configuration)).toBe("unauthorized");
    const [header, , signature] = (await token()).split(".");
    const changed = Buffer.from(JSON.stringify({ iss: issuer, aud: audience, sub: "attacker", exp: 4_000_000_000 }))
      .toString("base64url");
    expect(await verifyAccess(request(`${header}.${changed}.${signature}`), configuration)).toBe("unauthorized");
  });

  it("rejects missing signing keys without repeated fetches during the cooldown", async () => {
    expect(await verifyAccess(request(await token()), configuration)).toBe("allowed");
    const unknownKey = request(await token({}, otherSigningKey, "unknown-key"));
    expect(await verifyAccess(unknownKey, configuration)).toBe("unauthorized");
    expect(await verifyAccess(unknownKey, configuration)).toBe("unauthorized");
    expect(fetchKeys).toHaveBeenCalledOnce();
  });

  it("refreshes the trusted key set for a rotated key after the cooldown", async () => {
    expect(await verifyAccess(request(await token()), configuration)).toBe("allowed");
    const rotated = request(await token({}, otherSigningKey, "rotated-key"));
    expect(await verifyAccess(rotated, configuration)).toBe("unauthorized");
    fetchKeys.mockResolvedValue(Response.json({ keys: [rotatedJwk] }));
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 31_000);
    expect(await verifyAccess(rotated, configuration)).toBe("allowed");
    expect(fetchKeys).toHaveBeenCalledTimes(2);
  });

  it("ignores attacker-provided key locations", async () => {
    const assertion = await new SignJWT({
      iss: issuer, aud: audience, sub: "synthetic-user", exp: Math.floor(Date.now() / 1_000) + 300,
    }).setProtectedHeader({
      alg: "RS256", kid: "trusted-key", jku: "https://attacker.invalid/keys",
    }).sign(otherSigningKey);
    expect(await verifyAccess(request(assertion), configuration)).toBe("unauthorized");
    expect(fetchKeys.mock.calls.every(([url]) => url === `${issuer}/cdn-cgi/access/certs`)).toBe(true);
  });

  it("rejects other algorithms and malformed JWTs without fetching keys", async () => {
    const assertion = await new SignJWT({ iss: issuer, aud: audience, sub: "synthetic-user", exp: 4_000_000_000 })
      .setProtectedHeader({ alg: "HS256" }).sign(new Uint8Array(32));
    expect(await verifyAccess(request(assertion), configuration)).toBe("unauthorized");
    expect(await verifyAccess(request("not-a-jwt"), configuration)).toBe("unauthorized");
    expect(fetchKeys).not.toHaveBeenCalled();
  });

  it.each(["network", "timeout", "invalid-json", "redirect"])(
    "fails closed when public-key retrieval has a %s failure",
    async (failure) => {
      fetchKeys.mockImplementation(async () => {
        if (failure === "timeout") throw new DOMException("synthetic timeout", "TimeoutError");
        if (failure === "invalid-json") return new Response("not-json", { status: 200 });
        if (failure === "redirect") return new Response(null, { status: 302, headers: { location: "https://attacker.invalid" } });
        throw new Error("synthetic offline failure");
      });
      expect(await verifyAccess(request(await token()), configuration)).toBe("unavailable");
    },
  );
});
