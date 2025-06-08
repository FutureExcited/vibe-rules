import * as fs from "fs-extra/esm";
import { writeFile, readFile, readdir } from "fs/promises";
import * as path from "path";
import { RuleConfig, RuleType } from "../types.js";
import { getInternalRuleStoragePath } from "./path.js";

const RULE_EXTENSION = ".txt";

/**
 * Saves a rule definition to the internal storage (~/.vibe-rules/<ruleType>/<name>.txt).
 * @param ruleType - The type of the rule, determining the subdirectory.
 * @param config - The rule configuration object containing name and content.
 * @returns The full path where the rule was saved.
 * @throws Error if file writing fails.
 */
export async function saveInternalRule(
  ruleType: RuleType,
  config: RuleConfig
): Promise<string> {
  const storagePath = getInternalRuleStoragePath(ruleType, config.name);
  const dir = path.dirname(storagePath);
  await fs.ensureDir(dir); // Ensure the directory exists
  await writeFile(storagePath, config.content, "utf-8");
  console.debug(`[Rule Storage] Saved internal rule: ${storagePath}`);
  return storagePath;
}

/**
 * Loads a rule definition from the internal storage.
 * @param ruleType - The type of the rule.
 * @param name - The name of the rule to load.
 * @returns The RuleConfig object if found, otherwise null.
 */
export async function loadInternalRule(
  ruleType: RuleType,
  name: string
): Promise<RuleConfig | null> {
  const storagePath = getInternalRuleStoragePath(ruleType, name);
  try {
    if (!(await fs.pathExists(storagePath))) {
      console.debug(`[Rule Storage] Internal rule not found: ${storagePath}`);
      return null;
    }
    const content = await readFile(storagePath, "utf-8");
    console.debug(`[Rule Storage] Loaded internal rule: ${storagePath}`);
    return { name, content };
  } catch (error: any) {
    // Log other errors but still return null as the rule couldn't be loaded
    console.error(
      `[Rule Storage] Error loading internal rule ${name} (${ruleType}): ${error.message}`
    );
    return null;
  }
}

/**
 * Lists the names of all rules stored internally for a given rule type.
 * @param ruleType - The type of the rule.
 * @returns An array of rule names.
 */
export async function listInternalRules(ruleType: RuleType): Promise<string[]> {
  // Use getInternalRuleStoragePath with a dummy name to get the directory path
  const dummyPath = getInternalRuleStoragePath(ruleType, "__dummy__");
  const storageDir = path.dirname(dummyPath);

  try {
    if (!(await fs.pathExists(storageDir))) {
      console.debug(
        `[Rule Storage] Internal rule directory not found for ${ruleType}: ${storageDir}`
      );
      return []; // Directory doesn't exist, no rules
    }
    const files = await readdir(storageDir);
    const ruleNames = files
      .filter((file) => file.endsWith(RULE_EXTENSION))
      .map((file) => path.basename(file, RULE_EXTENSION));
    console.debug(
      `[Rule Storage] Listed ${ruleNames.length} internal rules for ${ruleType}`
    );
    return ruleNames;
  } catch (error: any) {
    console.error(
      `[Rule Storage] Error listing internal rules for ${ruleType}: ${error.message}`
    );
    return []; // Return empty list on error
  }
}
