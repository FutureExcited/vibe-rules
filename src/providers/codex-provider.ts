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
} from "../utils/path";
import {
  formatRuleWithMetadata,
  createTaggedRuleBlock,
} from "../utils/rule-formatter";
import chalk from "chalk";
import * as fsPromises from "fs/promises";
import { appendOrUpdateTaggedBlock } from "../utils/single-file-helpers";

export class CodexRuleProvider implements RuleProvider {
  private readonly ruleType = RuleType.CODEX;

  /**
   * Generates formatted content for Codex including metadata.
   */
  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    return formatRuleWithMetadata(config, options);
  }

  /**
   * Saves the rule definition internally.
   */
  async saveRule(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): Promise<string> {
    const internalPath = getInternalRuleStoragePath(this.ruleType, config.name);
    await fsPromises.writeFile(internalPath, config.content);
    return internalPath;
  }

  /**
   * Loads a rule definition from internal storage.
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    const internalPath = getInternalRuleStoragePath(this.ruleType, name);
    try {
      const content = await fsPromises.readFile(internalPath, "utf-8");
      return { name, content, description: `Internally stored rule: ${name}` };
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File not found, expected if rule doesn't exist
        return null;
      }
      console.error(
        `Error loading rule "${name}" from ${internalPath}:`,
        error
      );
      throw error; // Re-throw other errors
    }
  }

  /**
   * Lists rules from internal storage.
   */
  async listRules(): Promise<string[]> {
    const rulesDir = path.dirname(
      getInternalRuleStoragePath(this.ruleType, "dummy")
    );
    try {
      const files = await fsPromises.readdir(rulesDir);
      return files
        .filter((file) => file.endsWith(".txt"))
        .map((file) => path.basename(file, ".txt"));
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // Directory not found, means no rules saved yet
        return [];
      }
      console.error(`Error listing rules from ${rulesDir}:`, error);
      throw error; // Re-throw other errors
    }
  }

  /**
   * Applies a rule by updating the <vibe-tools> section in the target codex.md/instructions.md.
   */
  async appendRule(
    name: string,
    targetPath?: string,
    isGlobal: boolean = false,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const ruleConfig = await this.loadRule(name);
    if (!ruleConfig) {
      console.error(`Rule "${name}" not found in internal storage.`);
      return false;
    }
    const actualTargetPath =
      targetPath ?? getRulePath(this.ruleType, "", isGlobal);
    return this.appendFormattedRule(
      ruleConfig,
      actualTargetPath,
      isGlobal,
      options
    );
  }

  /**
   * Formats and applies a rule directly from a RuleConfig object using XML-like tags.
   * If a rule with the same name (tag) already exists, its content is updated.
   */
  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal?: boolean | undefined,
    options?: RuleGeneratorOptions | undefined
  ): Promise<boolean> {
    return appendOrUpdateTaggedBlock(
      targetPath,
      config,
      options,
      true // Append inside <vibe-tools Integration>
    );
  }
}
