# Mimi Vocabulary

<img src="public/brand/mimi-cats.png" alt="Mimi Vocabulary cat brand illustration" width="192" />

A calm English–Chinese vocabulary workspace, built through human-led, agent-assisted engineering.

Mimi Vocabulary combines two kinds of learning: recognizing a word when reading, and producing it through recall, spelling, and dictation. This repository presents the application, its tests, and the engineering decisions behind it as a **runnable local showcase**. It runs with browser storage and includes synthetic examples to import; it has no connection to the private application's database or provider accounts.

**Start here:** [Run locally](#run-locally) · [Engineering case study](docs/CASE_STUDY.md) · [Architecture](ARCHITECTURE.md) · [Verification record](docs/VALIDATION.md)

## What you can explore

- **A daily study workflow.** Separate Recognition and Active tracks, independent review schedules, daily goals, and a focused one-card-at-a-time study view.
- **A practical vocabulary library.** English–Chinese example pairs, editable imports, duplicate detection, search, archive, and explicit confirmations for deletion.
- **Recovery-aware persistence.** Browser storage for the demo, a repository boundary for PostgreSQL, versioned backups, and tests for uncertain remote save outcomes.
- **AI integration with limits.** Editable draft generation, provider adapters, caching, accounting, concurrency limits, and kill switches. Local fixture responses demonstrate parts of the flow without a paid AI request.
- **A maintained visual system.** Deep sage and warm ivory, a cat illustration, light/dark themes, responsive navigation, and quiet interaction feedback.

The interesting engineering is in the boundaries between these features. Changing a learner is not authentication. A timeout does not prove a save failed. A generated draft does not become study data until the user accepts it. The [case study](docs/CASE_STUDY.md) follows those decisions into the source and tests.

## Run locally

Use Node.js 24 or newer and npm. Install from the lockfile:

```bash
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open `http://127.0.0.1:3000`. No credentials or environment file are required for the default local mode. Use a clean shell without unrelated cloud variables; [`.env.example`](.env.example) documents the safe local settings.

To populate the app, open **Add Words** → **Batch import**. Paste the contents of [docs/demo-vocabulary.json](docs/demo-vocabulary.json), select **Preview words**, review the entries, and choose **Save selected**. In a fresh workspace, this synthetic sample adds 12 bilingual entries: six Recognition words and six Active words.

To try a learning session, open **Study**, set the Recognition new-learning goal to **2**, choose **Save today’s goals**, then open **New Learning**. The initial new-word goal is zero, so importing words alone does not populate this session. Explore **Library** and **Settings**; use **Export** if you want a copy of your local session.

Data lives in this browser's storage, under a showcase-specific namespace. It does not sync across devices and can be lost if browser data is cleared. Use synthetic data while evaluating the app. The first run uses browser/device speech where available; it makes no application paid-provider request by default. The selected voice may still depend on browser or operating-system services, so this is not a guarantee of offline speech. The cloud speech option remains closed without complete configuration.

Dependency installation and the build may need internet access, including font retrieval. “Local demo” describes the application data and provider configuration; it does not claim an entirely offline installation process.

## Read the engineering

| Question | Entry point |
| --- | --- |
| How are the two review tracks kept separate? | [Review engine](src/lib/review/), [daily study engine](src/lib/daily-study/) |
| How does a save recover without silently repeating a write? | [Recovery hook and regression tests](src/components/vocabulary/use-vocabulary-data-recovery.test.ts) |
| How are AI drafts validated and bounded? | [AI enrichment](src/lib/ai-enrichment/), [TTS](src/lib/tts/) |
| Where do local and database persistence meet? | [Storage contracts](src/lib/storage/), [architecture](ARCHITECTURE.md) |
| How are decisions and review evidence kept coherent? | [Case study](docs/CASE_STUDY.md), [governance package](governance/README.md) |

## Verify the showcase

```bash
npm run check
```

The aggregate check covers governance structure, lint, TypeScript, tests, synthetic backup planning, and the application build. The [verification record](docs/VALIDATION.md) owns the observed results and limits. Database integration tests require a separately configured database and are not evidence of a live database check in the default local run. Private deployment, provider-smoke, and backup-operation runners and their dedicated tests are intentionally excluded from this export.

## Repository scope

This is a curated export with a fresh public history. Its first commit is a publication starting point, not a reconstruction of the private project's development commits. The private operating repository, study records, credentials, deployment identities, and operational evidence remain separate. There is no hosted demo link or automatic deployment workflow.

Cloud-facing adapters, authentication validation, and SQL schema examples remain available for reading. Connecting them to services requires a separate configuration and security review; this repository is not a deployment recipe for an authenticated multi-user service.

## Rights

This is public portfolio source with **all rights reserved**, subject to the permissions in [LICENSE.md](LICENSE.md). It is not released under an open-source license. Third-party fonts, sounds, and dependencies retain their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
