import { RuleProvider, RuleType } from "../types.js";
import { CursorRuleProvider } from "./cursor-provider.js";
import { WindsurfRuleProvider } from "./windsurf-provider.js";
import { ClaudeCodeRuleProvider } from "./claude-code-provider.js";
import { GeminiRuleProvider } from "./gemini-provider.js";
import { CodexRuleProvider } from "./codex-provider.js";
import { AmpRuleProvider } from "./amp-provider.js";
import { ClinerulesRuleProvider } from "./clinerules-provider.js";
import { ZedRuleProvider } from "./zed-provider.js";
import { UnifiedRuleProvider } from "./unified-provider.js";
import { VSCodeRuleProvider } from "./vscode-provider.js";

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
    case RuleType.GEMINI:
      return new GeminiRuleProvider();
    case RuleType.CODEX:
      return new CodexRuleProvider();
    case RuleType.AMP:
      return new AmpRuleProvider();
    case RuleType.CLINERULES:
    case RuleType.ROO:
      return new ClinerulesRuleProvider();
    case RuleType.ZED:
      return new ZedRuleProvider();
    case RuleType.UNIFIED:
      return new UnifiedRuleProvider();
    case RuleType.VSCODE:
      return new VSCodeRuleProvider();
    case RuleType.CUSTOM:
    default:
      throw new Error(`Unsupported rule type: ${ruleType}`);
  }
}
