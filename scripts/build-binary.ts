import { spawn } from "bun";
import { rmSync } from "node:fs";

const target = process.argv[2]; // e.g. "bun-darwin-arm64"

// Step 1: Bundle with react-devtools-core stubbed out (Ink optional dev dep)
const result = await Bun.build({
  entrypoints: ["src/cli/index.tsx"],
  outdir: ".build",
  target: "bun",
  plugins: [
    {
      name: "stub-react-devtools",
      setup(build) {
        build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
          path: "stub",
          namespace: "devtools-stub",
        }));
        build.onLoad({ filter: /.*/, namespace: "devtools-stub" }, () => ({
          contents: "export default undefined;",
          loader: "js",
        }));
      },
    },
  ],
});

if (!result.success) {
  console.error("Bundle failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// Step 2: Compile the bundle into a single executable
const args = ["bun", "build", ".build/index.js", "--compile", "--outfile", "bluekeys"];
if (target) args.push("--target", target);

const proc = spawn(args, { stdout: "inherit", stderr: "inherit" });
const code = await proc.exited;

// Cleanup
rmSync(".build", { recursive: true, force: true });

process.exit(code);
