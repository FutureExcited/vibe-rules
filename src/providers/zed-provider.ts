import { RuleConfig, RuleProvider, RuleType, RuleGeneratorOptions } from "../types.js";
import { saveInternalRule, loadInternalRule, listInternalRules } from "../utils/rule-storage.js";
import { createTaggedRuleBlock } from "../utils/rule-formatter.js";
import { appendOrUpdateTaggedBlock } from "../utils/single-file-helpers.js";
import { getDefaultTargetPath } from "../utils/path.js";

export class ZedRuleProvider implements RuleProvider {
  async saveRule(config: RuleConfig): Promise<string> {
    return saveInternalRule(RuleType.ZED, config);
  }

  async loadRule(name: string): Promise<RuleConfig | null> {
    return loadInternalRule(RuleType.ZED, name);
  }

  async listRules(): Promise<string[]> {
    return listInternalRules(RuleType.ZED);
  }

  generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string {
    // Zed .rules files are expected to be plain text or use a format
    // compatible with simple tagged blocks if we are managing multiple rules within it.
    // For consistency with Windsurf and other single-file providers, we use tagged blocks.
    return createTaggedRuleBlock(config, options);
  }

  async appendRule(
    name: string,
    targetPath?: string,
    isGlobal?: boolean, // isGlobal is not typically used for Zed's .rules
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const ruleConfig = await this.loadRule(name);
    if (!ruleConfig) {
      console.error(`Rule "${name}" not found in internal ZED storage.`);
      return false;
    }

    const finalTargetPath = targetPath || getDefaultTargetPath(RuleType.ZED, isGlobal);
    return this.appendFormattedRule(ruleConfig, finalTargetPath, isGlobal, options);
  }

  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal?: boolean, // isGlobal is not typically used for Zed's .rules
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    // Zed .rules files are at the root of the worktree, so isGlobal is likely false.
    // We don't append inside a specific <vibe-tools Integration> block by default for .rules
    return appendOrUpdateTaggedBlock(targetPath, config, options, false);
  }
}
