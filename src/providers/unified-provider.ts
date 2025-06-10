import path from "path";
import {
  RuleConfig,
  RuleProvider,
  RuleType,
  RuleGeneratorOptions,
} from "../types.js";

import { appendOrUpdateTaggedBlock } from "../utils/single-file-helpers.js";
import { createTaggedRuleBlock } from "../utils/rule-formatter.js";
import {
  saveInternalRule as saveRuleToInternalStorage,
  loadInternalRule as loadRuleFromInternalStorage,
  listInternalRules as listRulesFromInternalStorage,
} from "../utils/rule-storage.js";

const UNIFIED_RULE_FILENAME = ".rules";

export class UnifiedRuleProvider implements RuleProvider {
  private getRuleFilePath(
    ruleName: string,
    isGlobal: boolean = false,
    projectRoot: string = process.cwd()
  ): string {
    // For unified provider, ruleName is not used in the path, always '.rules'
    // isGlobal might determine if it's in projectRoot or user's global .rules, but for now, always project root.
    if (isGlobal) {
      // Potentially handle a global ~/.rules file in the future
      // For now, global unified rules are not distinct from project unified rules
      // console.warn('Global unified rules are not yet uniquely supported, using project .rules');
      return path.join(projectRoot, UNIFIED_RULE_FILENAME);
    }
    return path.join(projectRoot, UNIFIED_RULE_FILENAME);
  }

  async saveRule(
    config: RuleConfig,
    _options?: RuleGeneratorOptions
  ): Promise<string> {
    return saveRuleToInternalStorage(RuleType.UNIFIED, config);
  }

  async loadRule(name: string): Promise<RuleConfig | null> {
    return loadRuleFromInternalStorage(RuleType.UNIFIED, name);
  }

  async listRules(): Promise<string[]> {
    return listRulesFromInternalStorage(RuleType.UNIFIED);
  }

  generateRuleContent(
    config: RuleConfig,
    options?: RuleGeneratorOptions
  ): string {
    // For .rules, we use the tagged block format directly
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
      console.error(`Rule "${name}" not found in local unified store.`);
      return false;
    }
    const filePath = targetPath || this.getRuleFilePath(name, isGlobal);
    return this.appendFormattedRule(ruleConfig, filePath, isGlobal, options);
  }

  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string, // This will be the path to the .rules file
    _isGlobal?: boolean, // isGlobal might be less relevant here if .rules is always project-based
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    // The 'targetPath' for unified provider should directly be the path to the '.rules' file.
    // The 'config.name' is used for the tag name within the '.rules' file.
    return appendOrUpdateTaggedBlock(targetPath, config, options, false);
  }
}
