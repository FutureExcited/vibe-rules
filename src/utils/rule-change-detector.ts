import { RuleConfig, RuleGeneratorOptions, RuleType, RuleProvider } from "../types.js";
import { getRulePath, slugifyRuleName } from "./path.js";
import { pathExists } from "fs-extra/esm";
import { readFile } from "fs/promises";
import { VibePackageRulesSchema } from "../schemas.js";
import { debugLog } from "./debug.js";

/**
 * Checks if all rules from a package would be unchanged if reinstalled
 * @param defaultExport The exported rules from the package
 * @param pkgName Package name
 * @param editorType Target editor type
 * @param provider Rule provider instance
 * @param installOptions Install options
 * @returns true if all rules are unchanged, false if any rule would change
 */
export async function areAllRulesUnchanged(
  defaultExport: any,
  pkgName: string,
  editorType: RuleType,
  provider: RuleProvider,
  installOptions: { global?: boolean; debug?: boolean }
): Promise<boolean> {
  let allRulesUnchanged = true;
  let preCheckRules: (RuleConfig & { alwaysApply?: boolean; globs?: string | string[] })[] = [];

  // First, prepare the rules that would be installed to check against existing content
  if (typeof defaultExport === "string") {
    let ruleName = slugifyRuleName(pkgName);
    if (!ruleName.startsWith(`${pkgName}_`)) {
      ruleName = `${pkgName}_${ruleName}`;
    }
    preCheckRules = [
      {
        name: ruleName,
        content: defaultExport,
        description: `Rule from ${pkgName}`,
      },
    ];
  } else if (Array.isArray(defaultExport)) {
    const validationResult = VibePackageRulesSchema.safeParse(defaultExport);
    if (validationResult.success) {
      const items = validationResult.data;
      for (const [index, item] of items.entries()) {
        if (typeof item === "string") {
          const ruleName = slugifyRuleName(`${pkgName}_${index}`);
          preCheckRules.push({
            name: ruleName,
            content: item,
            description: `Rule from ${pkgName}`,
          });
        } else if (typeof item === "object" && item.name && item.rule) {
          let ruleNameFromExport = item.name;
          if (!ruleNameFromExport.startsWith(`${pkgName}_`)) {
            ruleNameFromExport = `${pkgName}_${ruleNameFromExport}`;
          }
          preCheckRules.push({
            name: ruleNameFromExport,
            content: item.rule,
            description: item.description || `Rule from ${pkgName}`,
            ...(item.alwaysApply !== undefined && { alwaysApply: item.alwaysApply }),
            ...(item.globs !== undefined && { globs: item.globs }),
          });
        }
      }
    }
  }

  // Check if any rule content would actually change
  if (preCheckRules.length > 0) {
    for (const ruleConfig of preCheckRules) {
      const finalTargetPath = getRulePath(editorType, ruleConfig.name, installOptions.global);
      const generatorOptions: RuleGeneratorOptions = {
        description: ruleConfig.description,
        isGlobal: installOptions.global,
        debug: installOptions.debug,
        alwaysApply: ruleConfig.alwaysApply,
        globs: ruleConfig.globs,
      };

      try {
        const newContent = provider.generateRuleContent(ruleConfig, generatorOptions);
        if (await pathExists(finalTargetPath)) {
          const existingContent = await readFile(finalTargetPath, "utf-8");
          debugLog(`Comparing content for ${ruleConfig.name}:`);
          debugLog(`Existing length: ${existingContent.length}, New length: ${newContent.length}`);
          if (existingContent.trim() !== newContent.trim()) {
            debugLog(`Content changed for ${ruleConfig.name}, proceeding with install`);
            allRulesUnchanged = false;
            break;
          } else {
            debugLog(`Content unchanged for ${ruleConfig.name}`);
          }
        } else {
          // File doesn't exist, so this is a change
          debugLog(`File ${finalTargetPath} doesn't exist, treating as changed`);
          allRulesUnchanged = false;
          break;
        }
      } catch (error) {
        // If we can't check, assume it changed
        debugLog(`Error checking content for ${ruleConfig.name}: ${error}`);
        allRulesUnchanged = false;
        break;
      }
    }
  }

  return allRulesUnchanged;
}
