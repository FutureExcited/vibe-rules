import fs from "fs-extra";
import path from "path";
import {
  RuleConfig,
  RuleProvider,
  RuleType,
  RuleGeneratorOptions,
} from "../types";
import {
  getRulePath,
  getDefaultTargetPath,
  ensureTargetDir,
} from "../utils/path";

export class WindsurfRuleProvider implements RuleProvider {
  /**
   * Format rule content with XML tags
   */
  private formatRuleContent(config: RuleConfig): string {
    return `<${config.name}>\n${config.content}\n</${config.name}>`;
  }

  /**
   * Generates formatted rule content with Windsurf XML tags
   */
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    return this.formatRuleContent(config);
  }

  /**
   * Save a windsurf rule
   */
  async saveRule(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): Promise<string> {
    const rulePath = getRulePath(RuleType.WINDSURF, config.name);
    const content = this.formatRuleContent(config);

    await fs.writeFile(rulePath, content);
    return rulePath;
  }

  /**
   * Load a windsurf rule
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    const rulePath = getRulePath(RuleType.WINDSURF, name);

    if (!(await fs.pathExists(rulePath))) {
      return null;
    }

    const content = await fs.readFile(rulePath, "utf-8");

    // Extract content from XML tags if present
    const tagMatch = content.match(
      new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "m")
    );
    const ruleContent = tagMatch ? tagMatch[1].trim() : content;

    return {
      name,
      content: ruleContent,
    };
  }

  /**
   * List all windsurf rules
   */
  async listRules(): Promise<string[]> {
    const windsurfRulesDir = getRulePath(RuleType.WINDSURF, "");

    if (!(await fs.pathExists(windsurfRulesDir))) {
      return [];
    }

    const files = await fs.readdir(windsurfRulesDir);
    return files
      .filter((file) => !file.endsWith(".mdc")) // Not cursor files
      .map((file) => path.basename(file, ".txt"));
  }

  /**
   * Append a windsurf rule to a target file
   */
  async appendRule(name: string, targetPath?: string): Promise<boolean> {
    const rule = await this.loadRule(name);

    if (!rule) {
      return false;
    }

    const destPath = targetPath || getDefaultTargetPath(RuleType.WINDSURF);
    ensureTargetDir(destPath);

    // For windsurf, append to an existing file or create a new one
    const formattedRule = this.formatRuleContent(rule);

    if (await fs.pathExists(destPath)) {
      // Append to existing file
      await fs.appendFile(destPath, `\n\n${formattedRule}`);
    } else {
      // Create new file
      await fs.writeFile(destPath, formattedRule);
    }

    return true;
  }

  /**
   * Format and append a rule directly from a RuleConfig object
   */
  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string
  ): Promise<boolean> {
    const destPath = targetPath || getDefaultTargetPath(RuleType.WINDSURF);
    ensureTargetDir(destPath);

    // Format the content with XML tags
    const formattedRule = this.formatRuleContent(config);

    if (await fs.pathExists(destPath)) {
      // Append to existing file
      await fs.appendFile(destPath, `\n\n${formattedRule}`);
    } else {
      // Create new file
      await fs.writeFile(destPath, formattedRule);
    }

    return true;
  }
}
