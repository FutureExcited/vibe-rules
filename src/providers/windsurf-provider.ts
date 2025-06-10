import {
  RuleConfig,
  RuleProvider,
  RuleType,
  RuleGeneratorOptions,
} from "../types.js";
import { getDefaultTargetPath } from "../utils/path.js";
import {
  createTaggedRuleBlock,
} from "../utils/rule-formatter.js";
import { appendOrUpdateTaggedBlock } from "../utils/single-file-helpers.js";
import {
  saveInternalRule,
  loadInternalRule,
  listInternalRules,
} from "../utils/rule-storage.js";

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
   * Saves a rule definition to internal storage for later use.
   * @param config - The rule configuration.
   * @returns Path where the rule definition was saved internally.
   */
  async saveRule(config: RuleConfig): Promise<string> {
    return saveInternalRule(RuleType.WINDSURF, config);
  }

  /**
   * Loads a rule definition from internal storage.
   * @param name - The name of the rule to load.
   * @returns The RuleConfig if found, otherwise null.
   */
  async loadRule(name: string): Promise<RuleConfig | null> {
    return loadInternalRule(RuleType.WINDSURF, name);
  }

  /**
   * Lists rule definitions available in internal storage.
   * @returns An array of rule names.
   */
  async listRules(): Promise<string[]> {
    return listInternalRules(RuleType.WINDSURF);
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
