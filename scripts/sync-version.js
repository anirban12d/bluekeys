#!/usr/bin/env node
// Syncs the version from package.json into src/cli/version.ts
// Run automatically via the "version" npm lifecycle hook.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
const version = pkg.version;

const versionFile = join(root, "src", "cli", "version.ts");
const content = `// Auto-generated — do not edit manually.\n// Run \`node scripts/sync-version.js\` or \`npm version\` to update.\nexport const VERSION = "${version}";\n`;

writeFileSync(versionFile, content, "utf-8");
console.log(`Synced version.ts → ${version}`);
