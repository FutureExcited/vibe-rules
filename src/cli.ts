#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { installCommandAction } from "./commands/install.js";
import { saveCommandAction } from "./commands/save.js";
import { loadCommandAction } from "./commands/load.js";
import { listCommandAction } from "./commands/list.js";
import { convertCommandAction } from "./commands/convert.js";

// Get version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

import { debugLog, setDebugEnabled } from "./utils/debug.js";

const program = new Command();

program
  .name("vibe-rules")
  .description(
    "A utility for managing Cursor rules, Windsurf rules, Amp rules, and other AI prompts"
  )
  .version(version, "-v, --version", "display version number")
  .option("--debug", "Enable debug logging", false);

program.on("option:debug", () => {
  setDebugEnabled(program.opts().debug);
  debugLog("Debug logging enabled.");
});

program
  .command("save")
  .description("Save a rule to the local store")
  .argument("<n>", "Name of the rule")
  .option("-c, --content <content>", "Rule content")
  .option("-f, --file <file>", "Load rule content from file")
  .option("-d, --description <desc>", "Rule description")
  .action(saveCommandAction);

program
  .command("list")
  .description("List all saved rules from the common store")
  .action(listCommandAction);

program
  .command("load")
  .alias("add")
  .description("Apply a saved rule to an editor configuration")
  .argument("<n>", "Name of the rule to apply")
  .argument(
    "<editor>",
    "Target editor type (cursor, windsurf, claude-code, gemini, codex, amp, clinerules, roo, zed, unified, vscode)"
  )
  .option(
    "-g, --global",
    "Apply to global config path if supported (claude-code, gemini, codex)",
    false
  )
  .option("-t, --target <path>", "Custom target path (overrides default and global)")
  .action(loadCommandAction);

program
  .command("install")
  .description(
    "Install rules from an NPM package or all dependencies directly into an editor configuration"
  )
  .argument(
    "<editor>",
    "Target editor type (cursor, windsurf, claude-code, gemini, codex, amp, clinerules, roo, zed, unified, vscode)"
  )
  .argument("[packageName]", "Optional NPM package name to install rules from")
  .option(
    "-g, --global",
    "Apply to global config path if supported (claude-code, gemini, codex)",
    false
  )
  .option("-t, --target <path>", "Custom target path (overrides default and global)")
  .action(installCommandAction);

program
  .command("convert")
  .description("Convert rules from one format to another (directory or file-based)")
  .argument(
    "<sourceFormat>",
    "Source format (cursor, windsurf, claude-code, gemini, codex, amp, clinerules, roo, zed, unified, vscode)"
  )
  .argument(
    "<targetFormat>",
    "Target format (cursor, windsurf, claude-code, gemini, codex, amp, clinerules, roo, zed, unified, vscode)"
  )
  .argument("<sourcePath>", "Source path (directory like .cursor or file like CLAUDE.md)")
  .option(
    "-g, --global",
    "Apply to global config path if supported (claude-code, gemini, codex)",
    false
  )
  .option("-t, --target <path>", "Custom target path (overrides default path)")
  .action(convertCommandAction);

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
