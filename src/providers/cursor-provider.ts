import * as path from "path";
import { writeFile } from "fs/promises";
import { RuleConfig, RuleProvider, RuleGeneratorOptions, RuleType } from "../types.js";
import { getRulePath, ensureDirectoryExists } from "../utils/path.js";
import { saveInternalRule, loadInternalRule, listInternalRules } from "../utils/rule-storage.js";

// Custom function to format frontmatter simply
const formatFrontmatter = (fm: Record<string, any>): string => {
  let result = "";
  if (fm.description) {
    result += `description: ${fm.description}\n`;
  }
  if (fm.globs) {
    if (fm.debug) {
      console.log(`[Debug] Formatting globs: ${JSON.stringify(fm.globs)}`);
    }
    const globsString = Array.isArray(fm.globs) ? fm.globs.join(",") : fm.globs;
    if (globsString) {
      result += `globs: ${globsString}\n`;
    }
  }
  if (fm.alwaysApply === false) {
    result += `alwaysApply: false\n`;
  } else if (fm.alwaysApply === true) {
    result += `alwaysApply: true\n`;
  }
  return result.trim();
};

export class CursorRuleProvider implements RuleProvider {
  /**
   * Generate cursor rule content with frontmatter
   */
  generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string {
    const frontmatter: Record<string, any> = {};
    if (options?.description ?? config.description) {
      frontmatter.description = options?.description ?? config.description;
    }
    if (options?.globs) {
      frontmatter.globs = options.globs;
    }
    if (options?.alwaysApply !== undefined) {
      frontmatter.alwaysApply = options.alwaysApply;
    }
    if (options?.debug) {
      frontmatter.debug = options.debug;
    }

    const frontmatterString =
      Object.keys(frontmatter).length > 0 ? `---\n${formatFrontmatter(frontmatter)}\n---\n` : "";

    return `${frontmatterString}${config.content}`;
  }

  /**
   * Saves a rule definition to internal storage for later use.
   * @param config - The rule configuration.
   * @returns Path where the rule definition was saved internally.
   */
  async saveRule(config: RuleConfig): Promise<string> {
    // Use the utility function to save to internal storage
    return saveInternalRule(RuleType.CURSOR, config);
  }

  /**
   * Loads a rule definition from internal storage.
   * @param name - The name of the rule to load.
   * @returns The RuleConfig if found, otherwise null.
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    // Use the utility function to load from internal storage
    return loadInternalRule(RuleType.CURSOR, name);
  }

  /**
   * Lists rule definitions available in internal storage.
   * @returns An array of rule names.
   */
  async listRules(): Promise<string[]> {
    // Use the utility function to list rules from internal storage
    return listInternalRules(RuleType.CURSOR);
  }

  /**
   * Append a cursor rule to a target file
   */
  async appendRule(name: string, targetPath?: string, isGlobal?: boolean): Promise<boolean> {
    const ruleConfig = await this.loadRule(name);
    if (!ruleConfig) {
      console.error(`Rule "${name}" not found in internal Cursor storage.`);
      return false;
    }
    const finalTargetPath = targetPath || getRulePath(RuleType.CURSOR, name, isGlobal);
    return this.appendFormattedRule(ruleConfig, finalTargetPath, isGlobal);
  }

  /**
   * Formats and applies a rule directly from a RuleConfig object.
   * Creates the .cursor/rules directory if it doesn't exist.
   * Uses slugified rule name for the filename.
   */
  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal: boolean = false,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const fullPath = targetPath;
    const dir = path.dirname(fullPath);

    try {
      await ensureDirectoryExists(dir); // Ensure the PARENT directory exists
      const formattedContent = this.generateRuleContent(config, options); // Pass options
      await writeFile(fullPath, formattedContent, "utf-8");
      return true;
    } catch (error) {
      console.error(`Error applying Cursor rule "${config.name}" to ${fullPath}:`, error);
      return false;
    }
  }
}
