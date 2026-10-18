# Backup planning and SQL examples

The showcase includes versioned backup fixtures and a pure import planner. The planner validates structure, references, profile compatibility, and ID mapping before describing database rows. It does not read a connection string or write to a database.

Run the three supplied synthetic cases:

```bash
npm run backup:dry-run:fixture
npm run backup:dry-run:schema5-fixture
npm run backup:dry-run:schema6-fixture
```

The implementation is [backup-import-plan.mjs](../scripts/backup-import-plan.mjs), with its [tests](../scripts/backup-import-plan.test.mjs). Ordered files in [migrations](migrations/) show the schema evolution used by the retained PostgreSQL repository. The pure [SQL parser](../scripts/sql-migration-body.mjs) can validate migration bodies; no live migration or restore launcher is included.

A real import needs separately reviewed target identity, schema compatibility, backup/restore evidence, transaction behavior, and explicit write authority. Passing fixture checks does not establish any of those live conditions. The [architecture](../ARCHITECTURE.md) and [verification record](../docs/VALIDATION.md) describe the public evidence boundary.
