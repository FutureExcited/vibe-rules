import {
  RuleConfig,
  RuleProvider,
  RuleGeneratorOptions,
  RuleType,
} from "../types.js";
import { getRulePath, getDefaultTargetPath } from "../utils/path.js";
import {
  formatRuleWithMetadata,
  createTaggedRuleBlock,
} from "../utils/rule-formatter.js";
import chalk from "chalk";
import * as fsPromises from "fs/promises";
import { appendOrUpdateTaggedBlock } from "../utils/single-file-helpers.js";
import {
  saveInternalRule,
  loadInternalRule,
  listInternalRules,
} from "../utils/rule-storage.js";

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
   * Saves a rule definition to internal storage for later use.
   * @param config - The rule configuration.
   * @returns Path where the rule definition was saved internally.
   */
  async saveRule(config: RuleConfig): Promise<string> {
    return saveInternalRule(this.ruleType, config);
  }

  /**
   * Loads a rule definition from internal storage.
   * @param name - The name of the rule to load.
   * @returns The RuleConfig if found, otherwise null.
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    return loadInternalRule(this.ruleType, name);
  }

  /**
   * Lists rule definitions available in internal storage.
   * @returns An array of rule names.
   */
  async listRules(): Promise<string[]> {
    return listInternalRules(this.ruleType);
  }

  /**
   * Appends a rule loaded from internal storage to the target Codex file.
   * @param name - The name of the rule in internal storage.
   * @param targetPath - Optional explicit target file path.
   * @param isGlobal - Hint for global context (uses ~/.codex/instructions.md).
   * @param options - Additional generation options.
   * @returns True on success, false on failure.
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
   * @param config - The rule configuration to apply.
   * @param targetPath - The target file path (e.g., ~/.codex/instructions.md or ./codex.md).
   * @param isGlobal - Unused by this method but kept for interface compatibility.
   * @param options - Additional options like description, alwaysApply, globs.
   * @returns True on success, false on failure.
   */
  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal?: boolean | undefined,
    options?: RuleGeneratorOptions | undefined
  ): Promise<boolean> {
    // Delegate to the shared helper, ensuring insertion within <vibe-tools>
    return appendOrUpdateTaggedBlock(
      targetPath,
      config,
      options,
      true // Append inside <vibe-tools Integration>
    );
  }
}
