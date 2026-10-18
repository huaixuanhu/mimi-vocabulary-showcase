# Verification record

This file records evidence for the public showcase. Test results from the private operating repository are not automatically transferred to this modified export.

## Reproduce locally

```bash
npm ci
npm run check
```

`check` runs the governance structure check, lint, type checking, the retained test suite, three synthetic backup-plan checks, and the application build. The backup commands only plan fixture imports; they do not connect to a database or apply SQL.

## Current evidence

Observed on 2026-10-19 in an independent macOS checkout with Node.js 25.3.0, npm 11.7.0, Next.js 16.3.8, and an environment without application credentials:

| Check | Observed result |
| --- | --- |
| Fresh `npm ci --ignore-scripts` | Completed from the committed lockfile; dependency lifecycle scripts were disabled. |
| `npm run check` | Passed: governance structure, ESLint, TypeScript, tests, three fixture planners, and the default Turbopack build. |
| Retained tests | 772 passed, 1 skipped; 105 test files passed, 1 skipped. The skipped file requires a separately configured PostgreSQL database. |
| Backup planners | Schema 3, 5, and 6 synthetic fixtures passed; no database connection or import was performed. |
| Browser walkthrough | Imported all 12 synthetic entries, observed 6 Recognition and 6 Active words, set a new-learning goal, revealed an answer, saved one rating, and retained the result after reload. |
| Patched-build smoke | After replacing the initial local build with Next.js 16.3.8, the same browser showed 12 words, 1 in review, and the two independent tracks. |
| Voice default | A fresh local session selected device voice. No cloud speech quality or real provider request is claimed. |
| Publication review | 315 curated files reviewed with Gitleaks 8.30.1 and targeted identifier checks; six binary assets also received bounded metadata/printable-string review. No confirmed credential was identified. One scanner match is a test-only signing fixture in `opaque-token.test.ts`. |

The browser evidence is functional, without screenshots, as requested by the owner. Checks used local/synthetic state and do not transfer private production evidence to this repository.

## Dependency advisory status

The showcase updates Next.js and its ESLint configuration to 16.3.8, Sharp to 0.35.5, `source-map-js` to 1.2.2, and the two `brace-expansion` lines to 1.1.21 / 5.0.12. The fresh installation and aggregate check above used the patched lockfile.

At the review date, `npm audit --omit=dev` reported **0 known vulnerabilities**. The complete audit still reported **5 high-severity package entries**, all tracing to one unpatched [`braces@3.0.3` denial-of-service advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) through the ESLint tooling chain. The issue concerns deeply nested, untrusted glob patterns. No application import or HTTP feature accepting such patterns was identified. Do not run untrusted repository tooling; retain and revisit the advisory instead of forcing an incompatible framework downgrade. An audit result is a point-in-time package report, not a security certification.

## Coverage limits

- The default run has no database credentials. Gated PostgreSQL integration tests may be skipped; report that count rather than counting them as passed.
- Provider tests use fixtures/mocks. No live Gemini or cloud speech request is established by these checks.
- Authentication and uncertain-save tests simulate requests and responses. They do not establish a deployed firewall, a real session's elapsed lifetime, or all browser redirect behavior.
- Private deployment, database operation, backup custody, and provider-smoke runners and their dedicated tests are omitted. They are not part of the public test count.
- A synthetic browser walkthrough supports the observed viewport and actions only. It is not a device survey or an accessibility certification. Screenshots were explicitly deferred; no screenshot evidence is claimed.
- Secret scanning and targeted privacy review reduce publication risk; neither proves the absence of every secret, personal detail, or rights issue.

Retain useful failure diagnostics without credentials or private data. Update this owner when relevant source, configuration, fixtures, or validation conditions change.
