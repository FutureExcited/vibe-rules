#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { installCommandAction } from "./commands/install.js";
import { saveCommandAction } from "./commands/save.js";
import { loadCommandAction } from "./commands/load.js";
import { listCommandAction } from "./commands/list.js";

// Simple debug logger
export let isDebugEnabled = false;
export const debugLog = (message: string, ...optionalParams: any[]) => {
  if (isDebugEnabled) {
    console.log(chalk.dim(`[Debug] ${message}`), ...optionalParams);
  }
};

const program = new Command();

program
  .name("vibe-rules")
  .description("A utility for managing Cursor rules, Windsurf rules, and other AI prompts")
  .version("0.1.0")
  .option("--debug", "Enable debug logging", false);

program.on("option:debug", () => {
  isDebugEnabled = program.opts().debug;
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
    "Target editor type (cursor, windsurf, claude-code, codex, clinerules, roo, zed, unified, vscode)"
  )
  .option("-g, --global", "Apply to global config path if supported (claude-code, codex)", false)
  .option("-t, --target <path>", "Custom target path (overrides default and global)")
  .action(loadCommandAction);

program
  .command("install")
  .description(
    "Install rules from an NPM package or all dependencies directly into an editor configuration"
  )
  .argument(
    "<editor>",
    "Target editor type (cursor, windsurf, claude-code, codex, clinerules, roo)"
  )
  .argument("[packageName]", "Optional NPM package name to install rules from")
  .option("-g, --global", "Apply to global config path if supported (claude-code, codex)", false)
  .option("-t, --target <path>", "Custom target path (overrides default and global)")
  .action(installCommandAction);

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
