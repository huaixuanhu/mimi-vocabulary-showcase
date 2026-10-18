import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";
import {
  V2_CLIENT_CONTRACT_HEADER,
  V2_CLIENT_CONTRACT_VERSION,
} from "./lib/security/v2-client-contract";

const authorization = `Basic ${Buffer.from("mimi:test-password").toString("base64")}`;
const verifyCloudflareAccess = vi.hoisted(() => vi.fn());

vi.mock("@/lib/security/cloudflare-access", () => ({ verifyCloudflareAccess }));

function productionRequest(
  method: string,
  options: { contract?: string; authorization?: string } = {},
) {
  const headers = new Headers();
  if (options.authorization) {
    headers.set("authorization", options.authorization);
  }
  if (options.contract) {
    headers.set(V2_CLIENT_CONTRACT_HEADER, options.contract);
  }
  return new NextRequest("https://mimi.example/api/storage/data", {
    method,
    headers,
  });
}

describe("Production proxy cutover gates", () => {
  beforeEach(() => {
    verifyCloudflareAccess.mockReset().mockResolvedValue("unauthorized");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function configureProduction() {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("MIMI_PRODUCTION_AUTH_MODE", "basic");
    vi.stubEnv("MIMI_BASIC_AUTH_USER", "mimi");
    vi.stubEnv("MIMI_BASIC_AUTH_PASSWORD", "test-password");
    vi.stubEnv("MIMI_PRODUCTION_CUTOVER_MODE", "live");
  }

  it("keeps authentication ahead of the client-version marker", async () => {
    configureProduction();

    expect((await proxy(productionRequest("POST"))).status).toBe(401);
  });

  it("rejects an authenticated stale mutation before its route handler runs", async () => {
    configureProduction();
    const response = await proxy(
      productionRequest("POST", { authorization }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      reason: "client-upgrade-required",
    });
  });

  it.each(["basic", "cloudflare"])("allows the exact V2 Schema 6 mutation after %s admission", async (mode) => {
    configureProduction();
    vi.stubEnv("MIMI_PRODUCTION_AUTH_MODE", mode);
    verifyCloudflareAccess.mockResolvedValue("allowed");
    const response = await proxy(
      productionRequest("POST", {
        authorization: mode === "basic" ? authorization : undefined,
        contract: V2_CLIENT_CONTRACT_VERSION,
      }),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("vary")).toContain("Cf-Access-Jwt-Assertion");
  });

  it("keeps valid credentials and client headers blocked during maintenance", async () => {
    configureProduction();
    vi.stubEnv("MIMI_PRODUCTION_CUTOVER_MODE", "maintenance");
    const response = await proxy(
      productionRequest("POST", {
        authorization,
        contract: V2_CLIENT_CONTRACT_VERSION,
      }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    await expect(response.text()).resolves.toContain("Please try again soon");
  });

  it("documents that only non-writing framework assets bypass the proxy", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ]);
  });

  it("does not let valid Basic credentials bypass a Cloudflare denial", async () => {
    configureProduction();
    vi.stubEnv("MIMI_PRODUCTION_AUTH_MODE", "cloudflare");
    const response = await proxy(productionRequest("POST", { authorization }));

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-middleware-next")).toBeNull();
    expect(verifyCloudflareAccess).toHaveBeenCalledOnce();
  });

  it("still rejects a stale mutation after Cloudflare admission", async () => {
    configureProduction();
    vi.stubEnv("MIMI_PRODUCTION_AUTH_MODE", "cloudflare");
    verifyCloudflareAccess.mockResolvedValue("allowed");
    const response = await proxy(productionRequest("POST"));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ reason: "client-upgrade-required" });
  });

  it("still blocks maintenance after Cloudflare admission", async () => {
    configureProduction();
    vi.stubEnv("MIMI_PRODUCTION_AUTH_MODE", "cloudflare");
    vi.stubEnv("MIMI_PRODUCTION_CUTOVER_MODE", "maintenance");
    verifyCloudflareAccess.mockResolvedValue("allowed");
    const response = await proxy(productionRequest("POST", {
      contract: V2_CLIENT_CONTRACT_VERSION,
    }));

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("x-middleware-next")).toBeNull();
  });
});
