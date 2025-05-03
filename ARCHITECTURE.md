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
│   ├── llms/              # Rule definitions for package export (Added)
│   │   ├── index.ts       # Public rule export (intentionally empty)
│   │   └── internal.ts    # Internal rule definitions (not exported)
│   ├── providers/         # Provider implementations
│   │   ├── index.ts       # Provider factory
│   │   ├── cursor-provider.ts  # Cursor editor provider (Refactored)
│   │   ├── windsurf-provider.ts # Windsurf editor provider (Refactored)
│   │   ├── claude-code-provider.ts # Claude Code provider (Refactored)
│   │   ├── codex-provider.ts       # Codex provider (Refactored)
│   │   └── clinerules-provider.ts  # Clinerules/Roo provider (Refactored)
│   └── utils/             # Utility functions
│       ├── path.ts        # Path helpers
│       ├── similarity.ts  # Text similarity utilities
│       └── rule-formatter.ts # Rule formatting utilities for metadata (Added)
│       └── single-file-helpers.ts # Helpers for single-file providers (Added)
│       └── rule-storage.ts # Helpers for internal rule storage (Added)
├── web/                   # Web interface
│   ├── pages/             # Vue/Nuxt pages
│   │   └── index.vue      # Landing page
│   ├── public/            # Public assets
│   └── nuxt.config.ts     # Nuxt configuration
├── package.json           # Project metadata and dependencies (Updated scripts)
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
- `clearExistingRules(pkgName: string, editorType: RuleType, options: { global?: boolean; target?: string }): Promise<void>` (Added)
  - Clears previously installed rule files associated with a specific NPM package before installing new ones.
  - Determines the target directory based on `editorType` and `options`.
  - **Behavior for Single-File Providers** (e.g., Windsurf, Claude Code, Codex):
    - Reads the determined single target file (e.g., `.windsurfrules`, `CLAUDE.md`).
    - Removes any XML-like blocks within the file where the tag name starts with the package prefix (e.g., finds and removes `<pkgName_rule1>...</pkgName_rule1>`, `<pkgName_anotherRule>...</pkgName_anotherRule>`).
    - Writes the modified content back to the file.
    - Does _not_ delete the file itself.
  - **Behavior for Multi-File Providers** (e.g., Cursor, Clinerules):
    - Deletes files within the target directory whose names start with `${pkgName}_`.

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
- `install <editor> [packageName] [options]` (Updated)
  - Installs rules exported from an NPM package directly into an editor configuration.
  - Arguments:
    - `<editor>`: Target editor type (mandatory).
    - `[packageName]`: Specific package to install from (optional, defaults to all deps).
  - Options:
    - `-g, --global`: Apply to global config path (similar to `load`).
    - `-t, --target <path>`: Custom target path (similar to `load`).
    - `--debug`: Enable verbose debug logging for the install process.
  - Behavior:
    - Determines the package(s) to process (specific one or all dependencies).
    - For each package, dynamically imports `<packageName>/llms`.
      - **Cleanup:** Calls `clearExistingRules` to remove rule files potentially installed previously from the same package (for multi-file providers like Cursor) or to remove corresponding XML blocks (for single-file providers).
      - **Module Loading:** Uses `require('module').createRequire` based on the CWD first for CommonJS compatibility. If that fails with `ERR_REQUIRE_ESM`, it falls back to using dynamic `import()` to support ES Modules.
    - Checks the default export:
      - If it's a **string**: Creates a single `RuleConfig` using the package name and content.
      - If it's an **array**: Validates against `VibePackageRulesSchema` (using `PackageRuleItemSchema` for flexibility) and uses the valid rule definitions (mapping `rule` to `content` if necessary).
    - For each valid `RuleConfig` obtained:
      - **Name Prefixing:** Ensures the `name` property of the `RuleConfig` starts with `${pkgName}-`. If the original name (from an object export or derived from the package name) doesn't have this prefix, it's added.
      - Gets the appropriate `RuleProvider` for the specified `<editor>`.
      - Determines the target file path based on editor type, rule name, and options (`-g`, `-t`).
      - Uses the provider's `appendFormattedRule` to apply the rule to the target path.
    - Does **not** save rules to the common local store (`~/.vibe-rules/rules`).
    - **Error Handling:** Common errors like a package not being found or not exporting rules (`<pkg>/llms`) are handled gracefully. These are logged as debug messages if `--debug` is enabled, otherwise they are skipped silently to avoid excessive output when checking many dependencies.

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
  - `appendRule(name: string, targetPath?: string, isGlobal?: boolean): Promise<boolean>` - Loads a rule definition and applies it to a target file/directory, considering global/local context
  - `appendFormattedRule(config: RuleConfig, targetPath: string, isGlobal?: boolean): Promise<boolean>` - Formats and applies a rule definition directly
  - `generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string` - Generates formatted rule content suitable for the specific provider/IDE

#### `RuleGeneratorOptions`

- Interface for optional configuration when generating or applying rules
- Properties:
  - `description?`: string - Custom description (used by some providers like Cursor)
  - `isGlobal?`: boolean - Hint for providers supporting global/local paths (e.g., Claude, Codex)
  - `alwaysApply?`: boolean - Cursor-specific metadata.
  - `globs?`: string | string[] - Cursor-specific metadata.

### src/schemas.ts (Added)

Defines Zod schemas for validating rule configurations.

#### `RuleConfigSchema`

- Zod schema corresponding to the `RuleConfig` interface.
- Validates `name` (non-empty string), `content` (non-empty string), and optional `description` (string).
- Used by the `save` command and potentially internally.

#### `PackageRuleObjectSchema` (Added)

- Zod schema for the flexible rule object structure found in `package/llms` exports.
- Validates:
  - `name`: string (non-empty)
  - `rule`: string (non-empty) - Note: uses `rule` field for content.
  - `description?`: string
  - `alwaysApply?`: boolean - Cursor-specific metadata.
  - `globs?`: string | string[] - Cursor-specific metadata.

#### `PackageRuleItemSchema` (Added)

- Zod schema representing a single item in the `package/llms` array export.
- It's a union of:
  - `z.string().min(1)`: A simple rule string.
  - `PackageRuleObjectSchema`: The flexible rule object.

#### `VibePackageRulesSchema` (Added)

- Zod schema for the entire default export of `package/llms` when it's an array.
- Defined as `z.array(PackageRuleItemSchema)`.
- Used by the `install` command to validate package exports.

#### `VibeRulesSchema`

- Original Zod schema for an array of basic `RuleConfigSchema`. Kept for potential other uses but **not** the primary schema for the `install` command anymore.

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

### src/utils/rule-formatter.ts (Added)

Provides utility functions for formatting rule content with metadata like `alwaysApply` and `globs`.

#### `formatRuleWithMetadata(config: RuleConfig, options?: RuleGeneratorOptions): string`

- Formats rule content with human-readable metadata lines at the beginning
- Parameters:
  - `config`: The rule config to format
  - `options`: Optional metadata like alwaysApply and globs
- Returns: The formatted rule content with metadata lines included
- Handles both alwaysApply (true/false) and globs (string or array)
- Used by non-cursor providers to include metadata in their rule content

#### `createTaggedRuleBlock(config: RuleConfig, options?: RuleGeneratorOptions): string`

- Creates a complete XML-like block for a rule, with start/end tags and formatted content
- Parameters:
  - `config`: The rule config to format
  - `options`: Optional metadata like alwaysApply and globs
- Returns: The complete tagged rule block with metadata
- Used by providers that store rules in a single file with XML-like tags (via `single-file-helpers.ts`)

### src/utils/single-file-helpers.ts (Added)

Provides utility functions specific to providers that manage rules within a single configuration file using tagged blocks.

#### `appendOrUpdateTaggedBlock(targetPath: string, config: RuleConfig, options?: RuleGeneratorOptions, appendInsideVibeToolsBlock: boolean = false): Promise<boolean>`

- Encapsulates the logic for managing rules in single-file providers (Windsurf, Claude Code, Codex).
- Reads the `targetPath` file content.
- Uses `createTaggedRuleBlock` to generate the XML-like block for the rule.
- Searches for an existing block using a regex based on the `config.name` (e.g., `<rule-name>...</rule-name>`).
- **If found:** Replaces the existing block with the newly generated one.
- **If not found:** Appends the new block.
  - If `appendInsideVibeToolsBlock` is `true` (for Claude, Codex), it attempts to insert the block just before the `</vibe-tools Integration>` tag if present.
  - Otherwise (or if the integration block isn't found), it appends the block to the end of the file.
- Writes the updated content back to the `targetPath`.
- Ensures the parent directory exists using `ensureTargetDir`.
- Handles file not found errors gracefully (creates the file).
- Returns `true` on success, `false` on failure.

### src/utils/rule-storage.ts (Added)

Provides utility functions for interacting with the internal rule definition storage located at `~/.vibe-rules/rules/<ruleType>/*`.

#### `saveInternalRule(ruleType: RuleType, config: RuleConfig): Promise<string>`

- Saves a rule definition (`config.content`) to the internal storage path determined by `ruleType` and `config.name`.
- Ensures the target directory exists.
- Returns the full path where the rule was saved.

#### `loadInternalRule(ruleType: RuleType, name: string): Promise<RuleConfig | null>`

- Loads a rule definition from the internal storage file corresponding to `ruleType` and `name`.
- Returns a `RuleConfig` object containing the name and content if found, otherwise returns `null`.

#### `listInternalRules(ruleType: RuleType): Promise<string[]>`

- Lists the names of all rules (.txt files) stored internally for the given `ruleType`.
- Returns an array of rule names (filenames without the .txt extension).

### src/providers/index.ts

Contains a factory function `getRuleProvider(ruleType: RuleType)` that returns the appropriate provider instance based on the `RuleType` enum.

### src/providers/cursor-provider.ts (Refactored)

Implementation of the `RuleProvider` interface for Cursor editor.

#### `CursorRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles Cursor's `.mdc` files with frontmatter.
- **`saveRule`, `loadRule`, `listRules` (Refactored):** Now use utility functions from `src/utils/rule-storage.ts` to interact with internal storage.
- **`generateRuleContent` (Updated):**
  - Now accepts `RuleGeneratorOptions` (which includes optional `alwaysApply` and `globs`).
  - If `alwaysApply` or `globs` are present in the options, they are included in the generated frontmatter.
  - Uses `options.description` preferentially over `config.description` if provided.
  - Uses a custom internal function to format the frontmatter instead of the `yaml` library.
- `appendRule` loads a rule from internal storage and calls `appendFormattedRule`. Note that rules loaded this way might not have the dynamic `alwaysApply`/`globs` metadata unless it was also saved (currently it isn't).
- **`appendFormattedRule` (Updated):**
  - Now accepts `RuleGeneratorOptions`.
  - Passes these options along to `generateRuleContent` to allow for dynamic frontmatter generation based on the source of the rule (e.g., from `install` command processing).
- **`formatFrontmatter` (Updated):**
  - Now properly handles both `alwaysApply: true` and `alwaysApply: false` cases
  - Uses debug-friendly logging for globs formatting

### src/providers/windsurf-provider.ts (Refactored)

Implementation of the `RuleProvider` interface for Windsurf editor.

#### `WindsurfRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles Windsurf's single `.windsurfrules` file.
- **`saveRule`, `loadRule`, `listRules` (Refactored):** Now use utility functions from `src/utils/rule-storage.ts` to interact with internal storage.
- **`appendRule`**: Loads a rule from internal storage (using `loadInternalRule`) and calls `appendFormattedRule`.
- **`appendFormattedRule` (Refactored):**
  - Now delegates entirely to the shared `appendOrUpdateTaggedBlock` utility function.
  - Passes `false` for the `appendInsideVibeToolsBlock` parameter.
- **`generateRuleContent` (Unchanged):**
  - Utilizes the shared `createTaggedRuleBlock` utility to format rules with metadata.

### src/providers/claude-code-provider.ts (Refactored)

Implementation of the `RuleProvider` interface for Claude Code IDE.

#### `ClaudeCodeRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles Claude Code's `CLAUDE.md` file (either global `~/.claude/CLAUDE.md` or local `./CLAUDE.md`).
- **`saveRule`, `loadRule`, `listRules` (Refactored):** Now use utility functions from `src/utils/rule-storage.ts` to interact with internal storage.
- **`appendRule`**: Loads a rule from internal storage (using `loadInternalRule`) and calls `appendFormattedRule`.
- **`appendFormattedRule` (Refactored):**
  - Now delegates entirely to the shared `appendOrUpdateTaggedBlock` utility function.
  - Passes `true` for the `appendInsideVibeToolsBlock` parameter.
- **`generateRuleContent` (Unchanged):**
  - Formats content with metadata using the shared `formatRuleWithMetadata` utility.

### src/providers/codex-provider.ts (Refactored)

Implementation of the `RuleProvider` interface for Codex IDE.

#### `CodexRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles Codex's `instructions.md` (global) or `codex.md` (local).
- **`saveRule`, `loadRule`, `listRules` (Refactored):** Now use utility functions from `src/utils/rule-storage.ts` to interact with internal storage.
- **`appendRule`**: Loads a rule from internal storage (using `loadInternalRule`) and calls `appendFormattedRule`.
- **`appendFormattedRule` (Refactored):**
  - Now delegates entirely to the shared `appendOrUpdateTaggedBlock` utility function.
  - Passes `true` for the `appendInsideVibeToolsBlock` parameter.
- **`generateRuleContent` (Unchanged):**
  - Formats content with metadata using the shared `formatRuleWithMetadata` utility.

### src/providers/clinerules-provider.ts (Refactored)

Implementation of the `RuleProvider` interface for Cline/Roo IDEs.

#### `ClinerulesRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Handles saving individual rule files (e.g., `.clinerules/my-rule.md`).
- **`saveRule`, `loadRule`, `listRules` (Refactored):** Now use utility functions from `src/utils/rule-storage.ts` to interact with internal storage.
- **`appendRule`**: Loads a rule from internal storage (using `loadInternalRule`) and calls `appendFormattedRule`.
- **`generateRuleContent` (Updated):**
  - Now formats content with metadata using the shared `formatRuleWithMetadata` utility
  - Handles both `alwaysApply` and `globs` options to include in human-readable format
- **`appendFormattedRule` (Updated):**
  - Adds additional logging to show when metadata is included in rule content

### src/llms/internal.ts (Added)

- Contains the definition and default export of the `vibeRulesRepoRules` array.
- These rules are intended for internal use within the `vibe-rules` project itself (e.g., for developers contributing to the tool).
- This file is **not** part of the package's public API exposed via the `exports` field in `package.json`.

### src/llms/index.ts (Added)

- Provides the module resolved by the `vibe-rules/llms` export path defined in `package.json`.
- Intentionally exports an empty array (`export default [];`).
- This ensures that when other packages use the `vibe-rules install`

### package.json (Updated)

Contains project metadata, dependencies, and scripts.

#### Scripts

- `build`: Compiles TypeScript code using `tsc`.
- `start`: Runs the built CLI using Node.
- `dev`: Runs the CLI using `ts-node` for development.
- `npm:publish`: Builds the project using `bun build` and then publishes to npm using `npm publish`. (Added)

### Provider Changes

- **Directory Creation:** Providers (`cursor-provider.ts`, `clinerules-provider.ts`) or helper functions (`appendOrUpdateTaggedBlock` used by `windsurf-provider.ts`, `claude-code-provider.ts`, `codex-provider.ts`) that need to ensure a target file's parent directory exists now directly use `fs.ensureDirSync(path.dirname(targetPath))` from the `fs-extra` library (or a utility function that calls it). The deprecated utility function `ensureTargetDir` has been removed from `src/utils/path.ts`, and its usages within `src/cli.ts` (in the `load` and `install` commands) have also been replaced with direct `fs.ensureDirSync` calls.

## Core Logic
