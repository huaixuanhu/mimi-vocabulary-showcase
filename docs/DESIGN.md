# Design baseline

Design revision: `2.1.0-mist-jelly` (major revisions replace visual conventions; minor revisions add compatible conventions).

Scope: the showcase's existing desktop and mobile learning pages, forms, navigation, and dialogs, in light and dark themes.

Source lineage: the owner's accepted mist-garden palette applied to the existing Gentle Organic jelly materials. The owner requested that the showcase be brought up to date on 2026-11-05; that scope includes refreshing the existing synthetic README captures. This public revision describes the adopted design without copying private operating documents or deployment evidence.

Acceptance: visual direction delegated by the owner's synchronization request. Implementation and rendered verification are tracked in [VALIDATION.md](VALIDATION.md); no separate usability study or physical-phone qualification is implied.

Supersedes: showcase revision `2.0.0-organic-jelly` for color and light-background distribution. Its materials, typography, rating scale, layout, motion, and learning behavior remain the baseline. The new minor revision records this compatible palette evolution; earlier design decisions remain recoverable in Git.

## Intent and composition

The recurring task is a calm daily study session. Home introduces the two learning tracks and their next actions. Study gives a single word and its answer priority; Library and Import support denser comparison and editing. Desktop retains a navigation rail; mobile retains bottom navigation and More. The structure and learning rules remain intact.

## Visual roles

- A subdued sage canvas and solid reading cards separate content from controls. Four irregular static green, mist-blue, peach, and green fields provide light-theme atmosphere. Dark mode uses deep green surfaces and one quiet glow; the four fields are hidden.
- Jelly buttons have a translucent edge, shaded core, restrained upper highlight, and warm peach transmission. Primary actions use teal; secondary actions use warm neutrals. Danger actions retain explanatory labels.
- Frost belongs to navigation, segmented trays, and small icon tools. Selected destinations use an opaque sage indicator. Content cards and dialog bodies stay solid and readable.
- Geist carries Latin interface text and headings, Georgia carries the large word, and ChillRoundF carries rounded Chinese text. Font licenses remain with the assets.
- The cat illustration remains the Home identifier. Four rating choices run from orange-red through amber and pale yellow to green, with fixed order and visible text; color is supplementary.
- Light is the default for fresh demo sessions. A saved showcase-specific theme choice remains respected. The calmer palette reduces near-white glare and strengthens supporting text and borders.

Exact tokens are owned by [globals.css](../src/app/globals.css); shared timing is owned by [motion-primitives.tsx](../src/components/ui/motion-primitives.tsx). No second token table is maintained here.

## Interaction and motion

Light-theme rating focus retains each rating hue and mixes in 35% label ink for a clearer outline against the restored fields; dark-theme focus keeps its existing 15% ink. Rating fills, borders, and labels are unchanged. Keep visible keyboard focus, labelled controls, disabled pending actions, empty/error feedback, and focus restoration after dialogs. Rating actions retain their labels and keyboard behavior. Destructive operations retain both confirmations; unknown-save recovery retains explicit uncertainty and never automatically replays a write.

Answer disclosure is brief; card transitions preserve context. Speech cleanup belongs to its initiating playback so a departing card cannot stop the next card's audio. Backgrounds remain static at every viewport. Reduced-motion paths use static selection indicators and short fades without positional animation; unsupported blur receives solid fallbacks.

Recognition and Active remain independent learning contexts. AI drafts require acceptance. English UI copy remains concise, while privacy, data-loss, recovery, and external-transmission notices retain their bilingual explanations. Showcase browser namespaces and the device-speech default are preserved.

## Representative renders and limits

README links the light Home, revealed Recognition study card, dark Library, and mobile study captures under [screenshots](screenshots/). Every capture uses the bundled synthetic sample in local mode. [VALIDATION.md](VALIDATION.md) identifies the exercised routes, viewport sizes, checks, and remaining limits. Screenshots demonstrate the captured state and do not establish comfort over long sessions or behavior on every device.
