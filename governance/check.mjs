import { readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const contractFile = resolve(root, "governance/contract.json");
const contract = JSON.parse(readFileSync(contractFile, "utf8"));
const requiredRoles = [
  "entrypoint", "maintenance", "decisions", "agent_log", "architecture",
  "changelog", "current_state",
];
function assert(condition, message) {
  if (!condition) throw new Error(`Governance contract: ${message}`);
}
function containedFile(value) {
  assert(typeof value === "string" && value.length > 0 && !isAbsolute(value), "owner paths must be relative");
  const resolved = realpathSync(resolve(root, value));
  const local = relative(root, resolved);
  assert(local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local), "owner escapes project root");
  assert(statSync(resolved).isFile(), `owner is not a file: ${value}`);
  assert(readFileSync(resolved, "utf8").trim().length > 0, `owner is empty: ${value}`);
  return resolved;
}
assert(contract.schema_version === 1, "unsupported schema version");
assert(typeof contract.source_skill_version === "string" && /^\d+\.\d+\.\d+$/.test(contract.source_skill_version), "source skill version is required");
assert(contract.package_root === "governance", "package root must be governance");
assert(Array.isArray(contract.coverage) && contract.coverage.length === 1 && contract.coverage[0] === ".", "this package must cover the showcase root");
assert(contract.design && typeof contract.design.applicable === "boolean", "design applicability is required");
assert(typeof contract.design.reason === "string" && contract.design.reason.trim(), "design reason is required");
assert(contract.roles && typeof contract.roles === "object" && !Array.isArray(contract.roles), "roles must be an object");
const expected = [...requiredRoles, ...(contract.design.applicable ? ["design"] : [])].sort();
assert(JSON.stringify(Object.keys(contract.roles).sort()) === JSON.stringify(expected), "role inventory differs from schema");
assert(contract.roles.entrypoint === "AGENTS.md", "entrypoint must be AGENTS.md");
const owners = Object.fromEntries(expected.map((role) => [role, containedFile(contract.roles[role])]));
for (const role of ["maintenance", "decisions", "agent_log"]) {
  assert(relative(resolve(root, "governance"), owners[role]).split(sep)[0] !== "..", `${role} must stay in governance`);
  assert(owners[role] !== contractFile, `${role} must be separate from the contract`);
  assert(Object.entries(owners).every(([other, path]) => other === role || path !== owners[role]), `${role} must have its own owner`);
}
console.log(`Governance structure passed: ${expected.length} populated owners; public showcase only.`);
console.log("This check does not establish approval, privacy, design acceptance, or runtime safety.");
