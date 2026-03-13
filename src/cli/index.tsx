#!/usr/bin/env node
import { handleCliCommands } from "./commands.js";
import { checkForUpdate } from "./updateCheck.js";
import { VERSION } from "./version.js";

// Handle --version, --help, upgrade, check-update before rendering the React app
const shouldExit = await handleCliCommands(process.argv.slice(2));
if (!shouldExit) {
  // Non-blocking update check (runs in background, prints after app exits)
  const updatePromise = checkForUpdate();

  const { render } = await import("ink");
  const { App } = await import("../app/App.js");
  const { waitUntilExit } = render(<App />);

  await waitUntilExit();

  // Show update notice after the app exits cleanly
  const latestVersion = await updatePromise;
  if (latestVersion) {
    console.log(
      `\n  Update available: v${VERSION} → v${latestVersion}\n  Run \`bluekeys upgrade\` to update.\n`,
    );
  }
}
