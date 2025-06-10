import * as fs from "fs-extra/esm";
import { writeFile, readFile, readdir } from "fs/promises";
import * as path from "path";
import { RuleConfig, RuleType, StoredRuleConfig } from "../types.js";
import { StoredRuleConfigSchema } from "../schemas.js";
import { getInternalRuleStoragePath, getCommonRulesDir } from "./path.js";

const RULE_EXTENSION = ".txt";
const STORED_RULE_EXTENSION = ".json";

/**
 * Saves a rule definition to the internal storage (~/.vibe-rules/<ruleType>/<name>.txt).
 * @param ruleType - The type of the rule, determining the subdirectory.
 * @param config - The rule configuration object containing name and content.
 * @returns The full path where the rule was saved.
 * @throws Error if file writing fails.
 */
export async function saveInternalRule(ruleType: RuleType, config: RuleConfig): Promise<string> {
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
    console.debug(`[Rule Storage] Listed ${ruleNames.length} internal rules for ${ruleType}`);
    return ruleNames;
  } catch (error: any) {
    console.error(`[Rule Storage] Error listing internal rules for ${ruleType}: ${error.message}`);
    return []; // Return empty list on error
  }
}

// --- Common Rule Storage Functions (for user-saved rules with metadata) ---

/**
 * Saves a rule with metadata to the common storage (~/.vibe-rules/rules/<name>.json).
 * @param config - The stored rule configuration object containing name, content, and metadata.
 * @returns The full path where the rule was saved.
 * @throws Error if validation or file writing fails.
 */
export async function saveCommonRule(config: StoredRuleConfig): Promise<string> {
  // Validate the configuration
  StoredRuleConfigSchema.parse(config);

  const commonRulesDir = getCommonRulesDir();
  const storagePath = path.join(commonRulesDir, `${config.name}${STORED_RULE_EXTENSION}`);

  await fs.ensureDir(commonRulesDir);
  await writeFile(storagePath, JSON.stringify(config, null, 2), "utf-8");
  console.debug(`[Rule Storage] Saved common rule with metadata: ${storagePath}`);
  return storagePath;
}

/**
 * Loads a rule with metadata from the common storage.
 * Falls back to legacy .txt format for backwards compatibility.
 * @param name - The name of the rule to load.
 * @returns The StoredRuleConfig object if found, otherwise null.
 */
export async function loadCommonRule(name: string): Promise<StoredRuleConfig | null> {
  const commonRulesDir = getCommonRulesDir();

  // Try new JSON format first
  const jsonPath = path.join(commonRulesDir, `${name}${STORED_RULE_EXTENSION}`);
  if (await fs.pathExists(jsonPath)) {
    try {
      const content = await readFile(jsonPath, "utf-8");
      const parsed = JSON.parse(content);
      const validated = StoredRuleConfigSchema.parse(parsed);
      console.debug(`[Rule Storage] Loaded common rule from JSON: ${jsonPath}`);
      return validated;
    } catch (error: any) {
      console.error(`[Rule Storage] Error parsing JSON rule ${name}: ${error.message}`);
      return null;
    }
  }

  // Fall back to legacy .txt format
  const txtPath = path.join(commonRulesDir, `${name}${RULE_EXTENSION}`);
  if (await fs.pathExists(txtPath)) {
    try {
      const content = await readFile(txtPath, "utf-8");
      console.debug(`[Rule Storage] Loaded common rule from legacy .txt: ${txtPath}`);
      return {
        name,
        content,
        metadata: {}, // No metadata in legacy format
      };
    } catch (error: any) {
      console.error(`[Rule Storage] Error loading legacy rule ${name}: ${error.message}`);
      return null;
    }
  }

  console.debug(`[Rule Storage] Common rule not found: ${name}`);
  return null;
}

/**
 * Lists the names of all rules stored in the common storage (both JSON and legacy .txt).
 * @returns An array of rule names.
 */
export async function listCommonRules(): Promise<string[]> {
  const commonRulesDir = getCommonRulesDir();

  try {
    if (!(await fs.pathExists(commonRulesDir))) {
      console.debug(`[Rule Storage] Common rules directory not found: ${commonRulesDir}`);
      return [];
    }

    const files = await readdir(commonRulesDir);
    const ruleNames = new Set<string>();

    // Add names from both .json and .txt files
    files.forEach((file) => {
      if (file.endsWith(STORED_RULE_EXTENSION)) {
        ruleNames.add(path.basename(file, STORED_RULE_EXTENSION));
      } else if (file.endsWith(RULE_EXTENSION)) {
        ruleNames.add(path.basename(file, RULE_EXTENSION));
      }
    });

    const result = Array.from(ruleNames);
    console.debug(`[Rule Storage] Listed ${result.length} common rules`);
    return result;
  } catch (error: any) {
    console.error(`[Rule Storage] Error listing common rules: ${error.message}`);
    return [];
  }
}
