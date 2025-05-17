import path from "path";
import os from "os";
import fs from "fs-extra";
import { RuleType } from "../types";
import { debugLog } from "../cli";

// Base directory for storing internal rule definitions
export const RULES_BASE_DIR = path.join(os.homedir(), ".vibe-rules");

// Home directories for specific IDEs/Tools
export const CLAUDE_HOME_DIR = path.join(os.homedir(), ".claude");
export const CODEX_HOME_DIR = path.join(os.homedir(), ".codex");
export const ZED_RULES_FILE = ".rules"; // Added for Zed

/**
 * Get the common rules directory path
 */
export function getCommonRulesDir(): string {
  const rulesDir = path.join(RULES_BASE_DIR, "rules");
  fs.ensureDirSync(rulesDir);
  return rulesDir;
}

/**
 * Get path to store internal rule definitions based on rule type
 * (Not the actual target paths for IDEs)
 */
export function getInternalRuleStoragePath(
  ruleType: RuleType,
  ruleName: string
): string {
  const typeDir = path.join(RULES_BASE_DIR, ruleType);
  fs.ensureDirSync(typeDir);
  // Internal storage uses a simple .txt for content
  return path.join(typeDir, `${ruleName}.txt`);
}

/**
 * Get the expected file path for a rule based on its type and context (local/global).
 * This now returns the actual path where the rule should exist for the IDE/tool.
 * The 'isGlobal' flag determines if we should use the home directory path.
 */
export function getRulePath(
  ruleType: RuleType,
  ruleName: string, // ruleName might not be relevant for some types like Claude/Codex global
  isGlobal: boolean = false,
  projectRoot: string = process.cwd()
): string {
  switch (ruleType) {
    case RuleType.CURSOR:
      // Cursor rules are typically project-local in .cursor/rules/
      const cursorDir = path.join(projectRoot, ".cursor", "rules");
      // Use slugified name for the file
      return path.join(cursorDir, `${slugifyRuleName(ruleName)}.mdc`);
    case RuleType.WINDSURF:
      // Windsurf rules are typically project-local .windsurfrules file
      return path.join(projectRoot, ".windsurfrules"); // Single file, name not used for path
    case RuleType.CLAUDE_CODE:
      // Claude rules are CLAUDE.md, either global or local
      return isGlobal
        ? path.join(CLAUDE_HOME_DIR, "CLAUDE.md")
        : path.join(projectRoot, "CLAUDE.md");
    case RuleType.CODEX:
      // Codex uses instructions.md (global) or codex.md (local)
      return isGlobal
        ? path.join(CODEX_HOME_DIR, "instructions.md")
        : path.join(projectRoot, "codex.md");
    case RuleType.CLINERULES:
    case RuleType.ROO:
      // Cline/Roo rules are project-local files in .clinerules/
      return path.join(
        projectRoot,
        ".clinerules",
        slugifyRuleName(ruleName) + ".md" // Use .md extension
      );
    case RuleType.ZED: // Added for Zed
      return path.join(projectRoot, ZED_RULES_FILE);
    case RuleType.UNIFIED:
      return path.join(projectRoot, ".rules"); // Unified also uses .rules in project root
    case RuleType.CUSTOM:
    default:
      // Fallback for custom or unknown - store internally for now
      // Or maybe this should throw an error?
      return getInternalRuleStoragePath(ruleType, ruleName);
  }
}

/**
 * Get the default target path (directory or file) where a rule type is typically applied.
 * This is used by commands like 'apply' if no specific target is given.
 * Note: This might overlap with getRulePath for some types.
 * Returns potential paths based on convention.
 */
export function getDefaultTargetPath(
  ruleType: RuleType,
  isGlobalHint: boolean = false // Hint for providers like Claude/Codex
): string {
  switch (ruleType) {
    case RuleType.CURSOR:
      // Default target is the rules directory within .cursor
      return path.join(process.cwd(), ".cursor", "rules");
    case RuleType.WINDSURF:
      // Default target is the .windsurfrules file
      return path.join(process.cwd(), ".windsurfrules");
    case RuleType.CLAUDE_CODE:
      // Default target depends on global hint
      return isGlobalHint
        ? CLAUDE_HOME_DIR // Directory
        : process.cwd(); // Project root (for local CLAUDE.md)
    case RuleType.CODEX:
      // Default target depends on global hint
      return isGlobalHint
        ? CODEX_HOME_DIR // Directory
        : process.cwd(); // Project root (for local codex.md)
    case RuleType.CLINERULES:
    case RuleType.ROO:
      // Default target is the .clinerules directory
      return path.join(process.cwd(), ".clinerules");
    case RuleType.ZED: // Added for Zed
      return path.join(process.cwd(), ZED_RULES_FILE);
    case RuleType.UNIFIED:
      return path.join(process.cwd(), ".rules");
    default:
      console.warn(
        `Default target path not defined for rule type: ${ruleType}, defaulting to CWD.`
      );
      return process.cwd();
  }
}

/**
 * Ensures that a specific directory exists, creating it if necessary.
 *
 * @param dirPath The absolute or relative path to the directory to ensure.
 */
export function ensureDirectoryExists(dirPath: string): void {
  try {
    fs.ensureDirSync(dirPath);
    debugLog(`Ensured directory exists: ${dirPath}`);
  } catch (err: any) {
    console.error(`Failed to ensure directory ${dirPath}:`, err);
    // Depending on the desired behavior, you might want to re-throw or exit
    // throw err;
  }
}

/**
 * Convert a rule name to a filename-safe slug.
 */
export function slugifyRuleName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "-")
    .replace(/^-|-$/g, "");
}
