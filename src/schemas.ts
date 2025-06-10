import { z } from "zod";

export const RuleConfigSchema = z.object({
  name: z.string().min(1, "Rule name cannot be empty"),
  content: z.string().min(1, "Rule content cannot be empty"),
  description: z.string().optional(),
  // Add other fields from RuleConfig if they exist and need validation
});

// Schema for metadata in stored rules
export const RuleGeneratorOptionsSchema = z
  .object({
    description: z.string().optional(),
    isGlobal: z.boolean().optional(),
    alwaysApply: z.boolean().optional(),
    globs: z.union([z.string(), z.array(z.string())]).optional(),
    debug: z.boolean().optional(),
  })
  .optional();

// Schema for the enhanced local storage format with metadata
export const StoredRuleConfigSchema = z.object({
  name: z.string().min(1, "Rule name cannot be empty"),
  content: z.string().min(1, "Rule content cannot be empty"),
  description: z.string().optional(),
  metadata: RuleGeneratorOptionsSchema,
});

// Original schema for reference (might still be used elsewhere, e.g., save command)
export const VibeRulesSchema = z.array(RuleConfigSchema);

// --- Schemas for Package Exports (`<packageName>/llms`) ---

// Schema for the flexible rule object format within packages
export const PackageRuleObjectSchema = z.object({
  name: z.string().min(1, "Rule name cannot be empty"),
  rule: z.string().min(1, "Rule content cannot be empty"), // Renamed from content
  description: z.string().optional(),
  alwaysApply: z.boolean().optional(),
  globs: z.union([z.string(), z.array(z.string())]).optional(), // Allow string or array
});

// Schema for a single item in the package export (either a string or the object)
export const PackageRuleItemSchema = z.union([
  z.string().min(1, "Rule string cannot be empty"),
  PackageRuleObjectSchema, // Defined above now
]);

// Schema for the default export of package/llms (array of strings or objects)
export const VibePackageRulesSchema = z.array(PackageRuleItemSchema);

// --- Type Helpers ---

// Basic RuleConfig type
export type RuleConfig = z.infer<typeof RuleConfigSchema>;
// Type for the enhanced local storage format
export type StoredRuleConfig = z.infer<typeof StoredRuleConfigSchema>;
// Type for rule generator options
export type RuleGeneratorOptions = z.infer<typeof RuleGeneratorOptionsSchema>;
// Type for the flexible package rule object
export type PackageRuleObject = z.infer<typeof PackageRuleObjectSchema>;
// Type for a single item in the package export array
export type PackageRuleItem = z.infer<typeof PackageRuleItemSchema>;
