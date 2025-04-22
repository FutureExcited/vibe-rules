#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { RuleType, RuleConfig } from "./types";
import { getRuleProvider } from "./providers";
import {
  getDefaultTargetPath,
  getCommonRulePath,
  getCommonRulesDir,
  ensureTargetDir,
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
      const rulePath = getCommonRulePath(name);

      await fs.writeFile(rulePath, content);

      console.log(chalk.green(`Rule saved successfully to ${rulePath}`));
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
  .description("List all saved rules")
  .action(async () => {
    try {
      const rulesDir = getCommonRulesDir();

      if (!(await fs.pathExists(rulesDir))) {
        console.log(chalk.yellow("No rules found"));
        return;
      }

      const files = await fs.readdir(rulesDir);
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
  .description("Load a rule into an editor configuration")
  .argument("<name>", "Name of the rule")
  .argument("<editor>", "Target editor (cursor, windsurf)")
  .option(
    "-a, --append",
    "Append to an existing file instead of creating a new one"
  )
  .option("-t, --target <path>", "Custom target path")
  .action(async (name, editor, options) => {
    try {
      const rulePath = getCommonRulePath(name);

      if (!(await fs.pathExists(rulePath))) {
        console.error(chalk.red(`Rule "${name}" not found`));

        // Get a list of all available rules
        const rulesDir = getCommonRulesDir();
        if (await fs.pathExists(rulesDir)) {
          const files = await fs.readdir(rulesDir);
          const availableRules = files
            .filter((file) => file.endsWith(".txt"))
            .map((file) => path.basename(file, ".txt"));

          if (availableRules.length > 0) {
            // Find similar rules
            const similarRules = findSimilarRules(name, availableRules);

            if (similarRules.length > 0) {
              console.log(chalk.yellow("\nDid you mean one of these rules?"));
              similarRules.forEach((rule) => console.log(`- ${rule}`));
            }
          }
        }

        process.exit(1);
      }

      // Read the content
      const content = await fs.readFile(rulePath, "utf-8");
      const ruleType = editor.toLowerCase() as RuleType;
      const provider = getRuleProvider(ruleType);

      // Check if append mode is requested for Windsurf (always append for Windsurf)
      const isAppendMode = options.append || ruleType === RuleType.WINDSURF;

      // Create rule config
      const ruleConfig = {
        name,
        content,
        description: name, // Using name as default description
      };

      // Process based on editor and mode
      if (ruleType === RuleType.CURSOR && !isAppendMode) {
        // Add mode (default) for Cursor - create a new rule file
        const targetDir =
          options.target || path.join(process.cwd(), ".cursor", "rules");
        await fs.ensureDir(targetDir);

        const { slugifyRuleName } = await import("./utils/path");
        const slugifiedName = slugifyRuleName(name);
        const targetPath = path.join(targetDir, `${slugifiedName}.mdc`);

        // Format and write the rule
        const formattedContent = provider.generateRuleContent(ruleConfig);
        await fs.writeFile(targetPath, formattedContent);

        console.log(chalk.green(`Rule "${name}" created at ${targetPath}`));
      } else {
        // Append mode for all editors or Windsurf
        let targetPath: string;

        if (options.target) {
          targetPath = options.target;
        } else if (ruleType === RuleType.CURSOR) {
          targetPath = path.join(process.cwd(), ".cursorrules");
        } else {
          // Windsurf
          targetPath = getDefaultTargetPath(ruleType);
        }

        // Ensure the target directory exists
        ensureTargetDir(targetPath);

        // Check if the target file exists, create it if not
        if (!(await fs.pathExists(targetPath))) {
          const defaultContent =
            ruleType === RuleType.CURSOR
              ? "# Cursor Rules\n\n"
              : "# Windsurf Rules\n\n";
          await fs.writeFile(targetPath, defaultContent);
        }

        // Append the rule
        await provider.appendFormattedRule(ruleConfig, targetPath);

        console.log(chalk.green(`Rule "${name}" appended to ${targetPath}`));
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
