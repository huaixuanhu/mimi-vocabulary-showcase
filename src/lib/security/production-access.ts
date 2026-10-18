import { NextResponse } from "next/server";
import { verifyCloudflareAccess } from "./cloudflare-access";
import {
  requireAuthenticatedProductionCutover,
  requireProductionBasicAuth,
} from "./production-basic-auth";

type AccessEnvironment = Readonly<Record<string, string | undefined>>;

export function withPrivateAccessHeaders<T extends Response>(response: T): T {
  response.headers.set("cache-control", "no-store");
  const tokens = (response.headers.get("vary") ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  if (!tokens.includes("*")) {
    const seen = new Set<string>();
    const merged = [...tokens, "Authorization", "Cf-Access-Jwt-Assertion"]
      .filter((value) => {
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    response.headers.set("vary", merged.join(", "));
  }
  return response;
}

function accessDenied(status: 401 | 503) {
  return withPrivateAccessHeaders(new NextResponse(null, { status }));
}

export async function requireProductionAccess(
  request: Pick<Request, "headers">,
  env: AccessEnvironment = process.env,
): Promise<NextResponse | null> {
  if (env.VERCEL_ENV !== "production") return null;

  // Missing mode preserves the existing deployed Basic Auth contract. An
  // explicit switch never permits a legacy credential as an alternate gate.
  const mode = env.MIMI_PRODUCTION_AUTH_MODE;
  if (mode === undefined || mode === "basic") {
    const response = requireProductionBasicAuth(request, env);
    return response ? withPrivateAccessHeaders(response) : null;
  }
  if (mode !== "cloudflare") return accessDenied(503);

  const access = await verifyCloudflareAccess(request, env);
  if (access !== "allowed") {
    return accessDenied(access === "unauthorized" ? 401 : 503);
  }

  const response = requireAuthenticatedProductionCutover(env);
  return response ? withPrivateAccessHeaders(response) : null;
}
