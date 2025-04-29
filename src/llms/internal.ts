import { RuleConfig } from "../types"; // Keep RuleConfig if needed, or remove if not used
import { PackageRuleItem } from "../schemas";

// Content from llms.txt
const llmsTxtContent = `
# vibe-rules save

**Purpose:** Saves a rule to the local store (~/.vibe-rules/rules/). This allows you to manage a collection of reusable AI prompts.

**Usage:**
\`\`\`bash
vibe-rules save <name> [options]
\`\`\`

**Arguments:**
- \`<name>\`: The unique name for the rule.

**Options:**
- \`-c, --content <content>\`: Provide the rule content directly as a string.
- \`-f, --file <file>\`: Load the rule content from a specified file (e.g., .mdc or .md). One of --content or --file is required.
- \`-d, --description <desc>\`: An optional description for the rule.

# vibe-rules list

**Purpose:** Lists all rules that have been saved to the common local store (~/.vibe-rules/rules/).

**Usage:**
\`\`\`bash
vibe-rules list
\`\`\`

**Options:**
(None)

# vibe-rules load (or add)

**Purpose:** Applies a previously saved rule to the configuration file(s) of a specific editor or tool. This command formats the rule content correctly for the target editor and places it in the appropriate location.

**Usage:**
\`\`\`bash
vibe-rules load <name> <editor> [options]
vibe-rules add <name> <editor> [options] # Alias
\`\`\`

**Arguments:**
- \`<name>\`: The name of the rule to load/apply (must exist in the local store).
- \`<editor>\`: The target editor or tool type (e.g., cursor, windsurf, claude-code, codex, clinerules, roo).

**Options:**
- \`-g, --global\`: Apply the rule to the global configuration path if supported by the editor (currently supported for claude-code and codex). Defaults to project-local.
- \`-t, --target <path>\`: Specify a custom target file path or directory. This option overrides the default and global paths determined by the editor type.

# vibe-rules install

**Purpose:** Installs rules that are exported from an NPM package. The tool looks for a default export in a file named 'llms.ts' or similar within the package, expecting an array of rule configurations.

**Usage:**
\`\`\`bash
vibe-rules install [packageName]
\`\`\`

**Arguments:**
- \`[packageName]\` (Optional): The name of a specific NPM package to install rules from. If omitted, the command attempts to install rules from all dependencies listed in the current project's package.json file.

**Mechanism:**
- Looks for a module like \`<packageName>/llms\`.
- Expects the default export to be an array conforming to the VibeRulesSchema (array of { name, content, description? }).
- Saves each valid rule found into the common local store (~/.vibe-rules/rules/).
`;

const vibeRulesRepoRules: PackageRuleItem[] = [
  {
    name: "vibe-rules-provider-impl",
    rule: "When adding a new RuleProvider implementation in `src/providers/`, ensure it correctly implements all methods defined in the `RuleProvider` interface (`src/types.ts`), handles both global and local paths appropriately using `src/utils/path.ts` utilities, and generates editor-specific formatting correctly.",
    alwaysApply: true,
    globs: ["src/providers/*.ts", "src/providers/index.ts"],
  },
  {
    name: "vibe-rules-cli-commands",
    rule: "When adding new CLI commands or modifying existing ones in `src/cli.ts`, ensure comprehensive argument parsing using `commander`, validation using Zod schemas from `src/schemas.ts` (if applicable), clear user feedback using `chalk`, and robust error handling for file operations and external calls.",
    alwaysApply: true,
    globs: ["src/cli.ts"],
  },
  // Add the content from llms.txt as a general info rule
  {
    name: "vibe-rules-cli-docs",
    rule: llmsTxtContent,
    description:
      "Documentation for the vibe-rules CLI commands (save, list, load, install).",
    alwaysApply: true,
    globs: ["**/*"], // Apply globally as it's general context
  },
];

export default vibeRulesRepoRules;
