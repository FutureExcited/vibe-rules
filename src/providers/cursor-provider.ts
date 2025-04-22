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
  getDefaultTargetPath,
  ensureTargetDir,
} from "../utils/path";

export class CursorRuleProvider implements RuleProvider {
  /**
   * Generate cursor rule content with frontmatter
   */
  private generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    const description =
      options?.description || config.description || `Rule for ${config.name}`;
    const isGlobal = options?.isGlobal ?? false;

    const frontmatter = [
      "---",
      `description: ${description}`,
      `globs: *,**/*`,
      isGlobal ? "alwaysApply: true" : "",
      "---",
      "",
    ]
      .filter(Boolean)
      .join("\n");

    return `${frontmatter}${config.content}`;
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
  async appendRule(name: string, targetPath?: string): Promise<boolean> {
    const rule = await this.loadRule(name);

    if (!rule) {
      return false;
    }

    const destPath =
      targetPath ||
      path.join(getDefaultTargetPath(RuleType.CURSOR), `${name}.mdc`);
    ensureTargetDir(destPath);

    // For cursor, we typically create a new file
    await fs.writeFile(destPath, this.generateRuleContent(rule));

    return true;
  }

  /**
   * Format and append a rule directly from a RuleConfig object
   */
  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string
  ): Promise<boolean> {
    const destPath =
      targetPath ||
      path.join(getDefaultTargetPath(RuleType.CURSOR), `${config.name}.mdc`);
    ensureTargetDir(destPath);

    // Create formatted content with frontmatter
    const content = this.generateRuleContent(config);

    // For cursor, create a new file
    await fs.writeFile(destPath, content);

    return true;
  }
}
