import { getRuleProvider } from "../providers/index.js";
import { RuleType } from "../types.js";
import { loadCommonRule, listCommonRules } from "../utils/rule-storage.js";
import { findSimilarRules } from "../utils/similarity.js";
import chalk from "chalk";

interface UninstallOptions {
  global?: boolean;
  target?: string;
}

export async function uninstallCommandAction(
  name: string,
  editor: string,
  options: UninstallOptions
): Promise<void> {
  const ruleType = getRuleTypeFromString(editor);
  if (!ruleType) {
    console.error(chalk.red(`Unsupported editor: ${editor}`));
    console.log(
      chalk.gray(
        "Supported editors: cursor, windsurf, claude-code, codex, amp, clinerules, roo, zed, unified, vscode, kiro"
      )
    );
    process.exit(1);
  }

  const provider = getRuleProvider(ruleType);
  const success = await provider.removeRule(name, options.target, options.global);

  if (success) {
    console.log(chalk.green(`✓ Uninstalled rule "${name}" from ${editor}`));
  } else {
    console.error(chalk.red(`✗ Failed to uninstall rule "${name}" from ${editor}`));

    // Suggest similar rule names
    const availableRules = await listCommonRules();
    if (availableRules.length > 0) {
      const similarRules = findSimilarRules(name, availableRules);
      if (similarRules.length > 0) {
        console.log(chalk.gray("\nDid you mean one of these?"));
        similarRules.forEach((rule: string) => console.log(chalk.gray(`  - ${rule}`)));
      }
    }

    process.exit(1);
  }
}

function getRuleTypeFromString(editor: string): RuleType | null {
  const editorMap: Record<string, RuleType> = {
    cursor: RuleType.CURSOR,
    windsurf: RuleType.WINDSURF,
    "claude-code": RuleType.CLAUDE_CODE,
    codex: RuleType.CODEX,
    amp: RuleType.AMP,
    clinerules: RuleType.CLINERULES,
    roo: RuleType.ROO,
    zed: RuleType.ZED,
    unified: RuleType.UNIFIED,
    vscode: RuleType.VSCODE,
    kiro: RuleType.KIRO,
  };

  return editorMap[editor.toLowerCase()] || null;
}
