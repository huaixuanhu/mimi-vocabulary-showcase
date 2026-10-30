# Engineering a vocabulary app with agents

A vocabulary app has to remain trustworthy after the first attractive screen. Words accumulate history. Imports contain mistakes. A connection can fail after a save has already reached the server. An AI response can be useful without being correct enough to keep.

Mimi Vocabulary explores those problems through a focused bilingual learning product. A human owner set the learning goals, selected the visual direction, evaluated behavior, and authorized consequential releases. Coding agents translated accepted slices into implementation, tests, and reviewable changes. This public export makes the resulting code inspectable without publishing the private learning records or operating history.

## Human direction shaped the product

The two learning tracks reflect different tasks: recognizing a word while reading and actively producing it. They keep independent schedules and histories so success in one task does not silently count as success in the other. The UI follows that separation through daily goals, study prompts, and review feedback. The accepted visual language uses warm paper reading surfaces, lavender jelly controls, frosted navigation, and a cat illustration to support daily study without competitive rewards or pressure copy.

The owner also chose explicit review before imports, generated content, and destructive actions. Agents implemented those choices within bounded plans; they did not independently decide to publish learner data, spend without limits, or deploy a new service.

## Three engineering decisions worth inspecting

### 1. Treat an unknown save as unknown

If a request times out or receives a login page, the client cannot safely assume the mutation failed. Replaying it may duplicate an action. The recovery flow records the uncertain request, blocks later conflicting writes, retrieves current state, and asks for an explicit continuation after review. It does not automatically resend the original mutation.

The [recovery regression tests](../src/components/vocabulary/use-vocabulary-data-recovery.test.ts) cover ambiguous responses, retained recovery markers, queued writes, and read-only recovery. They also simulate HTML authentication responses and explicit JSON rejection. These are controlled response fixtures; they do not prove that every real browser redirect or session-expiry sequence behaves identically.

### 2. Keep AI behind a domain boundary

The [AI enrichment module](../src/lib/ai-enrichment/) separates provider calls from editable vocabulary drafts. Structured validation, aligned bilingual examples, cache keys, accounting, and explicit acceptance give the output a defined route into formal data. The [speech module](../src/lib/tts/) has its own provider abstraction and usage controls.

The code keeps budgets and execution switches on the server rather than trusting a browser setting. Separate local fixtures make parts of the experience testable without a paid provider. This reduces the amount of live integration needed during ordinary development, while preserving the need to verify real provider behavior separately.

### 3. Preserve meaning across storage and review changes

The [storage contracts](../src/lib/storage/) and [SQL examples](../db/migrations/) retain learner-scoped vocabulary identity, review profiles, daily plans, and accepted AI lineage. Backup validation checks relationships and versions before planning imports. Review tests exercise separate Recognition and Active state rather than treating every activity as one interchangeable score.

These choices make migrations and recovery reviewable. The public repository includes pure planners and synthetic examples; private database migration and backup operation runners are deliberately omitted.

## How the collaboration stayed reviewable

Work was organized around a verifiable outcome and an explicit boundary: for example, a recovery repair, a provider contract, or a design refinement. Implementation, route/security review, publication/privacy review, and final integration could be assigned to separate agent tracks. Independent agent review within one host improves coverage, but remains distinct from an external security audit or a second host's verification.

The durable records separate intent, implementation, observed tests, human acceptance, and release. The showcase carries a smaller [governance package](../governance/README.md) with the same ownership principle. The [current plan](PLAN.md) owns unfinished work and the [validation record](VALIDATION.md) owns what was actually checked.

## What this portfolio can demonstrate

Readers can run the local product, inspect the domain and integration boundaries, and reproduce the retained tests. They can examine how agent-assisted work was constrained by product decisions, concrete failure cases, and explicit evidence.

The fresh public history does not reconstruct the private project's commit timeline. This case study does not claim fully autonomous development, measured learning gains, a formal security certification, or successful live integration from the local test suite. Cloud deployment and private operational evidence remain outside this showcase.
