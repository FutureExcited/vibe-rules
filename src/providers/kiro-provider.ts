import * as path from "path";
import { writeFile } from "fs/promises";
import * as fs from "fs-extra/esm";
import { RuleConfig, RuleProvider, RuleGeneratorOptions, RuleType } from "../types.js";
import { getRulePath, ensureDirectoryExists, getDefaultTargetPath } from "../utils/path.js";
import { saveInternalRule, loadInternalRule, listInternalRules } from "../utils/rule-storage.js";
import { debugLog } from "../utils/debug.js";

export class KiroRuleProvider implements RuleProvider {
  private readonly ruleType = RuleType.KIRO;

  generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string {
    // Kiro steering files are plain markdown — no frontmatter
    return config.content;
  }

  async saveRule(config: RuleConfig): Promise<string> {
    return saveInternalRule(this.ruleType, config);
  }

  async loadRule(name: string): Promise<RuleConfig | null> {
    return loadInternalRule(this.ruleType, name);
  }

  async listRules(): Promise<string[]> {
    return listInternalRules(this.ruleType);
  }

  async appendRule(name: string, targetPath?: string, isGlobal?: boolean): Promise<boolean> {
    const ruleConfig = await this.loadRule(name);
    if (!ruleConfig) {
      console.error(`Rule "${name}" not found in internal Kiro storage.`);
      return false;
    }
    const finalTargetPath = targetPath || getRulePath(this.ruleType, name, isGlobal);
    return this.appendFormattedRule(ruleConfig, finalTargetPath, isGlobal);
  }

  async appendFormattedRule(
    config: RuleConfig,
    targetPath: string,
    isGlobal?: boolean,
    options?: RuleGeneratorOptions
  ): Promise<boolean> {
    const dir = path.dirname(targetPath);
    try {
      ensureDirectoryExists(dir);
      const content = this.generateRuleContent(config, options);
      await writeFile(targetPath, content, "utf-8");
      return true;
    } catch (error) {
      console.error(`Error applying Kiro rule "${config.name}" to ${targetPath}:`, error);
      return false;
    }
  }

  async removeRule(name: string, targetPath?: string, isGlobal?: boolean): Promise<boolean> {
    try {
      const finalTargetPath = targetPath || getDefaultTargetPath(this.ruleType, isGlobal);
      const ruleFilePath = targetPath?.endsWith(".md")
        ? targetPath
        : path.join(finalTargetPath, `${name}.md`);

      if (!(await fs.pathExists(ruleFilePath))) {
        debugLog(`Rule file does not exist: ${ruleFilePath}`, "red");
        return false;
      }

      await fs.remove(ruleFilePath);
      debugLog(`Removed kiro rule file: ${ruleFilePath}`);
      return true;
    } catch (error) {
      debugLog(`Error removing kiro rule "${name}":`, "red", error);
      return false;
    }
  }
}
