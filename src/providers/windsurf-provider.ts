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
import chalk from "chalk";

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
   * Format and append a rule directly from a RuleConfig object.
   * If a rule with the same name (tag) already exists, its content is updated.
   */
  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const destPath = targetPath;
    ensureTargetDir(destPath);

    const ruleContent = this.generateRuleContent(config, options);
    const startTag = `<${config.name}>`;
    const endTag = `</${config.name}>`;
    const newBlock = `${startTag}\n${config.content}\n${endTag}`;

    let fileContent = "";
    if (await fs.pathExists(destPath)) {
      fileContent = await fs.readFile(destPath, "utf-8");
    }

    const ruleNameRegex = config.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `^<${ruleNameRegex}>[\\s\\S]*?</${ruleNameRegex}>`,
      "m"
    );

    let updatedContent: string;
    const match = fileContent.match(regex);

    if (match) {
      console.log(
        chalk.blue(`Updating existing rule block for "${config.name}" in ${destPath}...`)
      );
      updatedContent = fileContent.replace(regex, newBlock);
    } else {
      console.log(
        chalk.blue(`Appending new rule block for "${config.name}" to ${destPath}...`)
      );
      const separator = fileContent.trim().length > 0 ? "\n\n" : "";
      updatedContent = fileContent + separator + newBlock;
    }

    try {
      await fs.writeFile(destPath, updatedContent.trim() + "\n");
      return true;
    } catch (error) {
      console.error(
        chalk.red(`Error writing updated rules to ${destPath}: ${error}`)
      );
      return false;
    }
  }
}
