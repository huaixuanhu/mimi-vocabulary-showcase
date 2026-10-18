# Design baseline

Design revision: `1.0.0` (showcase baseline; later minor revisions add compatible conventions, major revisions replace them).

Scope: the retained vocabulary application on desktop and mobile.

Source lineage: the private application's accepted Stage 7 visual design and its later dual-track, study, Library, and recovery refinements. The owner authorized preserving that design in this public showcase. Private source documents, paths, identifiers, and acceptance records are intentionally not republished.

Acceptance: existing product intent retained under the showcase authorization; no replacement visual direction introduced. Public-copy functional verification is recorded in [VALIDATION.md](VALIDATION.md). Screenshots are deferred at the owner's request ahead of a separately planned UI redesign. Source inspection and functional checks do not establish fresh visual acceptance.

Supersedes: none in this public repository. This revision starts the public design record; it does not invent earlier public revisions.

## Intent and composition

The recurring task is a calm daily study session. Home should make the current learner, learning goals, and next study action legible. Study gives one word or prompt primary attention. Library and Import may be denser because they support comparison and editing, while preserving clear selection and commit boundaries.

Desktop uses a left navigation rail and a dominant central content area. Mobile uses bottom navigation and task-focused routes. Cards group a meaningful task or state; the interface should avoid an administrative dashboard's density. New decoration must not compete with the vocabulary or the next action.

## Visual roles

- Deep sage establishes the environment; ivory and parchment surfaces hold readable content. Light mode preserves the same hierarchy with lighter sage surroundings.
- Geist carries Latin interface text; the bundled ChillRound font supports rounded Chinese text; word display uses its existing serif treatment. Font licenses remain with the assets.
- The cat illustration identifies the app and provides a Home action. It is a signature element, not a repeated background motif.
- Muted amber and rose communicate caution and errors with explanatory text. Color alone must not carry meaning.
- Quiet hover, press, and reveal feedback connects actions to results. Respect reduced-motion preferences and keep sound under explicit user controls.

Exact colors, fonts, and timings are owned by [globals.css](../src/app/globals.css); component behavior is owned by [src/components](../src/components/). Do not maintain a second token table here.

## Interaction rules

Keep visible keyboard focus, labelled controls, disabled pending actions, and clear empty/error states. Preserve responsive dialog behavior and focus restoration. Destructive actions retain the explicit item list and confirmation steps. Unknown-save recovery keeps the outcome uncertain in its copy and requires review before continuation.

Recognition and Active are independent learning contexts. AI drafts remain editable before acceptance. Ordinary interface copy is concise English; Chinese or bilingual explanations remain appropriate for data loss, recovery, privacy, and external AI transmission.

Allowed flexibility includes spacing adjustments for real content, responsive wrapping, and repairs that restore these rules. A new navigation model, visual theme, or confirmation pattern requires a recorded design decision and affected rendered checks. Future visual evidence must identify the observed synthetic state and viewport; it cannot establish usability outcomes or historical approval by itself.
