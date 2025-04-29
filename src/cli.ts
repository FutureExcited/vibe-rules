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

// Simple debug logger
let isDebugEnabled = false;
const debugLog = (message: string, ...optionalParams: any[]) => {
  if (isDebugEnabled) {
    console.log(chalk.dim(`[Debug] ${message}`), ...optionalParams);
  }
};

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

// Helper function to clear existing rules installed from a package
async function clearExistingRules(
  pkgName: string,
  editorType: RuleType,
  options: { global?: boolean; target?: string }
): Promise<void> {
  debugLog(
    `Clearing existing rules for package "${pkgName}" and editor "${editorType}"...`
  );
  let targetDir: string;
  let potentialTargetFile: string | undefined; // Store the potential single file path
  const singleFileProviders: RuleType[] = [
    RuleType.WINDSURF,
    RuleType.CLAUDE_CODE,
    RuleType.CODEX,
  ];
  let isSingleFileProvider = singleFileProviders.includes(editorType);

  if (options.target) {
    // If target is explicitly provided, check if it's a directory or file
    try {
      // Check if path exists first
      if (await fs.pathExists(options.target)) {
        const stats = await fs.stat(options.target);
        if (stats.isDirectory()) {
          targetDir = options.target;
          // If the target dir matches a known single-file dir, still treat as single file
          const defaultSingleFilePath = isSingleFileProvider
            ? getDefaultTargetPath(editorType, options.global)
            : undefined;
          if (
            defaultSingleFilePath &&
            path.dirname(defaultSingleFilePath) === targetDir
          ) {
            potentialTargetFile = defaultSingleFilePath;
          } else {
            isSingleFileProvider = false; // Explicit directory target overrides default single file assumption
          }
        } else {
          targetDir = path.dirname(options.target);
          potentialTargetFile = options.target; // User specified the file
          isSingleFileProvider = true; // Explicit target file implies single file mode
        }
      } else {
        // Target doesn't exist. Assume it's a file path based on typical usage.
        targetDir = path.dirname(options.target);
        potentialTargetFile = options.target;
        isSingleFileProvider = true; // Assume single file mode
      }
    } catch (error: any) {
      console.error(
        chalk.red(
          `Error checking target path ${options.target}: ${error.message}`
        )
      );
      return; // Cannot determine target directory
    }
  } else {
    // Get default path from provider logic
    const defaultPath = getDefaultTargetPath(editorType, options.global);
    try {
      // Check if path exists first
      if (await fs.pathExists(defaultPath)) {
        const stats = await fs.stat(defaultPath);
        if (stats.isDirectory()) {
          targetDir = defaultPath;
          isSingleFileProvider = false; // Default path is directory, not single file mode by default
        } else {
          targetDir = path.dirname(defaultPath);
          potentialTargetFile = defaultPath; // Default path is a file
          isSingleFileProvider = true; // Set based on default path being a file
        }
      } else {
        // Default path doesn't exist. Infer from editor type.
        targetDir = path.dirname(defaultPath);
        if (singleFileProviders.includes(editorType)) {
          // Check the explicit list
          potentialTargetFile = defaultPath;
          isSingleFileProvider = true;
        } else {
          isSingleFileProvider = false;
        }
      }
    } catch (error: any) {
      console.error(
        chalk.red(
          `Error checking default path ${defaultPath}: ${error.message}`
        )
      );
      return; // Cannot determine target directory
    }
  }

  debugLog(
    `Determined target directory: ${targetDir}. Single File Provider Mode: ${isSingleFileProvider}. Potential Target File: ${potentialTargetFile || "N/A"}`
  );

  // If it's a known single file provider, we don't delete individual files by prefix.
  if (isSingleFileProvider) {
    console.log(
      chalk.yellow(
        `Skipping rule file deletion for editor "${editorType}" as it uses a single configuration file (${potentialTargetFile || "inferred"}). Existing rules from "${pkgName}" within this file will be appended, not cleared automatically by this function.`
      )
    );
    return;
  }

  // Proceed with deleting files by prefix only for multi-file providers (like Cursor, Clinerules)
  try {
    if (!(await fs.pathExists(targetDir))) {
      debugLog(
        `Target directory ${targetDir} does not exist. No rules to clear.`
      );
      return;
    }

    const files = await fs.readdir(targetDir);
    const prefix = `${pkgName}-`; // Using raw package name prefix as requested
    let deletedCount = 0;

    debugLog(
      `Scanning ${targetDir} for files starting with prefix "${prefix}"...`
    );

    for (const file of files) {
      // Consider adding file extension check based on editorType if needed for robustness
      if (file.startsWith(prefix)) {
        const filePath = path.join(targetDir, file);
        try {
          await fs.remove(filePath);
          console.log(chalk.grey(`Deleted existing rule file: ${filePath}`));
          deletedCount++;
        } catch (deleteError: any) {
          console.error(
            chalk.red(
              `Failed to delete rule file ${filePath}: ${deleteError.message}`
            )
          );
        }
      }
    }
    if (deletedCount > 0) {
      console.log(
        chalk.blue(
          `Cleared ${deletedCount} existing rule file(s) matching prefix "${prefix}" in ${targetDir}.`
        )
      );
    } else {
      debugLog(`No rule files found with prefix "${prefix}" in ${targetDir}.`);
    }
  } catch (error: any) {
    console.error(
      chalk.red(
        `Error clearing existing rules in ${targetDir}: ${error.message}`
      )
    );
  }
}

// Initialize CLI
const program = new Command();

program
  .name("vibe-rules")
  .description(
    "A utility for managing Cursor rules, Windsurf rules, and other AI prompts"
  )
  .version("0.1.0")
  .option("--debug", "Enable debug logging", false); // Add global debug option

// Add a hook to capture the global debug option
program.on("option:debug", () => {
  isDebugEnabled = program.opts().debug;
  debugLog("Debug logging enabled.");
});

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
    const editorType = editor.toLowerCase() as RuleType;
    let provider: RuleProvider; // Define provider here
    // isDebugEnabled should be set by the global option hook now
    // Pass the combined options (command-specific + global) down if needed
    const combinedOptions = { ...options, debug: isDebugEnabled };

    try {
      provider = getRuleProvider(editorType); // Get provider once
    } catch (e) {
      console.error(chalk.red(`Invalid editor type specified: ${editor}`));
      // Potentially list valid types here
      process.exit(1);
    }

    const installSinglePackage = async (
      pkgName: string,
      editorType: RuleType,
      provider: RuleProvider,
      installOptions: { global?: boolean; target?: string; debug?: boolean }
    ) => {
      console.log(chalk.blue(`Attempting to install rules from ${pkgName}...`));
      try {
        // Dynamically import the expected rules module
        const ruleModulePath = `${pkgName}/llms`;
        console.log("Importing module", ruleModulePath);
        const defaultExport = await importModuleFromCwd(ruleModulePath);

        if (!defaultExport) {
          console.log(
            chalk.yellow(
              `No default export found in ${ruleModulePath}. Skipping.`
            )
          );
          return;
        }

        await clearExistingRules(pkgName, editorType, installOptions);

        let rulesToInstall: RuleConfig[] = [];

        // Handle if default export is a string
        if (typeof defaultExport === "string") {
          console.log(
            chalk.blue(
              `Found rule content as string in ${pkgName}. Preparing to install...`
            )
          );
          let ruleName = slugifyRuleName(pkgName); // Start with slugified name
          // Ensure the name starts with the package name prefix
          if (!ruleName.startsWith(`${pkgName}-`)) {
            ruleName = `${pkgName}-${ruleName}`;
          }
          const ruleContent = defaultExport;
          rulesToInstall.push({ name: ruleName, content: ruleContent });
        }
        // Handle if default export is an array (existing logic, adapted)
        else {
          const validationResult =
            VibePackageRulesSchema.safeParse(defaultExport);
          if (!validationResult.success) {
            console.error(
              chalk.red(`Validation failed for rules from ${pkgName}:`),
              validationResult.error.errors
            );
            console.log(chalk.yellow(`Skipping installation from ${pkgName}.`));
            return;
          }

          // Process the validated items
          const items = validationResult.data;

          for (const [index, item] of items.entries()) {
            if (typeof item === "string") {
              // Handle string item - name already includes pkgName-index via slugify
              const ruleName = slugifyRuleName(`${pkgName}-${index}`);
              rulesToInstall.push({
                name: ruleName,
                content: item,
                description: `Rule from ${pkgName}`,
              });
            } else {
              // Handle object item - map 'rule' to 'content'
              let ruleName = item.name;
              // Ensure the name starts with the package name prefix
              if (!ruleName.startsWith(`${pkgName}-`)) {
                ruleName = `${pkgName}-${ruleName}`;
              }
              rulesToInstall.push({
                name: ruleName, // Use potentially prefixed name
                content: item.rule, // Map rule to content
                description: item.description,
              });
            }
          }
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

              // Find any metadata for this rule from the original module
              const generatorOptions: RuleGeneratorOptions = {
                description: ruleConfig.description,
                isGlobal: installOptions.global,
                debug: installOptions.debug,
              };

              // Add additional options from the original rules if they exist
              // This handles the case where we processed a rule object with additional metadata
              const originalItem =
                typeof defaultExport === "string"
                  ? null
                  : Array.isArray(defaultExport)
                    ? defaultExport.find(
                        (item: any) =>
                          typeof item === "object" &&
                          item.name === ruleConfig.name
                      )
                    : null;

              if (originalItem && typeof originalItem === "object") {
                debugLog(
                  `Found additional metadata for rule ${ruleConfig.name}: ${JSON.stringify(originalItem)}`
                );
                if ("alwaysApply" in originalItem) {
                  generatorOptions.alwaysApply = originalItem.alwaysApply;
                }
                if ("globs" in originalItem) {
                  generatorOptions.globs = originalItem.globs;
                }
              }

              // Apply the rule using the provider
              const success = await provider.appendFormattedRule(
                ruleConfig,
                finalTargetPath,
                installOptions.global,
                generatorOptions
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
          debugLog(`No valid rules found or processed from ${pkgName}.`);
        }
      } catch (error: any) {
        // Handle common "not found" errors gracefully, only log if debug is enabled
        if (
          error.code === "MODULE_NOT_FOUND" ||
          error.code === "ERR_PACKAGE_PATH_NOT_EXPORTED"
        ) {
          debugLog(
            `Skipping package ${pkgName}: Rules module not found or not exported. Error: ${error.message}`
          );
        } else {
          // Log other unexpected errors as errors
          console.error(
            chalk.red(
              `Failed to install rules from ${pkgName}: ${error instanceof Error ? error.message : error}`
            )
          );
        }
      }
    };

    if (packageName) {
      // Install from a specific package
      await installSinglePackage(
        packageName,
        editorType,
        provider,
        combinedOptions
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
            provider,
            combinedOptions
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

async function importModuleFromCwd(ruleModulePath: string) {
  debugLog(`Attempting to import module: ${ruleModulePath}`);
  let module: any;
  try {
    // Attempt 1: Use createRequire for CommonJS compatibility
    debugLog(`Trying require for ${ruleModulePath}...`);
    module = await eval(
      // Use eval to construct the require call dynamically based on CWD
      // This allows importing modules relative to the project running vibe-rules
      `require('module').createRequire(require('path').join(process.cwd(), 'package.json'))('${ruleModulePath}')`
    );
    debugLog(`Successfully imported using require.`);
  } catch (error: any) {
    // Check if the error is specifically because we tried to require an ES module
    if (error.code === "ERR_REQUIRE_ESM") {
      debugLog(
        `Require failed (ERR_REQUIRE_ESM). Falling back to dynamic import()...`
      );
      try {
        // Attempt 2: Use dynamic import() for ES Modules
        // Construct the file path more reliably for dynamic import
        const absolutePath = require.resolve(ruleModulePath, {
          paths: [process.cwd()],
        });
        debugLog(`Resolved path for import(): ${absolutePath}`);
        // Use pathToFileURL to ensure correct format for import() esp on Windows
        const fileUrl = require("url").pathToFileURL(absolutePath).href;
        debugLog(`Trying dynamic import('${fileUrl}')...`);
        module = await eval(`import('${fileUrl}')`);
        debugLog(`Successfully imported using dynamic import().`);
      } catch (importError: any) {
        // Log import error only in debug mode, but still throw
        debugLog(
          `Dynamic import() failed for ${ruleModulePath}: ${importError.message}`
        );
        // Re-throw the *import* error if dynamic import also fails
        throw importError;
      }
    } else {
      // Log require error only in debug mode, but still throw
      debugLog(
        `Require failed for ${ruleModulePath} with unexpected error: ${error.message}`
      );
      throw error;
    }
  }

  // Extract the default export if it exists, otherwise use the whole module
  const defaultExport = module?.default || module;
  debugLog(`Module imported. Type: ${typeof defaultExport}`);
  // Avoid logging potentially large module content by default
  // console.log(chalk.dim(`[Debug] Module content (keys): ${Object.keys(defaultExport || {}).join(', ')}`));
  return defaultExport;
}
