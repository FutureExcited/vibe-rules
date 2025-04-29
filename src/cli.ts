#!/usr/bin/env node

import { Command } from "commander";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import {
  RuleType,
  RuleConfig,
  RuleGeneratorOptions,
  RuleProvider,
} from "./types";
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
import {
  RuleConfigSchema,
  VibeRulesSchema,
  VibePackageRulesSchema,
  PackageRuleObjectSchema,
} from "./schemas";

// Helper function to install/save a single rule
async function installRule(ruleConfig: RuleConfig): Promise<void> {
  try {
    // Validate the rule config using the Zod schema
    RuleConfigSchema.parse(ruleConfig); // Throws error if invalid

    const commonRulePath = path.join(
      getCommonRulesDir(),
      `${ruleConfig.name}.txt`
    );
    await fs.ensureDir(path.dirname(commonRulePath));
    await fs.writeFile(commonRulePath, ruleConfig.content);
    console.log(
      chalk.green(
        `Rule "${ruleConfig.name}" saved successfully to ${commonRulePath}`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(
        `Error saving rule "${ruleConfig.name}": ${error instanceof Error ? error.message : error}`
      )
    );
    // Optionally re-throw or handle differently depending on desired flow
    // For now, just log and continue if part of a batch install
  }
}

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

      // Use the new installRule function
      await installRule(ruleConfig);
    } catch (error) {
      // Catch errors specific to file reading or argument parsing for the save command
      console.error(
        chalk.red(
          `Error during save command: ${error instanceof Error ? error.message : error}`
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

// Command to install rules from NPM packages
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
  .action(async (editor, packageName, options) => {
    const installSinglePackage = async (
      pkgName: string,
      editorType: RuleType,
      provider: RuleProvider,
      installOptions: { global?: boolean; target?: string }
    ) => {
      console.log(chalk.blue(`Attempting to install rules from ${pkgName}...`));
      try {
        // Dynamically import the expected rules module
        const ruleModulePath = `${pkgName}/llms`;
        const module = await import(ruleModulePath);

        if (!module || typeof module.default === "undefined") {
          console.log(
            chalk.yellow(
              `No default export found in ${ruleModulePath}. Skipping.`
            )
          );
          return;
        }

        let rulesToInstall: RuleConfig[] = [];

        // Handle if default export is a string
        if (typeof module.default === "string") {
          console.log(
            chalk.blue(
              `Found rule content as string in ${pkgName}. Preparing to install...`
            )
          );
          const ruleName = slugifyRuleName(pkgName);
          const ruleContent = module.default;
          rulesToInstall.push({ name: ruleName, content: ruleContent });
        }
        // Handle if default export is an array (existing logic, adapted)
        else {
          const validationResult = VibeRulesSchema.safeParse(module.default);
          if (!validationResult.success) {
            console.error(
              chalk.red(`Validation failed for rules from ${pkgName}:`),
              validationResult.error.errors
            );
            console.log(chalk.yellow(`Skipping installation from ${pkgName}.`));
            return;
          }
          rulesToInstall = validationResult.data;
        }

        // Now, install the gathered rules using the provider
        if (rulesToInstall.length > 0) {
          console.log(
            chalk.blue(
              `Applying ${rulesToInstall.length} rule(s) from ${pkgName} to ${editorType}...`
            )
          );

          for (const ruleConfig of rulesToInstall) {
            try {
              // Determine the final target path (logic copied from 'load' command)
              let finalTargetPath: string;
              if (installOptions.target) {
                finalTargetPath = installOptions.target; // Explicit target path takes precedence
              } else {
                finalTargetPath = getRulePath(
                  editorType,
                  ruleConfig.name,
                  installOptions.global
                );
              }

              // Ensure the target directory exists
              ensureTargetDir(finalTargetPath);

              // Apply the rule using the provider
              const success = await provider.appendFormattedRule(
                ruleConfig,
                finalTargetPath,
                installOptions.global,
                {
                  description: ruleConfig.description,
                  isGlobal: installOptions.global,
                }
              );

              if (success) {
                console.log(
                  chalk.green(
                    `Rule "${ruleConfig.name}" from ${pkgName} applied successfully for ${editorType} at ${finalTargetPath}`
                  )
                );
              } else {
                console.error(
                  chalk.red(
                    `Failed to apply rule "${ruleConfig.name}" from ${pkgName} for ${editorType}.`
                  )
                );
              }
            } catch (ruleError) {
              console.error(
                chalk.red(
                  `Error applying rule "${ruleConfig.name}" from ${pkgName}: ${ruleError instanceof Error ? ruleError.message : ruleError}`
                )
              );
            }
          }
        } else {
          console.log(
            chalk.yellow(`No valid rules found or processed from ${pkgName}.`)
          );
        }
      } catch (error: any) {
        if (error.code === "MODULE_NOT_FOUND") {
          // More specific check for module not found or package not found
          if (error.message.includes(`Cannot find package '${pkgName}'`)) {
            console.log(
              chalk.yellow(
                `Package ${pkgName} not found or not installed. Skipping.`
              )
            );
          } else if (
            error.message.includes(`Cannot find module '${pkgName}/llms'`)
          ) {
            console.log(
              chalk.yellow(
                `Module ${pkgName}/llms not found. Does this package export rules? Skipping.`
              )
            );
          } else {
            console.log(
              chalk.yellow(
                `Could not import rules from ${pkgName}. Skipping. Error: ${error.message}`
              )
            );
          }
        } else {
          console.error(
            chalk.red(
              `Failed to install rules from ${pkgName}: ${error instanceof Error ? error.message : error}`
            )
          );
        }
      }
    };

    const editorType = editor.toLowerCase() as RuleType;
    // Basic validation if editor type is supported (can be enhanced)
    try {
      getRuleProvider(editorType); // Will throw error if type is invalid
    } catch (e) {
      console.error(chalk.red(`Invalid editor type specified: ${editor}`));
      // Potentially list valid types here
      process.exit(1);
    }

    if (packageName) {
      // Install from a specific package
      await installSinglePackage(
        packageName,
        editorType,
        getRuleProvider(editorType),
        options
      );
    } else {
      // Install from all dependencies in package.json
      console.log(
        chalk.blue(
          `Installing rules from all dependencies in package.json for ${editor}...`
        )
      );
      try {
        const pkgJsonPath = path.join(process.cwd(), "package.json");
        if (!fs.existsSync(pkgJsonPath)) {
          console.error(
            chalk.red("package.json not found in the current directory.")
          );
          process.exit(1);
        }
        const pkgJsonContent = await fs.readFile(pkgJsonPath, "utf-8");
        const { dependencies = {}, devDependencies = {} } =
          JSON.parse(pkgJsonContent);
        const allDeps = [
          ...Object.keys(dependencies),
          ...Object.keys(devDependencies),
        ];

        if (allDeps.length === 0) {
          console.log(chalk.yellow("No dependencies found in package.json."));
          return;
        }

        console.log(
          chalk.blue(
            `Found ${allDeps.length} dependencies. Checking for rules to install for ${editor}...`
          )
        );

        for (const depName of allDeps) {
          await installSinglePackage(
            depName,
            editorType,
            getRuleProvider(editorType),
            options
          );
        }

        console.log(chalk.green("Finished checking all dependencies."));
      } catch (error) {
        console.error(
          chalk.red(
            `Error processing package.json: ${error instanceof Error ? error.message : error}`
          )
        );
        process.exit(1);
      }
    }
  });

program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}
