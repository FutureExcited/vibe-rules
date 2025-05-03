import fs from "fs-extra";
import path from "path";
import {
  RuleConfig,
  RuleProvider,
  RuleGeneratorOptions,
  RuleType,
} from "../types";
import {
  getRulePath,
  getInternalRuleStoragePath,
  getDefaultTargetPath,
  slugifyRuleName,
} from "../utils/path";
import {
  formatRuleWithMetadata,
  createTaggedRuleBlock,
} from "../utils/rule-formatter";
import chalk from "chalk";

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
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
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
      Object.keys(frontmatter).length > 0
        ? `---\n${formatFrontmatter(frontmatter)}\n---\n`
        : "";

    return `${frontmatterString}${config.content}`;
  }

  /**
   * Save a cursor rule
   */
  async saveRule(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): Promise<string> {
    const rulePath = getRulePath(RuleType.CURSOR, config.name);
    const content = this.generateRuleContent(config, options);

    await fs.writeFile(rulePath, content);
    return rulePath;
  }

  /**
   * Load a cursor rule
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    const rulePath = getRulePath(RuleType.CURSOR, name);

    if (!(await fs.pathExists(rulePath))) {
      return null;
    }

    const content = await fs.readFile(rulePath, "utf-8");

    // Basic parsing of frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let description = "";

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const descMatch = frontmatter.match(/description:\s*(.+)$/m);
      if (descMatch) {
        description = descMatch[1].trim();
      }
    }

    return {
      name,
      content: frontmatterMatch ? frontmatterMatch[2] : content,
      description,
    };
  }

  /**
   * List all cursor rules
   */
  async listRules(): Promise<string[]> {
    const cursorRulesDir = getDefaultTargetPath(RuleType.CURSOR);

    if (!(await fs.pathExists(cursorRulesDir))) {
      return [];
    }

    const files = await fs.readdir(cursorRulesDir);
    return files
      .filter((file) => file.endsWith(".mdc"))
      .map((file) => path.basename(file, ".mdc"));
  }

  /**
   * Append a cursor rule to a target file
   */
  async appendRule(
    name: string,
    targetPath?: string,
    isGlobal?: boolean
  ): Promise<boolean> {
    const ruleConfig = await this.loadRule(name);
    if (!ruleConfig) {
      console.error(`Rule "${name}" not found in internal Cursor storage.`);
      return false;
    }
    const finalTargetPath =
      targetPath || getRulePath(RuleType.CURSOR, name, isGlobal);
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
    _isGlobal?: boolean, // Cursor rules are typically local
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const destinationPath = targetPath; // Keep original target path

    // Ensure the directory for the file exists using fs-extra
    fs.ensureDirSync(path.dirname(destinationPath));

    const newBlock = createTaggedRuleBlock(config, options);

    let fileContent = "";

    try {
      const formattedContent = this.generateRuleContent(config, options);
      fileContent = formattedContent;
      await fs.writeFile(destinationPath, fileContent, "utf-8");
      return true;
    } catch (error) {
      console.error(
        `Error applying Cursor rule "${config.name}" to ${destinationPath}:`,
        error
      );
      return false;
    }
  }
}
