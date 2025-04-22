import path from "path";
import os from "os";
import fs from "fs-extra";
import { RuleType } from "../types";

// Base directory for storing rules
export const RULES_BASE_DIR = path.join(os.homedir(), ".vibe-rules");

/**
 * Get the common rules directory path
 */
export function getCommonRulesDir(): string {
  const rulesDir = path.join(RULES_BASE_DIR, "rules");
  fs.ensureDirSync(rulesDir);
  return rulesDir;
}

/**
 * Get path to store rule files based on rule type
 */
export function getRuleTypePath(ruleType: RuleType): string {
  const typePath = path.join(RULES_BASE_DIR, ruleType);
  fs.ensureDirSync(typePath);
  return typePath;
}

/**
 * Get the full path for a specific rule
 */
export function getRulePath(ruleType: RuleType, ruleName: string): string {
  const extension = ruleType === RuleType.CURSOR ? ".mdc" : ".txt";
  return path.join(getRuleTypePath(ruleType), `${ruleName}${extension}`);
}

/**
 * Get the path for a rule in the common rules directory
 */
export function getCommonRulePath(ruleName: string): string {
  return path.join(getCommonRulesDir(), `${ruleName}.txt`);
}

/**
 * Get the default target path for a rule
 */
export function getDefaultTargetPath(ruleType: RuleType): string {
  switch (ruleType) {
    case RuleType.CURSOR:
      return path.join(process.cwd(), ".cursor", "rules");
    case RuleType.WINDSURF:
      return path.join(process.cwd(), ".windsurfrules");
    default:
      return process.cwd();
  }
}

/**
 * Ensures the target directory exists
 */
export function ensureTargetDir(targetPath: string): void {
  fs.ensureDirSync(path.dirname(targetPath));
}
