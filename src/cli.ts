#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { RuleType, RuleConfig } from "./types";
import { getRuleProvider } from "./providers";
import {
  getDefaultTargetPath,
  getInternalRuleStoragePath,
  getCommonRulesDir,
  ensureTargetDir,
  getRulePath,
  slugifyRuleName,
} from "./utils/path";
import { findSimilarRules } from "./utils/similarity";

// Initialize CLI
const program = new Command();

program
  .name("vibe-rules")
  .description(
    "A utility for managing Cursor rules, Windsurf rules, and other AI prompts"
  )
  .version("0.1.0");

// Command to save a rule
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
        content = await fs.readFile(options.file, "utf-8");
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

      // Store the rule in a common location without type distinction
      const commonRulePath = path.join(getCommonRulesDir(), `${name}.txt`);
      await fs.ensureDir(path.dirname(commonRulePath));
      await fs.writeFile(commonRulePath, content);

      console.log(chalk.green(`Rule saved successfully to ${commonRulePath}`));
    } catch (error) {
      console.error(
        chalk.red(
          `Error saving rule: ${error instanceof Error ? error.message : error}`
        )
      );
      process.exit(1);
    }
  });

// Command to list rules
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

      const files = await fs.readdir(commonRulesDir);
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
          `Error listing rules: ${error instanceof Error ? error.message : error}`
        )
      );
      process.exit(1);
    }
  });

// Command to load a rule
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
      // Load rule from the common storage location
      const commonRulePath = path.join(getCommonRulesDir(), `${name}.txt`);

      if (!(await fs.pathExists(commonRulePath))) {
        console.error(
          chalk.red(`Rule "${name}" not found in the common store`)
        );

        // Suggest similar rules from the common store
        const commonRulesDir = getCommonRulesDir();
        if (await fs.pathExists(commonRulesDir)) {
          const files = await fs.readdir(commonRulesDir);
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

      // Read the content from the common store
      const content = await fs.readFile(commonRulePath, "utf-8");
      const ruleType = editor.toLowerCase() as RuleType;
      const provider = getRuleProvider(ruleType);

      // Create rule config
      const ruleConfig = {
        name,
        content,
        description: name, // Using name as default description
      };

      // Determine the final target path
      let finalTargetPath: string;
      if (options.target) {
        finalTargetPath = options.target; // Explicit target path takes precedence
      } else {
        // Use getRulePath which respects the 'isGlobal' flag
        finalTargetPath = getRulePath(ruleType, name, options.global);
      }

      // Ensure the target directory exists
      ensureTargetDir(finalTargetPath);

      // Apply the rule using the provider
      // The provider receives the final target path determined by cli
      const success = await provider.appendFormattedRule(
        ruleConfig,
        finalTargetPath // Pass only config and the final path
      );

      if (success) {
        console.log(
          chalk.green(
            `Rule "${name}" applied successfully for ${editor} at ${finalTargetPath}`
          )
        );
      } else {
        console.error(
          chalk.red(`Failed to apply rule "${name}" for ${editor}.`)
        );
        process.exit(1);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Error loading rule: ${error instanceof Error ? error.message : error}`
        )
      );
      process.exit(1);
    }
  });

program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}
