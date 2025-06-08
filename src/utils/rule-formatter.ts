import { RuleConfig, RuleGeneratorOptions } from "../types.js";

/**
 * Formats rule content for non-cursor providers that use XML-like tags.
 * Includes additional metadata like alwaysApply and globs in a human-readable format
 * within the rule content.
 */
export function formatRuleWithMetadata(
  config: RuleConfig,
  options?: RuleGeneratorOptions
): string {
  let formattedContent = config.content;

  // Add metadata lines at the beginning of content if they exist
  const metadataLines = [];

  // Add alwaysApply information if provided
  if (options?.alwaysApply !== undefined) {
    metadataLines.push(
      `Always Apply: ${options.alwaysApply ? "true" : "false"} - ${
        options.alwaysApply
          ? "This rule should ALWAYS be applied by the AI"
          : "This rule should only be applied when relevant files are open"
      }`
    );
  }

  // Add globs information if provided
  if (options?.globs && options.globs.length > 0) {
    const globsStr = Array.isArray(options.globs)
      ? options.globs.join(", ")
      : options.globs;

    // Skip adding the glob info if it's just a generic catch-all pattern
    const isCatchAllPattern =
      globsStr === "**/*" ||
      (Array.isArray(options.globs) &&
        options.globs.length === 1 &&
        options.globs[0] === "**/*");

    if (!isCatchAllPattern) {
      metadataLines.push(`Always apply this rule in these files: ${globsStr}`);
    }
  }

  // If we have metadata, add it to the beginning of the content
  if (metadataLines.length > 0) {
    formattedContent = `${metadataLines.join("\n")}\n\n${config.content}`;
  }

  return formattedContent;
}

/**
 * Creates a complete XML-like block for a rule, including start/end tags
 * and formatted content with metadata
 */
export function createTaggedRuleBlock(
  config: RuleConfig,
  options?: RuleGeneratorOptions
): string {
  const formattedContent = formatRuleWithMetadata(config, options);
  const startTag = `<${config.name}>`;
  const endTag = `</${config.name}>`;
  return `${startTag}\n${formattedContent}\n${endTag}`;
}
