# Design baseline

Design revision: `2.0.0-organic-jelly` (major revisions replace visual conventions; minor revisions add compatible conventions).

Scope: the showcase's existing desktop and mobile learning pages, forms, navigation, and dialogs, in light and dark themes.

Source lineage: the owner's accepted Gentle Organic UI, including the calmer light-theme refinement. The owner explicitly requested this synchronization on 2026-10-31 and asked for README screenshots using synthetic data. This public revision describes the adopted design without copying private operating documents or deployment evidence.

Acceptance: visual direction delegated by the owner's synchronization request. Implementation and rendered verification are tracked in [VALIDATION.md](VALIDATION.md); no separate usability study or physical-phone qualification is implied.

Supersedes: showcase revision `1.0.0`, which retained the older sage theme. Its rationale and screenshot deferral remain recoverable in Git and the earlier decisions. The current request replaces that screenshot deferral.

## Intent and composition

The recurring task is a calm daily study session. Home introduces the two learning tracks and their next actions. Study gives a single word and its answer priority; Library and Import support denser comparison and editing. Desktop retains a navigation rail; mobile retains bottom navigation and More. The structure and learning rules remain intact.

## Visual roles

- Warm paper canvas and solid reading cards separate long-form content from controls. A single static lavender glow replaces moving scenery. Dark mode uses charcoal and muted lavender.
- Jelly buttons have a translucent edge, shaded core, restrained upper highlight, and slight rose transmission. Primary actions use lavender; secondary actions use warm neutrals. Danger actions retain explanatory labels.
- Frost belongs to navigation, segmented trays, and small icon tools. Selected destinations use an opaque lavender indicator. Content cards and dialog bodies stay solid and readable.
- Geist carries Latin interface text and headings, Georgia carries the large word, and ChillRoundF carries rounded Chinese text. Font licenses remain with the assets.
- The cat illustration remains the Home identifier. Four rating choices run from orange-red through amber and pale yellow to green, with fixed order and visible text; color is supplementary.
- Light is the default for fresh demo sessions. A saved showcase-specific theme choice remains respected. The calmer palette reduces near-white glare and strengthens supporting text and borders.

Exact tokens are owned by [globals.css](../src/app/globals.css); shared timing is owned by [motion-primitives.tsx](../src/components/ui/motion-primitives.tsx). No second token table is maintained here.

## Interaction and motion

Keep visible keyboard focus, labelled controls, disabled pending actions, empty/error feedback, and focus restoration after dialogs. Rating actions retain their labels and keyboard behavior. Destructive operations retain both confirmations; unknown-save recovery retains explicit uncertainty and never automatically replays a write.

Answer disclosure is brief; card transitions preserve context. Speech cleanup belongs to its initiating playback so a departing card cannot stop the next card's audio. Backgrounds remain static at every viewport. Reduced-motion paths use static selection indicators and short fades without positional animation; unsupported blur receives solid fallbacks.

Recognition and Active remain independent learning contexts. AI drafts require acceptance. English UI copy remains concise, while privacy, data-loss, recovery, and external-transmission notices retain their bilingual explanations. Showcase browser namespaces and the device-speech default are preserved.

## Representative renders and limits

README links the light Home, revealed Recognition study card, dark Library, and mobile study captures under [screenshots](screenshots/). Every capture uses the bundled synthetic sample in local mode. [VALIDATION.md](VALIDATION.md) identifies the exercised routes, viewport sizes, checks, and remaining limits. Screenshots demonstrate the captured state and do not establish comfort over long sessions or behavior on every device.
