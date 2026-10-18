# Governance maintenance

This package keeps decisions, evidence, and continued work recoverable across sessions. [contract.json](contract.json) is the canonical role map; it covers this showcase only.

At entry, read [AGENTS.md](../AGENTS.md), the contract, and its current-state owner. Then load the architecture, design, validation, or decision record relevant to the task. Do not load or copy the private operating project's history to fill gaps in this public record.

At closeout, update each affected owner once. Record material choices here, outcomes in the agent log, and observed checks in the validation owner. Preserve the distinction between local preparation, tests, source publication, cloud configuration, and deployment.

Run `npm run governance:check` for structural integrity or `npm run check` for the aggregate local checks. The structural check verifies contract identity and contained owner files. It cannot verify human approval, design quality, privacy, or runtime safety; those require review of the actual evidence.

The local demo operates at Tier 2. Changes to the retained cloud/data/provider capabilities use Tier 3 controls as described in the entrypoint. Authority comes from the accepted task, not this package or an available tool.
