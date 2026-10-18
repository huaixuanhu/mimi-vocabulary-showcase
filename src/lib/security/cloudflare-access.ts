import { createRemoteJWKSet, errors, jwtVerify } from "jose";

type AccessEnvironment = Readonly<Record<string, string | undefined>>;
type RequestWithHeaders = Pick<Request, "headers">;
export type CloudflareAccessResult = "allowed" | "unauthorized" | "unavailable";

const TEAM_ORIGIN_PATTERN =
  /^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.cloudflareaccess\.com\/?$/u;

// One configured team per runtime. jose owns key caching, refresh coalescing,
// rotation cooldown and the fetch deadline; token headers cannot choose a URL.
let trustedKeys: {
  issuer: string;
  resolve: ReturnType<typeof createRemoteJWKSet>;
} | undefined;

function configuredAccess(env: AccessEnvironment) {
  const teamDomain = env.MIMI_CF_ACCESS_TEAM_DOMAIN;
  const audience = env.MIMI_CF_ACCESS_AUD;
  if (
    !teamDomain || !TEAM_ORIGIN_PATTERN.test(teamDomain) ||
    !audience || /\s/u.test(audience)
  ) {
    return null;
  }
  return { issuer: new URL(teamDomain).origin, audience };
}

function keysForIssuer(issuer: string) {
  if (trustedKeys?.issuer !== issuer) {
    trustedKeys = {
      issuer,
      resolve: createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`), {
        timeoutDuration: 5_000,
        cooldownDuration: 30_000,
        cacheMaxAge: 10 * 60_000,
      }),
    };
  }
  return trustedKeys.resolve;
}

function invalidAssertion(error: unknown) {
  return error instanceof errors.JWTExpired ||
    error instanceof errors.JWTClaimValidationFailed ||
    error instanceof errors.JWTInvalid ||
    error instanceof errors.JWSInvalid ||
    error instanceof errors.JWSSignatureVerificationFailed ||
    error instanceof errors.JOSEAlgNotAllowed ||
    error instanceof errors.JOSENotSupported ||
    error instanceof errors.JWKSNoMatchingKey;
}

export async function verifyCloudflareAccess(
  request: RequestWithHeaders,
  env: AccessEnvironment = process.env,
): Promise<CloudflareAccessResult> {
  const configuration = configuredAccess(env);
  if (!configuration) return "unavailable";

  const assertion = request.headers.get("cf-access-jwt-assertion");
  if (!assertion) return "unauthorized";

  try {
    const { payload } = await jwtVerify(assertion, keysForIssuer(configuration.issuer), {
      algorithms: ["RS256"],
      issuer: configuration.issuer,
      audience: configuration.audience,
      requiredClaims: ["iss", "aud", "exp", "sub"],
      clockTolerance: 0,
    });
    return typeof payload.sub === "string" && payload.sub.trim().length > 0
      ? "allowed"
      : "unauthorized";
  } catch (error) {
    // Do not disclose token contents, provider errors or identity details.
    return invalidAssertion(error) ? "unauthorized" : "unavailable";
  }
}
