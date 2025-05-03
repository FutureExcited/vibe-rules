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
  getInternalRuleStoragePath,
  getDefaultTargetPath,
} from "../utils/path";
import {
  formatRuleWithMetadata,
  createTaggedRuleBlock,
} from "../utils/rule-formatter";
import { appendOrUpdateTaggedBlock } from "../utils/single-file-helpers";
import chalk from "chalk";

export class WindsurfRuleProvider implements RuleProvider {
  private readonly ruleType = RuleType.WINDSURF;

  /**
   * Format rule content with XML tags
   */
  private formatRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    return createTaggedRuleBlock(config, options);
  }

  /**
   * Generates formatted rule content with Windsurf XML tags
   */
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    return this.formatRuleContent(config, options);
  }

  /**
   * Save a windsurf rule
   */
  async saveRule(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): Promise<string> {
    const rulePath = getRulePath(RuleType.WINDSURF, config.name);
    const content = this.formatRuleContent(config, options);

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
  async appendRule(
    name: string,
    targetPath?: string,
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const rule = await this.loadRule(name);
    if (!rule) {
      console.error(`Rule '${name}' not found for type ${this.ruleType}.`);
      return false;
    }
    // Windsurf typically doesn't use global paths or specific rule name paths for the target
    // It uses a single default file.
    const destinationPath = targetPath || getDefaultTargetPath(this.ruleType);

    return this.appendFormattedRule(rule, destinationPath, false, options);
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
    // Delegate to the shared helper
    return appendOrUpdateTaggedBlock(targetPath, config, options, false);
  }
}
