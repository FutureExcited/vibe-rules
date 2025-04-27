import { z } from "zod";

export const RuleConfigSchema = z.object({
  name: z.string().min(1, "Rule name cannot be empty"),
  content: z.string().min(1, "Rule content cannot be empty"),
  description: z.string().optional(),
  // Add other fields from RuleConfig if they exist and need validation
});

// We might also need a schema for an array of rules if a package exports multiple
export const VibeRulesSchema = z.array(RuleConfigSchema);

// Type helper if needed elsewhere
export type RuleConfig = z.infer<typeof RuleConfigSchema>;
