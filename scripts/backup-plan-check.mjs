import {
  buildBackupImportPlan,
  createStage5LFixtureBackup,
  createStage6BP1ESchema5FixtureBackup,
  createV2Stage3Schema6FixtureBackup,
} from "./backup-import-plan.mjs";

// Offline validation only: no credentials, database driver, or network imports.
const fixtures = new Map([
  ["--fixture", createStage5LFixtureBackup],
  ["--schema5-fixture", createStage6BP1ESchema5FixtureBackup],
  ["--schema6-fixture", createV2Stage3Schema6FixtureBackup],
]);
const [flag, ...extra] = process.argv.slice(2);
const createFixture = fixtures.get(flag);
if (!createFixture || extra.length > 0) {
  throw new Error("Choose exactly one synthetic fixture: --fixture, --schema5-fixture, or --schema6-fixture");
}
const plan = buildBackupImportPlan(createFixture(), {
  sourceFileName: `${flag.slice(2)}.json`,
  notes: "Synthetic showcase fixture validation; no database access.",
});
console.log(JSON.stringify({ ok: true, mode: "offline-fixture", fixture: flag, counts: plan.counts }, null, 2));
