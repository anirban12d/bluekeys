#!/usr/bin/env node
import { handleCliCommands } from "./commands.js";

// Handle --version, --help, upgrade before rendering the React app
const shouldExit = handleCliCommands(process.argv.slice(2));
if (!shouldExit) {
  const { render } = await import("ink");
  const { App } = await import("../app/App.js");
  render(<App />);
}
