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
import { uninstallCommandAction } from "./commands/uninstall.js";

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
    "Target editor type (cursor, windsurf, claude-code, gemini, codex, amp, clinerules, roo, zed, unified, vscode, kiro)"
  )
  .option(
    "-g, --global",
    "Apply to global config path if supported (claude-code, gemini, codex, kiro)",
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
    "Target editor type (cursor, windsurf, claude-code, gemini, codex, amp, clinerules, roo, zed, unified, vscode, kiro)"
  )
  .argument("[packageName]", "Optional NPM package name to install rules from")
  .option(
    "-g, --global",
    "Apply to global config path if supported (claude-code, gemini, codex, kiro)",
    false
  )
  .option("-t, --target <path>", "Custom target path (overrides default and global)")
  .action(installCommandAction);

program
  .command("convert")
  .description("Convert rules from one format to another (directory or file-based)")
  .argument(
    "<sourceFormat>",
    "Source format (cursor, windsurf, claude-code, gemini, codex, amp, clinerules, roo, zed, unified, vscode, kiro)"
  )
  .argument(
    "<targetFormat>",
    "Target format (cursor, windsurf, claude-code, gemini, codex, amp, clinerules, roo, zed, unified, vscode, kiro)"
  )
  .argument("<sourcePath>", "Source path (directory like .cursor or file like CLAUDE.md)")
  .option(
    "-g, --global",
    "Apply to global config path if supported (claude-code, gemini, codex, kiro)",
    false
  )
  .option("-t, --target <path>", "Custom target path (overrides default path)")
  .action(convertCommandAction);

program
  .command("uninstall")
  .description("Remove a rule from an editor configuration")
  .argument("<name>", "Name of the rule to remove")
  .argument(
    "<editor>",
    "Target editor type (cursor, windsurf, claude-code, codex, amp, clinerules, roo, zed, unified, vscode, kiro)"
  )
  .option("-g, --global", "Remove from global config path if supported (claude-code, codex, kiro)", false)
  .option("-t, --target <path>", "Custom target path (overrides default and global)")
  .action(uninstallCommandAction);

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
