import { RuleProvider, RuleType } from "../types";
import { CursorRuleProvider } from "./cursor-provider";
import { WindsurfRuleProvider } from "./windsurf-provider";

/**
 * Factory function to get the appropriate rule provider based on rule type
 */
export function getRuleProvider(ruleType: RuleType): RuleProvider {
  switch (ruleType) {
    case RuleType.CURSOR:
      return new CursorRuleProvider();
    case RuleType.WINDSURF:
      return new WindsurfRuleProvider();
    default:
      throw new Error(`Unsupported rule type: ${ruleType}`);
  }
}
