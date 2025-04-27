# vibe-rules Architecture

This document outlines the architecture of the vibe-rules utility - a tool for managing AI prompts for different editors.

**Note:** The tool is intended for global installation via `bun i -g vibe-rules`.

## Project Structure

```
vibe-rules/
├── src/                   # Source code
│   ├── cli.ts             # Command-line interface
│   ├── index.ts           # Main exports
│   ├── types.ts           # Type definitions
│   ├── schemas.ts         # Zod schema definitions (Added)
│   ├── providers/         # Provider implementations
│   │   ├── index.ts       # Provider factory
│   │   ├── cursor-provider.ts  # Cursor editor provider
│   │   ├── windsurf-provider.ts # Windsurf editor provider
│   │   ├── claude-code-provider.ts # Claude Code provider (Added)
│   │   ├── codex-provider.ts       # Codex provider (Added)
│   │   └── clinerules-provider.ts  # Clinerules/Roo provider (Added)
│   └── utils/             # Utility functions
│       ├── path.ts        # Path helpers
│       └── similarity.ts  # Text similarity utilities
├── web/                   # Web interface
│   ├── pages/             # Vue/Nuxt pages
│   │   └── index.vue      # Landing page
│   ├── public/            # Public assets
│   └── nuxt.config.ts     # Nuxt configuration
└── README.md              # Project documentation (Updated examples)
└── ARCHITECTURE.md        # This file
```

## File Descriptions

### src/cli.ts

Defines the command-line interface using `commander`.

#### Helper Functions

- `installRule(ruleConfig: RuleConfig): Promise<void>` (Added)
  - Validates a `RuleConfig` object against `RuleConfigSchema`.
  - Saves the rule content to the common internal storage (`~/.vibe-rules/rules/<name>.txt`).
  - Handles errors during validation or saving.

#### Commands

- `save <name> [options]`
  - Saves a rule to the local store (`~/.vibe-rules/rules/<name>.txt`).
  - Options: `-c, --content`, `-f, --file`, `-d, --description`.
  - Uses the `installRule` helper function.
- `list`
  - Lists all rules saved in the common local store (`~/.vibe-rules/rules`).
- `load <name> <editor> [options]` (Alias: `add`)
  - Applies a saved rule to a specific editor's configuration file.
  - Loads the rule content from the common store.
  - Determines the target file path based on editor type, options (`-g, --global`, `-t, --target`), and context.
  - Uses the appropriate `RuleProvider` to format and apply the rule (`appendFormattedRule`).
  - Suggests similar rule names if the requested rule is not found.
- `install [packageName]` (Added)
  - Installs rules exported from an NPM package.
  - If `packageName` is provided:
    - Dynamically imports `<packageName>/llms`.
    - Expects the default export to be an array of rule objects.
    - Validates the imported array against `VibeRulesSchema`.
    - Saves valid rules using the `installRule` helper.
    - Handles errors (module not found, validation errors).
  - If no `packageName` is provided:
    - Reads `dependencies` and `devDependencies` from `package.json`.
    - Iterates through each dependency and attempts to install rules as described above.

### src/types.ts

Defines the core types and interfaces used throughout the application.

#### `RuleConfig`

- Interface for storing rule information
- Properties:
  - `name`: string - The name of the rule
  - `content`: string - The content of the rule
  - `description?`: string - Optional description

#### `RuleType`

- Enum defining supported editor types
- Values:
  - `CURSOR`: "cursor" - For Cursor editor
  - `WINDSURF`: "windsurf" - For Windsurf editor
  - `CLAUDE_CODE`: "claude-code" - For Claude Code IDE (Added)
  - `CODEX`: "codex" - For Codex IDE (Added)
  - `CLINERULES`: "clinerules" - For Cline/Roo IDEs (Added)
  - `ROO`: "roo" - Alias for CLINERULES (Added)
  - `CUSTOM`: "custom" - For custom implementations

#### `RuleProvider`

- Interface that providers must implement
- Methods:
  - `saveRule(config: RuleConfig, options?: RuleGeneratorOptions): Promise<string>` - Saves a rule definition (often internally) and returns the path
  - `loadRule(name: string): Promise<RuleConfig | null>` - Loads a rule definition by name
  - `listRules(): Promise<string[]>` - Lists all available rule definitions
  - `appendRule(name: string, targetPath?: string, isGlobal?: boolean): Promise<boolean>` - Applies a rule definition to a target file/directory, considering global/local context
  - `appendFormattedRule(config: RuleConfig, targetPath: string, isGlobal?: boolean): Promise<boolean>` - Formats and applies a rule definition directly
  - `generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string` - Generates formatted rule content suitable for the specific provider/IDE

#### `RuleGeneratorOptions`

- Interface for optional configuration when generating or applying rules
- Properties:
  - `description?`: string - Custom description (used by some providers like Cursor)
  - `isGlobal?`: boolean - Hint for providers supporting global/local paths (e.g., Claude, Codex)

### src/schemas.ts (Added)

Defines Zod schemas for validating rule configurations.

#### `RuleConfigSchema`

- Zod schema corresponding to the `RuleConfig` interface.
- Validates `name` (non-empty string), `content` (non-empty string), and optional `description` (string).

#### `VibeRulesSchema`

- Zod schema for an array of `RuleConfigSchema`.
- Used to validate the expected structure of the default export from NPM packages (`<packageName>/llms`).

### src/utils/path.ts

Provides utility functions for managing file paths related to rules and IDE configurations.

#### `RULES_BASE_DIR`

- Constant storing the base directory for vibe-rules internal storage (`~/.vibe-rules`)

#### `CLAUDE_HOME_DIR`, `CODEX_HOME_DIR`

- Constants storing the conventional home directories for Claude (`~/.claude`) and Codex (`~/.codex`)

#### `getCommonRulesDir(): string`

- Gets (and ensures exists) the directory for storing common rule definitions within `RULES_BASE_DIR`
- Returns: The path to `~/.vibe-rules/rules`

#### `getInternalRuleStoragePath(ruleType: RuleType, ruleName: string): string`

- Gets the path for storing internal rule _definitions_ based on type.
- Parameters:
  - `ruleType`: The type of rule
  - `ruleName`: The name of the rule
- Returns: Path within `~/.vibe-rules/<ruleType>/<ruleName>.txt`

#### `getRulePath(ruleType: RuleType, ruleName: string, isGlobal: boolean = false, projectRoot: string = process.cwd()): string`

- Gets the _actual_ expected file or directory path where a rule should exist for the target IDE/tool.
- Parameters:
  - `ruleType`: The type of rule
  - `ruleName`: The name of the rule (used by some types like Cursor)
  - `isGlobal`: Flag indicating global context (uses home dir paths for Claude/Codex)
  - `projectRoot`: The root directory for local project paths
- Returns: The specific path (e.g., `~/.claude/CLAUDE.md`, `./.cursor/rules/my-rule.mdc`, `./.clinerules`)

#### `getDefaultTargetPath(ruleType: RuleType, isGlobalHint: boolean = false): string`

- Gets the default target directory or file path where rules of a certain type are typically applied (used by commands like `apply` if no target is specified).
- Parameters:
  - `ruleType`: The type of rule/editor
  - `isGlobalHint`: Hint for global context
- Returns: The conventional default path (e.g., `~/.codex`, `./.cursor/rules`, `./.clinerules`)

#### `ensureTargetDir(targetFilePath: string): void`

- Ensures that the _parent directory_ for a given file path exists.
- Parameters:
  - `targetFilePath`: The full file path

#### `slugifyRuleName(name: string): string`

- Converts a rule name to a filename-safe slug.
- Parameters:
  - `name`: The rule name to convert
- Returns: A slug-formatted string

### src/utils/similarity.ts

Provides text similarity utilities for finding related rules based on name similarity.

#### `levenshteinDistance(a: string, b: string): number`

- Calculates the Levenshtein distance between two strings
- Parameters:
  - `a`: First string
  - `b`: Second string
- Returns: A distance score (lower means more similar)

#### `calculateSimilarity(a: string, b: string): number`

- Calculates similarity score between two strings
- Parameters:
  - `a`: First string
  - `b`: Second string
- Returns: A similarity score between 0 and 1 (higher means more similar)

#### `findSimilarRules(notFoundName: string, availableRules: string[], limit: number = 5): string[]`

- Finds similar rule names to a given query
- Parameters:
  - `notFoundName`: The rule name that wasn't found
  - `availableRules`: List of available rule names
  - `limit`: Maximum number of similar rules to return (default: 5)
- Returns: Array of similar rule names sorted by similarity (most similar first)

### src/providers/index.ts

Contains a factory function `getRuleProvider(ruleType: RuleType)` that returns the appropriate provider instance based on the `RuleType` enum.

### src/providers/cursor-provider.ts

Implementation of the `RuleProvider` interface for Cursor editor.

#### `CursorRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles Cursor's `.mdc` files with frontmatter.
- `saveRule`, `loadRule`, `listRules` interact with the internal storage path (`~/.vibe-rules/cursor/`). (Note: `saveRule` currently seems unused directly by CLI, saving happens to common store).
- `appendRule`, `appendFormattedRule` write the formatted `.mdc` file to the target path (typically `./.cursor/rules/`).

### src/providers/windsurf-provider.ts

Implementation of the `RuleProvider` interface for Windsurf editor.

#### `WindsurfRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles Windsurf's single `.windsurfrules` file.
- `saveRule`, `loadRule`, `listRules` interact with internal storage (`~/.vibe-rules/windsurf/`). (Note: `saveRule` currently seems unused directly by CLI).
- `appendRule`, `appendFormattedRule` append content to the target `.windsurfrules` file.

### src/providers/claude-code-provider.ts (Added)

Implementation of the `RuleProvider` interface for Claude Code IDE.

#### `ClaudeCodeRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles Claude Code's `CLAUDE.md` file (either global `~/.claude/CLAUDE.md` or local `./CLAUDE.md`).
- `generateRuleContent` returns plain rule content.
- `saveRule`, `loadRule`, `listRules` interact with internal storage (`~/.vibe-rules/claude-code/`). (Note: `saveRule` currently seems unused directly by CLI).
- `appendRule`, `appendFormattedRule` use a helper (`updateRulesSection`) to find/update the `<vibe-tools Integration>` block within the target `CLAUDE.md` file. Takes an `isGlobal` flag to determine target path if not specified.

### src/providers/codex-provider.ts (Added)

Implementation of the `RuleProvider` interface for Codex IDE.

#### `CodexRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles Codex's `instructions.md` (global) or `codex.md` (local).
- `generateRuleContent` returns plain rule content.
- `saveRule`, `loadRule`, `listRules` interact with internal storage (`~/.vibe-rules/codex/`). (Note: `saveRule` currently seems unused directly by CLI).
- `appendRule`, `appendFormattedRule` use a helper (`updateRulesSection`) to find/update the `<vibe-tools Integration>` block within the target instruction file. Takes an `isGlobal` flag to determine target path if not specified.

### src/providers/clinerules-provider.ts (Added)

Implementation of the `RuleProvider` interface for Cline/Roo IDEs.

#### `ClinerulesRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles Cline/Roo's `.clinerules` directory structure (typically `./.clinerules/vibe-tools.md`).
- `generateRuleContent` returns plain rule content.
- `saveRule`, `loadRule`, `listRules` interact with internal storage (`~/.vibe-rules/clinerules/`). (Note: `saveRule` currently seems unused directly by CLI).
- `appendRule`, `appendFormattedRule` use a helper (`setupClinerulesDirectory`) to create/update the `vibe-tools.md` file within the target `.clinerules` directory.

## Core Concepts

- **Rule:** A named piece of text content (the prompt or instruction).
- **RuleType:** An identifier for the target editor/tool (e.g., `CURSOR`, `CLAUDE_CODE`).
- **RuleProvider:** A class responsible for handling the specifics of saving, loading, listing, and applying rules for a particular `RuleType`. It knows the file structure, formatting (e.g., frontmatter, specific filenames, tag blocks), and locations (global/local) for its target.
- **Internal Storage:** Rules are stored internally within `~/.vibe-rules/<ruleType>/` as plain text definitions.
- **Applying Rules:** The `appendRule` and `appendFormattedRule` methods in providers take a rule definition and write it to the _actual_ location expected by the IDE/tool (e.g., `./.cursor/rules/`, `~/.claude/CLAUDE.md`, `./.clinerules/vibe-tools.md`), performing necessary formatting or file structure setup.

## Workflow Example: Applying a Rule

1.  User runs: `vibe-rules apply my-cursor-rule --type cursor --target ./my-project/`
2.  `cli.ts` parses the command.
3.  It calls `getRuleProvider(RuleType.CURSOR)` to get `CursorRuleProvider`.
4.  It calls `provider.appendRule("my-cursor-rule", "./my-project/.cursor/rules/my-cursor-rule.mdc")`. (Target path is constructed or passed).
5.  `CursorRuleProvider` loads the rule `my-cursor-rule` from internal storage (`~/.vibe-rules/cursor/my-cursor-rule.txt`).
6.  It generates the content with Cursor frontmatter using `generateRuleContent`.
7.  It writes the formatted content to the specified target path (`./my-project/.cursor/rules/my-cursor-rule.mdc`).

## Recent Changes

- **2024-07-26:** Updated `README.md` examples for `vibe-rules save` to be clearer and use `.mdc` files.

## Web Interface

The web interface is a landing page and marketplace for vibe-rules, built with Nuxt.js and Tailwind CSS.

### web/pages/index.vue

The main landing page for vibe-rules that includes:

- A header with logo placeholder and navigation
- Hero section with description and call-to-action buttons
- Feature section highlighting key capabilities (Create, Share, Apply)
- Simple footer with copyright information
- Placeholder for 3D vibe-rules text image

The landing page is designed to be simple, developer-focused, and provides a foundation for the rules marketplace, starting with the Alchemy rule.

### web/nuxt.config.ts

Nuxt.js configuration file that defines:

- Compatibility settings
- Enabled modules (Tailwind CSS, Nuxt Fonts, Pinia)
- Server-side rendering configuration

### web/tailwind.config.js

Tailwind CSS configuration for styling the web interface.
