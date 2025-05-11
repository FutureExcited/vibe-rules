import { RuleProvider, RuleType } from "../types";
import { CursorRuleProvider } from "./cursor-provider";
import { WindsurfRuleProvider } from "./windsurf-provider";
import { ClaudeCodeRuleProvider } from "./claude-code-provider";
import { CodexRuleProvider } from "./codex-provider";
import { ClinerulesRuleProvider } from "./clinerules-provider";
import { ZedRuleProvider } from "./zed-provider";

/**
 * Factory function to get the appropriate rule provider based on rule type
 */
export function getRuleProvider(ruleType: RuleType): RuleProvider {
  switch (ruleType) {
    case RuleType.CURSOR:
      return new CursorRuleProvider();
    case RuleType.WINDSURF:
      return new WindsurfRuleProvider();
    case RuleType.CLAUDE_CODE:
      return new ClaudeCodeRuleProvider();
    case RuleType.CODEX:
      return new CodexRuleProvider();
    case RuleType.CLINERULES:
    case RuleType.ROO:
      return new ClinerulesRuleProvider();
    case RuleType.ZED:
      return new ZedRuleProvider();
    case RuleType.CUSTOM:
    default:
      throw new Error(`Unsupported rule type: ${ruleType}`);
  }
}
