import { execSync } from "node:child_process";
import { VERSION } from "./version.js";
import { checkUpdateCommand } from "./updateCheck.js";

export { VERSION };

const HELP_TEXT = `
bluekeys v${VERSION} — terminal typing test

Usage:
  bluekeys                        Launch interactive menu
  bluekeys [options]              Start a test directly
  bluekeys upgrade                Upgrade to the latest version
  bluekeys check-update           Check if a new version is available
  bluekeys --version              Show version
  bluekeys --help                 Show this help

Options:
  -m, --mode <mode>               Mode: time | words | quote | code | cli | zen | custom
  -t, --time <seconds>            Time limit (for time mode)
  -w, --words <count>             Word count (for words mode)
  -l, --language <lang>           Language: english, french, german, spanish, ...
      --punctuation                Enable punctuation
      --no-punctuation             Disable punctuation
      --numbers                    Enable numbers
      --no-numbers                 Disable numbers
      --difficulty <level>         Difficulty: normal | expert | master
      --theme <name>               Theme name
      --quote-length <0-3>         Quote length: 0=short, 1=medium, 2=long, 3=thicc
      --code-language <lang>       Code language: python, javascript, go, rust
      --cli-category <cat>         CLI category: general, git, docker, npm, linux

Examples:
  bluekeys -m time -t 60                   60-second timed test
  bluekeys -m words -w 100 --punctuation   100 words with punctuation
  bluekeys -m code --code-language rust    Type Rust code snippets
  bluekeys -m cli --cli-category git       Type git commands
  bluekeys -m quote --quote-length 2       Long quotes
`.trimStart();

/**
 * Handle CLI commands that should run before the React app.
 * Returns true if the process should exit (command was handled).
 */
export async function handleCliCommands(argv: string[]): Promise<boolean> {
  const first = argv[0];

  if (first === "--version" || first === "-v" || first === "version") {
    console.log(`bluekeys v${VERSION}`);
    return true;
  }

  if (first === "--help" || first === "-h" || first === "help") {
    console.log(HELP_TEXT);
    return true;
  }

  if (first === "upgrade") {
    return runUpgrade(argv[1] ?? null);
  }

  if (first === "check-update") {
    await checkUpdateCommand();
    return true;
  }

  return false;
}

function runUpgrade(targetVersion: string | null): boolean {
  // Detect install method and upgrade accordingly
  const npmGlobal = isNpmInstall();

  if (npmGlobal) {
    upgradeNpm();
  } else {
    upgradeScript(targetVersion);
  }

  return true;
}

function isNpmInstall(): boolean {
  // If running via Node.js (not a compiled binary), it's likely an npm install
  try {
    const binPath = process.argv[1] ?? "";
    // Compiled Bun binaries won't have node_modules in their path
    if (binPath.includes("node_modules")) return true;
    // Also check if npm/pnpm knows about us
    const out = execSync("npm ls -g bluekeys --depth=0 2>/dev/null", { encoding: "utf-8" });
    return out.includes("bluekeys");
  } catch {
    return false;
  }
}

function upgradeNpm(): void {
  console.log("Upgrading bluekeys via npm...");
  try {
    execSync("npm install -g bluekeys@latest", { stdio: "inherit" });
    console.log("\nUpgrade complete!");
  } catch {
    console.error("Upgrade failed. Try manually: npm install -g bluekeys@latest");
    process.exit(1);
  }
}

function upgradeScript(targetVersion: string | null): void {
  const version = targetVersion ?? "latest";
  console.log(`Upgrading bluekeys to ${version}...`);

  const installUrl = "https://raw.githubusercontent.com/anirban12d/bluekeys/main/scripts/install.sh";

  try {
    // Download script to a temp file, then run it directly.
    // This preserves the TTY so sudo prompts work correctly
    // (piping curl | sh through execSync breaks interactive sudo).
    const tmpScript = "/tmp/bluekeys-install.sh";
    execSync(`curl -fsSL ${installUrl} -o ${tmpScript}`, { stdio: "inherit" });
    execSync(`chmod +x ${tmpScript}`, { stdio: "inherit" });

    const args = version === "latest" ? "" : ` ${version}`;
    execSync(`sh ${tmpScript}${args}`, { stdio: "inherit" });

    // Cleanup
    try { execSync(`rm -f ${tmpScript}`); } catch { /* ignore */ }
    console.log("\nUpgrade complete!");
  } catch {
    console.error(`Upgrade failed. Try manually:\n  curl -fsSL ${installUrl} | sh`);
    process.exit(1);
  }
}
