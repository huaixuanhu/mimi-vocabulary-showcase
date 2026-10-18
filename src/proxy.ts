import { type NextRequest, NextResponse } from "next/server";
import { requireProductionAccess, withPrivateAccessHeaders } from "@/lib/security/production-access";
import { requireV2ProductionClientContract } from "@/lib/security/production-client-contract";

export async function proxy(request: NextRequest) {
  const response = (
    (await requireProductionAccess(request)) ??
    requireV2ProductionClientContract(request) ??
    NextResponse.next()
  );
  return process.env.VERCEL_ENV === "production"
    ? withPrivateAccessHeaders(response)
    : response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
