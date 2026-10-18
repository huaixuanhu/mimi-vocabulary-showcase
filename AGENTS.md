# AGENTS.md

<!-- Generated/adapted from human-ai-governance v0.8.4 -->

## Entry and collaboration

This repository is a durable public portfolio showcase. Read `governance/README.md`, `governance/contract.json`, and `docs/PLAN.md` before material work, then only the owners needed for the task. `ARCHITECTURE.md` owns the implementation map; `docs/DESIGN.md` owns the visual baseline; `docs/VALIDATION.md` owns test evidence and limits.

- Verify uncertain facts from source. Distinguish planned, implemented, tested, committed, published, and deployed states.
- Plan material changes and reuse valid agreement within its scope. Preserve user changes and existing safeguards.
- Keep one writing host per work slice; parallel agents within that host may own independent slices. Name the executing host and any actual independent review in the agent log.
- Explain engineering decisions plainly. Keep history in the mapped owners rather than private agent memory.
- New child plans must declare Source plan, Derived from, Scope, Non-Scope, and Exit criteria. Use numeric stage identifiers.
- Update an owner when its current claim would become misleading. Do not copy private operating records into this repository.

## Authority and permanent boundaries

The credential-free local demo has Tier 2 operating authority. The retained database, authentication, and paid-provider designs require Tier 3 working controls when changed or enabled. They can affect confidential data and bounded external charges; they confer no trading, payment, or account-administration authority.

Safe local source edits, synthetic fixtures, and local validation may proceed within an accepted plan. Credential access, live provider requests, cloud configuration, database writes or migrations, deployment, publication, history rewrites, automation, and external messages require explicit task authority. Public visibility is not authority to disclose private data or to activate services.

- Keep the default demo local, with cloud AI/TTS disabled and no account identifiers or secrets.
- Use synthetic examples and fixtures. Never import private study data, backups, operational logs, contact details, or credential locations into public history.
- Preserve showcase-specific browser storage isolation. Browser-selected learner IDs are not authentication or confidential tenant isolation.
- Preserve separate learning tracks, explicit acceptance of generated drafts, bilingual example alignment, and uncertain-save recovery without automatic replay.
- Keep original code rights and third-party licenses accurate. Public reading does not imply an open-source license.
- Before paid service changes, disclose supported prices, usage basis, limits, and uncertainty. Cost disclosure does not grant spending permission.

## Work and closeout

Use npm and the lockfile. Prefer a project virtual environment for Python support work if one exists; the routine showcase checks use Node.js.

For material work, record scope, non-scope, affected authority, and the smallest meaningful validation. UI changes preserve `docs/DESIGN.md`; new visual directions require accepted intent and rendered verification. Run `npm run check` as the aggregate gate, which includes the build. Inspect the diff and inventory. Run maintained secret scanning before publication; structural governance checks do not replace privacy review.

Update `CHANGELOG.md`, affected decisions, the agent log, current plan, and validation evidence at closeout. Preserve remaining limits without inventing a pass. A passing local check does not establish live service safety or permission to publish.
