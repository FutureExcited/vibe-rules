import fs, { pathExists } from "fs-extra/esm";
import { stat, readFile, writeFile, readdir } from "fs/promises";
import path from "path";
import chalk from "chalk";
import { createRequire } from "module";
// This is required until --experimental-import-meta-resolve is supported by Node.js by default
// https://nodejs.org/api/esm.html#importmetaresolvespecifier
import { resolve as importMetaResolve } from "import-meta-resolve";
import {
  RuleType,
  RuleConfig,
  RuleGeneratorOptions,
  RuleProvider,
  RuleTypeArray,
} from "../types.js";
import { getRuleProvider } from "../providers/index.js";
import {
  getDefaultTargetPath,
  getRulePath,
  slugifyRuleName,
} from "../utils/path.js";
import { VibePackageRulesSchema } from "../schemas.js";
import { isDebugEnabled, debugLog } from "../cli.js"; // Assuming these will be exported from cli.ts

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
      const stats = await stat(defaultPath);
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

      const content = await readFile(potentialTargetFile, "utf-8");
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
        await writeFile(potentialTargetFile, newContent, "utf-8");
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

    const files = await readdir(targetDir);
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
    module = createRequire(path.join(process.cwd(), 'package.json'))(ruleModulePath);
    debugLog(`Successfully imported using require.`);
  } catch (error: any) {
    
      debugLog(
        `Require failed (${error.code || 'ESM-related error'}). Falling back to dynamic import()...`
      );
      try{
        const fileUrlString = `file://${process.cwd()}/package.json`;
        debugLog(`trying to resolve ${ruleModulePath} with importMetaResolve`, fileUrlString);
        const importPath = importMetaResolve(ruleModulePath, fileUrlString);
        debugLog(`Falling back to dynamic import() path: ${importPath}`);
        module = await import(importPath);
        debugLog(`Successfully imported using dynamic import().`);
      } catch (importError: any) {
        debugLog(
          `Dynamic import() failed for ${ruleModulePath}: ${importError.message}`
        );
        throw importError;
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
    // Check if package exports ./llms and if the file actually exists
    try {
      const pkgJsonPath = `${pkgName}/package.json`;
      const pkgJson = await importModuleFromCwd(pkgJsonPath);
      const exports = pkgJson?.default?.exports || pkgJson?.exports;
      
      debugLog(`Package ${pkgName} exports: ${JSON.stringify(exports, null, 2)}`);
      
      if (exports && !exports['./llms']) {
        debugLog(`Package ${pkgName} does not export ./llms in package.json. Skipping.`);
        return 0;
      }
      
      if (exports && exports['./llms']) {
        debugLog(`Package ${pkgName} exports ./llms: ${JSON.stringify(exports['./llms'], null, 2)}`);
        debugLog(`Package ${pkgName} has ./llms export, proceeding with import attempt.`);
      }
    } catch (pkgError: any) {
      debugLog(`Could not check package.json for ${pkgName}: ${pkgError.message}. Proceeding anyway.`);
    }

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
 * Handles the 'install' command logic.
 * Installs rules from an NPM package or all dependencies into an editor configuration.
 * @param editor Target editor type (cursor, windsurf, claude-code, codex, clinerules, roo)
 * @param packageName Optional NPM package name to install rules from
 * @param options Command options including global, target, and debug
 */
export async function installCommandAction(
  editor: string,
  packageName: string | undefined,
  options: { global?: boolean; target?: string; debug?: boolean }
): Promise<void> {
  const editorType = editor.toLowerCase() as RuleType;
  let provider: RuleProvider;
  const combinedOptions = { ...options, debug: isDebugEnabled }; // Use isDebugEnabled from cli.ts

  try {
    provider = getRuleProvider(editorType);
  } catch (e) {
    console.error(chalk.red(`Invalid editor type specified: ${editor}`));
    process.exit(1);
  }

  if (packageName) {
    // VSCode-specific warning about glob limitations
    if (editorType === RuleType.VSCODE) {
      console.log(
        chalk.yellow(
          `[vibe-rules] Note: Due to VSCode's applyTo field limitations with multiple globs, all rules will be applied universally (**) for better reliability.`
        )
      );
    }
    
    const count = await installSinglePackage(
      packageName,
      editorType,
      provider,
      combinedOptions
    );
    if (!isDebugEnabled && count > 0) {
      console.log(
        chalk.green(
          `[vibe-rules] Successfully installed ${count} rule(s) from package '${packageName}'.`
        )
      );
    }
  } else {
    console.log(
      chalk.blue(
        `[vibe-rules] Installing rules from all dependencies in package.json for ${editor}...`
      )
    );
    
    // VSCode-specific warning about glob limitations
    if (editorType === RuleType.VSCODE) {
      console.log(
        chalk.yellow(
          `[vibe-rules] Note: Due to VSCode's applyTo field limitations with multiple globs, all rules will be applied universally (**) for better reliability.`
        )
      );
    }
    try {
      const pkgJsonPath = path.join(process.cwd(), "package.json");
      if (!(await pathExists(pkgJsonPath))) {
        console.error(
          chalk.red("package.json not found in the current directory.")
        );
        process.exit(1);
      }
      const pkgJsonContent = await readFile(pkgJsonPath, "utf-8");
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

      debugLog(
        chalk.blue(
          `Found ${allDeps.length} dependencies. Checking for rules to install for ${editor}...`
        )
      );
      let totalRulesInstalled = 0;
      for (const depName of allDeps) {
        totalRulesInstalled += await installSinglePackage(
          depName,
          editorType,
          provider,
          combinedOptions
        );
      }
      if (!isDebugEnabled && totalRulesInstalled > 0) {
        console.log(
          chalk.green(
            `[vibe-rules] Finished installing rules from dependencies. Total rules installed: ${totalRulesInstalled}.`
          )
        );
      } else if (
        !isDebugEnabled &&
        totalRulesInstalled === 0 &&
        allDeps.length > 0
      ) {
        console.log(
          chalk.yellow(
            "[vibe-rules] No rules found to install from dependencies."
          )
        );
      }

      debugLog(chalk.green("Finished checking all dependencies."));
    } catch (error) {
      console.error(
        chalk.red(
          `Error processing package.json: ${
            error instanceof Error ? error.message : error
          }`
        )
      );
      process.exit(1);
    }
  }
}
