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
} from "./utils/path";

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
  .description("Load a rule")
  .argument("<name>", "Name of the rule")
  .action(async (name) => {
    try {
      const rulePath = getCommonRulePath(name);

      if (!(await fs.pathExists(rulePath))) {
        console.error(chalk.red(`Rule "${name}" not found`));
        process.exit(1);
      }

      const content = await fs.readFile(rulePath, "utf-8");
      console.log(content);
    } catch (error) {
      console.error(
        chalk.red(
          `Error loading rule: ${error instanceof Error ? error.message : error}`
        )
      );
      process.exit(1);
    }
  });

// Command to append a rule to a target file
program
  .command("append")
  .description("Append a rule to a target file")
  .argument("<name>", "Name of the rule")
  .argument("<editor>", "Target editor (cursor, windsurf)")
  .option("-t, --target <path>", "Target file path")
  .action(async (name, editor, options) => {
    try {
      const rulePath = getCommonRulePath(name);

      if (!(await fs.pathExists(rulePath))) {
        console.error(chalk.red(`Rule "${name}" not found`));
        process.exit(1);
      }

      const content = await fs.readFile(rulePath, "utf-8");
      const ruleType = editor.toLowerCase() as RuleType;
      const provider = getRuleProvider(ruleType);

      const targetPath = options.target || getDefaultTargetPath(ruleType);

      const ruleConfig = {
        name,
        content,
        description: name, // Using name as default description
      };

      // Format the rule according to the target editor and append it
      await provider.appendFormattedRule(ruleConfig, targetPath);

      console.log(
        chalk.green(`Rule "${name}" appended successfully to ${targetPath}`)
      );
    } catch (error) {
      console.error(
        chalk.red(
          `Error appending rule: ${error instanceof Error ? error.message : error}`
        )
      );
      process.exit(1);
    }
  });

// Command to initialize for a specific editor/tool
program
  .command("init")
  .description("Initialize directory structure for a specific editor")
  .argument("<editor>", "Editor to initialize (cursor, windsurf)")
  .action(async (editor) => {
    try {
      const ruleType = editor.toLowerCase() as RuleType;
      const targetPath = getDefaultTargetPath(ruleType);

      if (ruleType === RuleType.CURSOR) {
        await fs.ensureDir(targetPath);
        console.log(
          chalk.green(`Initialized cursor rules directory at ${targetPath}`)
        );
      } else if (ruleType === RuleType.WINDSURF) {
        if (!(await fs.pathExists(targetPath))) {
          await fs.writeFile(targetPath, "# Windsurf Rules\n");
          console.log(
            chalk.green(`Created windsurf rules file at ${targetPath}`)
          );
        } else {
          console.log(
            chalk.yellow(`Windsurf rules file already exists at ${targetPath}`)
          );
        }
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Error initializing: ${error instanceof Error ? error.message : error}`
        )
      );
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}
