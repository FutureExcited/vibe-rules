import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import {
  RuleType,
  RuleConfig,
  RuleGeneratorOptions,
  RuleProvider,
  RuleTypeArray,
} from "../types";
import { getRuleProvider } from "../providers";
import {
  getDefaultTargetPath,
  getRulePath,
  slugifyRuleName,
} from "../utils/path";
import { VibePackageRulesSchema } from "../schemas";
import { isDebugEnabled, debugLog } from "../cli"; // Assuming these will be exported from cli.ts

// Helper function to clear existing rules installed from a package
async function clearExistingRules(
  pkgName: string,
  editorType: RuleType,
  options: { global?: boolean }
): Promise<void> {
  debugLog(
    `Clearing existing rules for package "${pkgName}" and editor "${editorType}" with options ${JSON.stringify(
      options
    )}...`
  );
  let targetDir: string;
  const singleFileProviders: RuleTypeArray = [
    RuleType.WINDSURF,
    RuleType.CLAUDE_CODE,
    RuleType.CODEX,
  ];
  let isSingleFileProvider = singleFileProviders.includes(editorType);

  // Get default path from provider logic
  const defaultPath = getDefaultTargetPath(editorType, options.global);
  try {
    // Check if path exists first
    if (await fs.pathExists(defaultPath)) {
      const stats = await fs.stat(defaultPath);
      if (stats.isDirectory()) {
        targetDir = defaultPath;
      } else {
        targetDir = path.dirname(defaultPath);
      }
    } else {
      // Default path doesn't exist. Create it.
      await fs.ensureDir(defaultPath);
      targetDir = defaultPath;
    }
  } catch (error: any) {
    console.error(
      chalk.red(`Error checking default path ${defaultPath}: ${error.message}`)
    );
    return; // Cannot determine target directory
  }

  debugLog(
    `Determined target directory: ${targetDir}. Single File Provider Mode: ${isSingleFileProvider} for ${editorType}.`
  );

  // If it's a known single file provider, remove matching XML blocks instead of deleting files
  if (isSingleFileProvider) {
    const potentialTargetFile = getRulePath(editorType, "", options.global);
    if (!(await fs.pathExists(potentialTargetFile))) {
      debugLog(
        `Cannot clear rules for single file provider ${editorType} as target file path could not be determined.`
      );
      return;
    }
    if (!potentialTargetFile) {
      debugLog(
        `Cannot clear rules for single file provider ${editorType} as target file path could not be determined.`
      );
      return;
    }
    try {
      if (!(await fs.pathExists(potentialTargetFile))) {
        debugLog(
          `Target file ${potentialTargetFile} does not exist. No rules to clear.`
        );
        return;
      }

      const content = await fs.readFile(potentialTargetFile, "utf-8");
      // Regex to match <pkgName_ruleName ...>...</pkgName_ruleName> blocks
      const removalRegex = new RegExp(
        `<(${pkgName}_[^\\s>]+)[^>]*>.*?<\\/\\1>\s*\n?`,
        "gs"
      );

      let removedCount = 0;
      const newContent = content.replace(removalRegex, (match) => {
        removedCount++;
        debugLog(
          `Removing block matching pattern: ${match.substring(0, 100)}...`
        );
        return "";
      });

      if (removedCount > 0) {
        await fs.writeFile(potentialTargetFile, newContent, "utf-8");
        debugLog(
          chalk.blue(
            `Removed ${removedCount} existing rule block(s) matching prefix "${pkgName}_" from ${potentialTargetFile}.`
          )
        );
      } else {
        debugLog(
          `No rule blocks found with prefix "${pkgName}_" in ${potentialTargetFile}.`
        );
      }
    } catch (error: any) {
      console.error(
        chalk.red(
          `Error clearing rule blocks from ${potentialTargetFile}: ${error.message}`
        )
      );
    }
    return;
  }

  try {
    if (!(await fs.pathExists(targetDir))) {
      debugLog(
        `Target directory ${targetDir} does not exist. No rules to clear.`
      );
      return;
    }

    const files = await fs.readdir(targetDir);
    const prefix = `${pkgName}_`;
    let deletedCount = 0;

    debugLog(
      `Scanning ${targetDir} for files starting with prefix "${prefix}"...`
    );

    for (const file of files) {
      if (file.startsWith(prefix)) {
        const filePath = path.join(targetDir, file);
        try {
          await fs.remove(filePath);
          debugLog(chalk.grey(`Deleted existing rule file: ${filePath}`));
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
      debugLog(
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

async function importModuleFromCwd(ruleModulePath: string) {
  debugLog(`Attempting to import module: ${ruleModulePath}`);
  let module: any;
  try {
    debugLog(`Trying require for ${ruleModulePath}...`);
    module = await eval(
      `require('module').createRequire(require('path').join(process.cwd(), 'package.json'))('${ruleModulePath}')`
    );
    debugLog(`Successfully imported using require.`);
  } catch (error: any) {
    if (error.code === "ERR_REQUIRE_ESM") {
      debugLog(
        `Require failed (ERR_REQUIRE_ESM). Falling back to dynamic import()...`
      );
      try {
        let absolutePath: string;
        try {
          absolutePath = require.resolve(ruleModulePath, {
            paths: [process.cwd()],
          });
        } catch (resolveError: any) {
          debugLog(
            `Could not resolve path for dynamic import of ${ruleModulePath}: ${resolveError.message}`
          );
          throw resolveError;
        }

        debugLog(`Resolved path for import(): ${absolutePath}`);
        const fileUrl = require("url").pathToFileURL(absolutePath).href;
        debugLog(`Trying dynamic import('${fileUrl}')...`);
        module = await eval(`import('${fileUrl}')`);
        debugLog(`Successfully imported using dynamic import().`);
      } catch (importError: any) {
        debugLog(
          `Dynamic import() failed for ${ruleModulePath}: ${importError.message}`
        );
        throw importError;
      }
    } else {
      debugLog(
        `Require failed for ${ruleModulePath} with unexpected error: ${error.message}`
      );
      throw error;
    }
  }

  const defaultExport = module?.default || module;
  debugLog(`Module imported. Type: ${typeof defaultExport}`);
  return defaultExport;
}

async function installSinglePackage(
  pkgName: string,
  editorType: RuleType,
  provider: RuleProvider,
  installOptions: { global?: boolean; target?: string; debug?: boolean }
): Promise<number> {
  // Return count of successfully applied rules
  if (isDebugEnabled) {
    console.log(chalk.blue(`Attempting to install rules from ${pkgName}...`));
  }

  let rulesSuccessfullyAppliedCount = 0;

  try {
    const ruleModulePath = `${pkgName}/llms`;
    debugLog(`Importing module ${ruleModulePath}`);
    const defaultExport = await importModuleFromCwd(ruleModulePath);

    if (!defaultExport) {
      debugLog(
        chalk.yellow(
          `No default export or module found in ${ruleModulePath} after import attempt. Skipping ${pkgName}.`
        )
      );
      return 0;
    }

    await clearExistingRules(pkgName, editorType, installOptions);

    let rulesToInstall: RuleConfig[] = [];

    if (typeof defaultExport === "string") {
      debugLog(
        `Found rule content as string in ${pkgName}. Preparing to install...`
      );
      let ruleName = slugifyRuleName(pkgName);
      if (!ruleName.startsWith(`${pkgName}_`)) {
        ruleName = `${pkgName}_${ruleName}`;
      }
      const ruleContent = defaultExport;
      rulesToInstall.push({ name: ruleName, content: ruleContent });
    } else {
      debugLog(`Found array export in ${pkgName}. Validating...`);
      const validationResult = VibePackageRulesSchema.safeParse(defaultExport);
      if (!validationResult.success) {
        console.error(
          chalk.red(`Validation failed for rules from ${pkgName}:`),
          validationResult.error.errors
        );
        debugLog(
          chalk.yellow(
            `Skipping installation from ${pkgName} due to validation failure.`
          )
        );
        return 0;
      }

      const items = validationResult.data;
      debugLog(`Found ${items.length} valid items in ${pkgName}`);

      for (const [index, item] of items.entries()) {
        if (typeof item === "string") {
          const ruleName = slugifyRuleName(`${pkgName}_${index}`);
          rulesToInstall.push({
            name: ruleName,
            content: item,
            description: `Rule from ${pkgName}`,
          });
        } else {
          let ruleName = item.name;
          if (!ruleName.startsWith(`${pkgName}_`)) {
            ruleName = `${pkgName}_${ruleName}`;
          }
          debugLog(`Processing object rule: ${item.name} with properties:
            alwaysApply: ${
              item.alwaysApply !== undefined ? item.alwaysApply : "undefined"
            }
            globs: ${
              item.globs
                ? Array.isArray(item.globs)
                  ? item.globs.join(",")
                  : item.globs
                : "undefined"
            }
          `);
          rulesToInstall.push({
            name: ruleName,
            content: item.rule,
            description: item.description,
          });
        }
      }
    }

    if (rulesToInstall.length > 0) {
      if (isDebugEnabled) {
        console.log(
          chalk.blue(
            `Applying ${rulesToInstall.length} rule(s) from ${pkgName} to ${editorType}...`
          )
        );
      }

      for (const ruleConfig of rulesToInstall) {
        try {
          let finalTargetPath: string;
          if (installOptions.target) {
            finalTargetPath = installOptions.target;
          } else {
            finalTargetPath = getRulePath(
              editorType,
              ruleConfig.name,
              installOptions.global
            );
          }
          fs.ensureDirSync(path.dirname(finalTargetPath));

          const generatorOptions: RuleGeneratorOptions = {
            description: ruleConfig.description,
            isGlobal: installOptions.global,
            debug: installOptions.debug,
          };

          let originalName = ruleConfig.name;
          if (originalName.startsWith(`${pkgName}_`)) {
            originalName = originalName.substring(pkgName.length + 1);
          }
          debugLog(
            `Looking for metadata with original name: ${originalName} (from ${ruleConfig.name})`
          );

          const originalItem =
            typeof defaultExport === "string"
              ? null
              : Array.isArray(defaultExport)
              ? defaultExport.find(
                  (item: any) =>
                    typeof item === "object" &&
                    (item.name === originalName ||
                      item.name === ruleConfig.name)
                )
              : null;

          if (originalItem && typeof originalItem === "object") {
            debugLog(
              `Found additional metadata for rule ${
                ruleConfig.name
              }. Keys: ${Object.keys(originalItem).join(", ")}`
            );
            if ("alwaysApply" in originalItem) {
              generatorOptions.alwaysApply = originalItem.alwaysApply;
              debugLog(`Setting alwaysApply: ${originalItem.alwaysApply}`);
            }
            if ("globs" in originalItem) {
              generatorOptions.globs = originalItem.globs;
              debugLog(`Setting globs: ${JSON.stringify(originalItem.globs)}`);
            }
          }
          debugLog(
            `Applying rule ${ruleConfig.name} with options: ${JSON.stringify(
              generatorOptions
            )}`
          );

          if (isDebugEnabled) {
            if (generatorOptions.globs) {
              console.log(
                chalk.blue(
                  `Rule "${ruleConfig.name}" has globs: ${
                    Array.isArray(generatorOptions.globs)
                      ? generatorOptions.globs.join(", ")
                      : generatorOptions.globs
                  }`
                )
              );
            }
            if (generatorOptions.alwaysApply !== undefined) {
              console.log(
                chalk.blue(
                  `Rule "${ruleConfig.name}" has alwaysApply: ${generatorOptions.alwaysApply}`
                )
              );
            }
          }

          try {
            const success = await provider.appendFormattedRule(
              ruleConfig,
              finalTargetPath,
              installOptions.global,
              generatorOptions
            );
            if (success) {
              rulesSuccessfullyAppliedCount++;
              if (isDebugEnabled) {
                console.log(
                  chalk.green(
                    `Rule "${ruleConfig.name}" from ${pkgName} applied successfully for ${editorType} at ${finalTargetPath}`
                  )
                );
              }
            } else {
              console.error(
                chalk.red(
                  `Failed to apply rule "${ruleConfig.name}" from ${pkgName} for ${editorType}.`
                )
              );
            }
          } catch (ruleApplyError) {
            console.error(
              chalk.red(
                `Error applying rule "${ruleConfig.name}" from ${pkgName}: ${
                  ruleApplyError instanceof Error
                    ? ruleApplyError.message
                    : ruleApplyError
                }`
              )
            );
          }
        } catch (ruleError) {
          console.error(
            chalk.red(
              `Error applying rule "${ruleConfig.name}" from ${pkgName}: ${
                ruleError instanceof Error ? ruleError.message : ruleError
              }`
            )
          );
        }
      }
    } else {
      debugLog(`No valid rules found or processed from ${pkgName}.`);
    }
  } catch (error: any) {
    if (
      error.code === "MODULE_NOT_FOUND" ||
      error.code === "ERR_MODULE_NOT_FOUND" ||
      error.code === "ERR_PACKAGE_PATH_NOT_EXPORTED"
    ) {
      const msg = `Skipping package ${pkgName}: Rules module ('${pkgName}/llms') not found or not exported.`;
      debugLog(`${msg} Error: ${error.message}`);
      debugLog(`Stack: ${error.stack}`);
    } else if (error instanceof SyntaxError) {
      console.error(
        chalk.red(
          `Error in package '${pkgName}': Syntax error found in its rule module ('${pkgName}/llms').`
        )
      );
      console.error(
        chalk.red(
          "Please check the syntax of the rules module in this package."
        )
      );
      debugLog(`SyntaxError details: ${error.message}`);
      debugLog(`Stack: ${error.stack}`);
    } else {
      console.error(
        chalk.red(
          `Error from package '${pkgName}': Its rule module ('${pkgName}/llms') was found but failed during its own initialization.`
        )
      );
      console.error(
        chalk.yellow(
          `This often indicates an issue within the '${pkgName}' package itself (e.g., trying to access files with incorrect paths post-build, or other internal errors).`
        )
      );
      console.error(
        chalk.red(`Original error from '${pkgName}': ${error.message}`)
      );
      debugLog(`Full error trace from '${pkgName}' to help its developers:`);
      debugLog(error.stack);
    }
  }
  return rulesSuccessfullyAppliedCount;
}

/**
 * Editors that should be included when using "install all"
 * When adding a new editor to RuleType, you MUST decide whether to include it here.
 * This explicit list ensures new editors are consciously included or excluded.
 */
export const INSTALL_ALL_INCLUDES = [
  RuleType.CURSOR,
  RuleType.WINDSURF,
  RuleType.CLAUDE_CODE,
  RuleType.CODEX,
  RuleType.CLINERULES,
  RuleType.ZED,
  RuleType.UNIFIED,
] as const satisfies RuleType[];

/**
 * Editors that are aliases or should not be included in "all" functionality
 * These are explicitly excluded with documentation of why.
 */
export const INSTALL_ALL_EXCLUDES = [
  RuleType.ROO,    // Alias for CLINERULES, avoid duplication
  RuleType.CUSTOM, // Custom implementations, not standardized
] as const satisfies RuleType[];


/**
 * Handles the 'install' command logic.
 * Installs rules from an NPM package or all dependencies into an editor configuration.
 * @param editor Target editor type (cursor, windsurf, claude-code, codex, clinerules, roo, unified, zed, all)
 * @param packageName Optional NPM package name to install rules from
 * @param options Command options including global, target, and debug
 */
export async function installCommandAction(
  editor: string,
  packageName: string | undefined,
  options: { global?: boolean; target?: string; debug?: boolean }
): Promise<void> {
  const editorArg = editor.toLowerCase();
  const combinedOptions = { ...options, debug: isDebugEnabled }; // Use isDebugEnabled from cli.ts

  // Guardrail: Disallow --target with 'all'
  if (options.target && editorArg === 'all') {
    console.error(chalk.red("The --target option cannot be used when installing for 'all' editors."));
    console.error(chalk.yellow("Each editor has different file structures and target path conventions."));
    process.exit(1);
  }

  // 1. Identify which editors to process
  const editorsToProcess: RuleType[] = [...INSTALL_ALL_INCLUDES];
  if (editorArg === 'all') {
      
    console.log(chalk.blue(`Installing rules for all supported editors: ${editorsToProcess.join(', ')}`));
    
    if (packageName) {
      console.log(chalk.blue(`Package: ${packageName}`));
    } else {
      console.log(chalk.blue(`Scanning all dependencies in package.json...`));
    }
  } else {
    // Logic for a single, specified editor
    const editorType = editorArg as RuleType;
    
    // Validate editor type
    if (!Object.values(RuleType).includes(editorType)) {
      console.error(chalk.red(`Invalid editor type specified: ${editor}`));
      console.error(chalk.yellow(`Supported editors: ${Object.values(RuleType).join(', ')}`));
      process.exit(1);
    }
    
    editorsToProcess.push(editorType);
  }

  // 2. Loop through the list of editors
  let totalRulesInstalled = 0;
  const results: { editor: string; count: number; success: boolean }[] = [];

  for (const editorType of editorsToProcess) {
    if (editorsToProcess.length > 1) {
      console.log(chalk.cyan(`\n--- Processing editor: ${editorType} ---`));
    }
    
    let provider: RuleProvider;
    try {
      provider = getRuleProvider(editorType);
    } catch (e) {
      console.error(chalk.red(`Failed to get provider for editor: ${editorType}`));
      results.push({ editor: editorType, count: 0, success: false });
      continue;
    }

    try {
      if (packageName) {
        const count = await installSinglePackage(
          packageName,
          editorType,
          provider,
          combinedOptions
        );
        results.push({ editor: editorType, count, success: true });
        totalRulesInstalled += count;
        
        if (!isDebugEnabled && count > 0 && editorsToProcess.length === 1) {
          console.log(
            chalk.green(
              `[vibe-rules] Successfully installed ${count} rule(s) from package '${packageName}' for ${editorType}.`
            )
          );
        }
      } else {
        // Install from all dependencies
        const pkgJsonPath = path.join(process.cwd(), "package.json");
        if (!fs.existsSync(pkgJsonPath)) {
          if (editorsToProcess.length === 1) {
            console.error(
              chalk.red("package.json not found in the current directory.")
            );
            process.exit(1);
          } else {
            console.error(
              chalk.red(`package.json not found - skipping all editor installations.`)
            );
            return;
          }
        }
        
        const pkgJsonContent = await fs.readFile(pkgJsonPath, "utf-8");
        const { dependencies = {}, devDependencies = {} } = JSON.parse(pkgJsonContent);
        const allDeps = [
          ...Object.keys(dependencies),
          ...Object.keys(devDependencies),
        ];

        if (allDeps.length === 0) {
          if (editorsToProcess.length === 1) {
            console.log(chalk.yellow("No dependencies found in package.json."));
            return;
          } else {
            console.log(chalk.yellow(`No dependencies found for ${editorType}.`));
            results.push({ editor: editorType, count: 0, success: true });
            continue;
          }
        }

        let editorRulesInstalled = 0;
        for (const depName of allDeps) {
          editorRulesInstalled += await installSinglePackage(
            depName,
            editorType,
            provider,
            combinedOptions
          );
        }
        
        results.push({ editor: editorType, count: editorRulesInstalled, success: true });
        totalRulesInstalled += editorRulesInstalled;
        
        if (!isDebugEnabled && editorRulesInstalled > 0 && editorsToProcess.length === 1) {
          console.log(
            chalk.green(
              `[vibe-rules] Finished installing rules from dependencies for ${editorType}. Total rules installed: ${editorRulesInstalled}.`
            )
          );
        } else if (!isDebugEnabled && editorRulesInstalled === 0 && allDeps.length > 0 && editorsToProcess.length === 1) {
          console.log(
            chalk.yellow(
              `[vibe-rules] No rules found to install from dependencies for ${editorType}.`
            )
          );
        }
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Error processing ${editorType}: ${
            error instanceof Error ? error.message : error
          }`
        )
      );
      results.push({ editor: editorType, count: 0, success: false });
    }
  }

  // 3. Summary for "all" installations
  if (editorsToProcess.length > 1) {
    console.log(chalk.blue(`\n--- Installation Summary ---`));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (successful.length > 0) {
      console.log(chalk.green(`Successfully processed ${successful.length} editor(s):`));
      successful.forEach(r => {
        if (r.count > 0) {
          console.log(chalk.green(`  • ${r.editor}: ${r.count} rule(s) installed`));
        } else {
          console.log(chalk.yellow(`  • ${r.editor}: no rules found to install`));
        }
      });
    }
    
    if (failed.length > 0) {
      console.log(chalk.red(`Failed to process ${failed.length} editor(s):`));
      failed.forEach(r => {
        console.log(chalk.red(`  • ${r.editor}: installation failed`));
      });
    }
    
    console.log(chalk.blue(`Total rules installed across all editors: ${totalRulesInstalled}`));
    
    if (totalRulesInstalled === 0 && successful.length > 0) {
      console.log(chalk.yellow("No rules were found to install from the specified source(s)."));
    }
  }
}
