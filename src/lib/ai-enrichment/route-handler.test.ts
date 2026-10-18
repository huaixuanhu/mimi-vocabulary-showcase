import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleStage7b1AiMutationPost,
  handleStage7b1AiPost,
  handleStage7b1DisclosurePost,
} from "./route-handler";
import {
  AI_DISCLOSURE_VERSION,
  validatePublicAiDisclosureConfirmationRequest,
  validatePublicAiEnrichmentRequest,
} from "./contract";

const verifyCloudflareAccess = vi.hoisted(() => vi.fn());
vi.mock("@/lib/security/cloudflare-access", () => ({ verifyCloudflareAccess }));

const entryId = "11111111-1111-4111-8111-111111111111";
const enrichmentBody = {
  vocabularyEntryId: entryId,
  feature: "enrichment_v1",
  disclosureVersion: AI_DISCLOSURE_VERSION,
  idempotencyKey: "cloudflare-enrichment-test",
};

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://mimi.example/api/ai/enrichment", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://mimi.example",
      "sec-fetch-site": "same-origin",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("AI route Cloudflare admission", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("MIMI_PRODUCTION_AUTH_MODE", "cloudflare");
    vi.stubEnv("MIMI_PRODUCTION_CUTOVER_MODE", "live");
    verifyCloudflareAccess.mockReset().mockResolvedValue("unauthorized");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("blocks generation, disclosure and mutations before validation or side effects", async () => {
    const validate = vi.fn(() => enrichmentBody);
    const run = vi.fn(async () => ({ status: 200, body: { ok: true } }));
    const confirm = vi.fn(async () => undefined);
    const mutate = vi.fn(async () => ({ ok: true }));
    const responses = [
      await handleStage7b1AiPost(request(enrichmentBody), validate, run),
      await handleStage7b1DisclosurePost(
        request({ vocabularyEntryId: entryId, disclosureVersion: AI_DISCLOSURE_VERSION, confirmed: true }),
        validatePublicAiDisclosureConfirmationRequest,
        confirm,
      ),
      await handleStage7b1AiMutationPost(request(enrichmentBody), validate, mutate),
    ];

    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("set-cookie")).toBeNull();
    }
    expect(validate).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("retains same-origin checks for every AI action after admission", async () => {
    verifyCloudflareAccess.mockResolvedValue("allowed");
    const run = vi.fn(async () => ({ status: 200, body: { ok: true } }));
    const confirm = vi.fn(async () => undefined);
    const mutate = vi.fn(async () => ({ ok: true }));
    const foreignOrigin = { origin: "https://other.example" };
    const responses = [
      await handleStage7b1AiPost(
        request(enrichmentBody, foreignOrigin), validatePublicAiEnrichmentRequest, run,
      ),
      await handleStage7b1DisclosurePost(
        request({ vocabularyEntryId: entryId, disclosureVersion: AI_DISCLOSURE_VERSION, confirmed: true }, foreignOrigin),
        validatePublicAiDisclosureConfirmationRequest,
        confirm,
      ),
      await handleStage7b1AiMutationPost(
        request({}, foreignOrigin), (value) => value, mutate,
      ),
    ];

    for (const response of responses) {
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(run).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("still requires the AI disclosure session before generation after admission", async () => {
    verifyCloudflareAccess.mockResolvedValue("allowed");
    const run = vi.fn(async () => ({ status: 200, body: { ok: true } }));
    const response = await handleStage7b1AiPost(
      request(enrichmentBody), validatePublicAiEnrichmentRequest, run,
    );

    expect(response.status).toBe(428);
    expect(await response.json()).toMatchObject({ reason: "disclosure_required" });
    expect(run).not.toHaveBeenCalled();
  });
});
