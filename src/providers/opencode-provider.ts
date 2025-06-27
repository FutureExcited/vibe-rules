import { RuleConfig, RuleProvider, RuleType, RuleGeneratorOptions } from "../types.js";
import { saveInternalRule, loadInternalRule, listInternalRules } from "../utils/rule-storage.js";
import { createTaggedRuleBlock } from "../utils/rule-formatter.js";
import { appendOrUpdateTaggedBlock } from "../utils/single-file-helpers.js";
import { getDefaultTargetPath } from "../utils/path.js";

export class OpenCodeRuleProvider implements RuleProvider {
  async saveRule(config: RuleConfig): Promise<string> {
    return saveInternalRule(RuleType.OPENCODE, config);
  }

  async loadRule(name: string): Promise<RuleConfig | null> {
    return loadInternalRule(RuleType.OPENCODE, name);
  }

  async listRules(): Promise<string[]> {
    return listInternalRules(RuleType.OPENCODE);
  }

  generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string {
    // OpenCode.md files use tagged blocks for multiple rules
    return createTaggedRuleBlock(config, options);
  }

  async appendRule(
    name: string,
    targetPath?: string,
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const ruleConfig = await this.loadRule(name);
    if (!ruleConfig) {
      console.error(`Rule "${name}" not found in internal OpenCode storage.`);
      return false;
    }

    const finalTargetPath = targetPath || getDefaultTargetPath(RuleType.OPENCODE, isGlobal);
    return this.appendFormattedRule(ruleConfig, finalTargetPath, isGlobal, options);
  }

  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    // OpenCode.md files are at the root of the project
    return appendOrUpdateTaggedBlock(targetPath, config, options, false);
  }
}