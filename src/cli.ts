#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra/esm";
import { writeFile, readFile, readdir } from "fs/promises";
import path from "path";
import chalk from "chalk";
import { RuleType, RuleConfig } from "./types.js";
import { getRuleProvider } from "./providers/index.js";
import { ensureDirectoryExists, getCommonRulesDir, getRulePath } from "./utils/path.js";
import { findSimilarRules } from "./utils/similarity.js";
import { RuleConfigSchema } from "./schemas.js";
import { installCommandAction } from "./commands/install.js";

// Simple debug logger
export let isDebugEnabled = false;
export const debugLog = (message: string, ...optionalParams: any[]) => {
  if (isDebugEnabled) {
    console.log(chalk.dim(`[Debug] ${message}`), ...optionalParams);
  }
};

// Helper function to install/save a single rule
async function installRule(ruleConfig: RuleConfig): Promise<void> {
  try {
    RuleConfigSchema.parse(ruleConfig);

    const commonRulePath = path.join(
      getCommonRulesDir(),
      `${ruleConfig.name}.txt`
    );
    await ensureDirectoryExists(path.dirname(commonRulePath));
    await writeFile(commonRulePath, ruleConfig.content);
    console.log(
      chalk.green(
        `Rule \"${ruleConfig.name}\" saved successfully to ${commonRulePath}`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(
        `Error saving rule \"${ruleConfig.name}\": ${
          error instanceof Error ? error.message : error
        }`
      )
    );
  }
}

const program = new Command();

program
  .name("vibe-rules")
  .description(
    "A utility for managing Cursor rules, Windsurf rules, and other AI prompts"
  )
  .version("0.1.0")
  .option("--debug", "Enable debug logging", false);

program.on("option:debug", () => {
  isDebugEnabled = program.opts().debug;
  debugLog("Debug logging enabled.");
});

program
  .command("save")
  .description("Save a rule to the local store")
  .argument("<name>", "Name of the rule")
  .option("-c, --content <content>", "Rule content")
  .option("-f, --file <file>", "Load rule content from file")
  .option("-d, --description <desc>", "Rule description")
  .action(async (name, options) => {
    try {
      let content: string;
      if (options.file) {
        content = await readFile(options.file, "utf-8");
      } else if (options.content) {
        content = options.content;
      } else {
        console.error(
          chalk.red("Error: Either --content or --file must be specified")
        );
        process.exit(1);
      }

      const ruleConfig: RuleConfig = {
        name,
        content,
        description: options.description,
      };

      await installRule(ruleConfig);
    } catch (error) {
      console.error(
        chalk.red(
          `Error during save command: ${
            error instanceof Error ? error.message : error
          }`
        )
      );
      process.exit(1);
    }
  });

program
  .command("list")
  .description("List all saved rules from the common store")
  .action(async () => {
    try {
      const commonRulesDir = getCommonRulesDir();

      if (!(await fs.pathExists(commonRulesDir))) {
        console.log(chalk.yellow("No rules found (common store is empty)"));
        return;
      }

      const files = await readdir(commonRulesDir);
      const rules = files
        .filter((file) => file.endsWith(".txt"))
        .map((file) => path.basename(file, ".txt"));

      if (rules.length === 0) {
        console.log(chalk.yellow("No rules found"));
        return;
      }

      console.log(chalk.blue("Available rules:"));
      rules.forEach((rule) => console.log(`- ${rule}`));
    } catch (error) {
      console.error(
        chalk.red(
          `Error listing rules: ${
            error instanceof Error ? error.message : error
          }`
        )
      );
      process.exit(1);
    }
  });

program
  .command("load")
  .alias("add")
  .description("Apply a saved rule to an editor configuration")
  .argument("<name>", "Name of the rule to apply")
  .argument(
    "<editor>",
    "Target editor type (cursor, windsurf, claude-code, codex, clinerules, roo)"
  )
  .option(
    "-g, --global",
    "Apply to global config path if supported (claude-code, codex)",
    false
  )
  .option(
    "-t, --target <path>",
    "Custom target path (overrides default and global)"
  )
  .action(async (name, editor, options) => {
    try {
      const commonRulePath = path.join(getCommonRulesDir(), `${name}.txt`);

      if (!(await fs.pathExists(commonRulePath))) {
        console.error(
          chalk.red(`Rule \"${name}\" not found in the common store`)
        );

        const commonRulesDir = getCommonRulesDir();
        if (await fs.pathExists(commonRulesDir)) {
          const files = await readdir(commonRulesDir);
          const availableRules = files
            .filter((file) => file.endsWith(".txt"))
            .map((file) => path.basename(file, ".txt"));

          if (availableRules.length > 0) {
            const similarRules = findSimilarRules(name, availableRules);
            if (similarRules.length > 0) {
              console.log(chalk.yellow("\nDid you mean one of these rules?"));
              similarRules.forEach((rule) => console.log(`- ${rule}`));
            }
          }
        }
        process.exit(1);
      }

      const content = await readFile(commonRulePath, "utf-8");
      const ruleType = editor.toLowerCase() as RuleType;
      const provider = getRuleProvider(ruleType);

      const ruleConfig = {
        name,
        content,
        description: name,
      };

      let finalTargetPath: string;
      if (options.target) {
        finalTargetPath = options.target;
      } else {
        finalTargetPath = getRulePath(ruleType, name, options.global);
      }

      fs.ensureDirSync(path.dirname(finalTargetPath));

      const success = await provider.appendFormattedRule(
        ruleConfig,
        finalTargetPath,
        options.global,
        {
          description: ruleConfig.description,
          isGlobal: options.global,
        }
      );

      if (success) {
        console.log(
          chalk.green(
            `Rule \"${name}\" applied successfully for ${editor} at ${finalTargetPath}`
          )
        );
      } else {
        console.error(
          chalk.red(`Failed to apply rule \"${name}\" for ${editor}.`)
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Error loading rule: ${
            error instanceof Error ? error.message : error
          }`
        )
      );
      process.exit(1);
    }
  });

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
  .option(
    "-g, --global",
    "Apply to global config path if supported (claude-code, codex)",
    false
  )
  .option(
    "-t, --target <path>",
    "Custom target path (overrides default and global)"
  )
  .action(installCommandAction);

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
