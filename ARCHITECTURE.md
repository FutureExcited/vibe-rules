# vibe-rules Architecture

This document outlines the architecture of the vibe-rules utility - a tool for managing AI prompts for different editors.

**Note:** The tool is intended for global installation via `bun i -g vibe-rules`.

## Project Structure

```
vibe-rules/
├── src/                   # Source code
│   ├── cli.ts             # Command-line interface
│   ├── commands/          # CLI command action handlers (Added)
│   │   └── install.ts     # Action handler for the 'install' command (Added)
│   ├── index.ts           # Main exports
│   ├── types.ts           # Type definitions (Updated: RuleType.UNIFIED)
│   ├── schemas.ts         # Zod schema definitions
│   ├── llms/              # Rule definitions for package export
│   │   ├── index.ts       # Public rule export (intentionally empty)
│   │   └── internal.ts    # Internal rule definitions (not exported)
│   ├── providers/         # Provider implementations
│   │   ├── index.ts       # Provider factory (Updated: UnifiedRuleProvider)
│   │   ├── cursor-provider.ts  # Cursor editor provider
│   │   ├── windsurf-provider.ts # Windsurf editor provider
│   │   ├── claude-code-provider.ts # Claude Code provider
│   │   ├── codex-provider.ts       # Codex provider
│   │   ├── clinerules-provider.ts  # Clinerules/Roo provider
│   │   ├── zed-provider.ts         # Zed editor provider
│   │   └── unified-provider.ts     # Unified .rules provider (Added)
│   └── utils/             # Utility functions
│       ├── path.ts        # Path helpers (Updated: UNIFIED paths)
│       ├── similarity.ts  # Text similarity utilities
│       └── rule-formatter.ts # Rule formatting utilities for metadata
│       └── single-file-helpers.ts # Helpers for single-file providers
│       └── rule-storage.ts # Helpers for internal rule storage
├── web/                   # Web interface
│   ├── pages/             # Vue/Nuxt pages
│   │   └── index.vue      # Landing page
│   ├── public/            # Public assets
│   └── nuxt.config.ts     # Nuxt configuration
├── package.json           # Project metadata and dependencies
├── README.md              # Project documentation (Updated: Unified convention)
├── ARCHITECTURE.md        # This file (Being updated)
├── UNIFIED_RULES_CONVENTION.md # Documentation for .rules (Added)
```

## File Descriptions

### src/cli.ts

Defines the command-line interface using `commander`.
It handles parsing of command-line arguments, options, and delegates the execution of command actions to handlers in `src/commands/`.

#### Global Variables/Functions

- `isDebugEnabled: boolean` (Exported)
  - A global flag indicating if debug logging is active. Controlled by the `--debug` CLI option.
- `debugLog(message: string, ...optionalParams: any[]): void` (Exported)
  - A global function for logging debug messages. Output is conditional based on `isDebugEnabled`.

#### Helper Functions (Internal to cli.ts)

- `installRule(ruleConfig: RuleConfig): Promise<void>`
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
  - Uses the `installRule` helper function.
- `list`
  - Lists all rules saved in the common local store (`~/.vibe-rules/rules`).
- `load <name> <editor> [options]` (Alias: `add`)
  - Applies a saved rule to a specific editor's configuration file.
  - Loads the rule content from the common store.
  - Determines the target file path based on editor type, options (`-g, --global`, `-t, --target`), and context.
  - Uses the appropriate `RuleProvider` to format and apply the rule (`appendFormattedRule`).
  - Suggests similar rule names if the requested rule is not found.
- `install <editor> [packageName] [options]`
  - Defines the CLI options and arguments for the install command.
  - Delegates the action to `installCommandAction` from `src/commands/install.ts`.

### src/commands/install.ts (Added)

Contains the action handler for the `vibe-rules install` command.

#### Functions

- `installCommandAction(editor: string, packageName: string | undefined, options: { global?: boolean; target?: string; debug?: boolean }): Promise<void>` (Exported)
  - Main handler for the `install` command.
  - If `packageName` is provided, it calls `installSinglePackage` for that specific package.
  - If `packageName` is not provided, it reads `package.json`, gets all dependencies and devDependencies, and calls `installSinglePackage` for each.
  - Uses `getRuleProvider` to get the appropriate provider for the editor.
  - Handles overall error reporting for the command.
- `installSinglePackage(pkgName: string, editorType: RuleType, provider: RuleProvider, installOptions: { global?: boolean; target?: string; debug?: boolean }): Promise<number>`
  - Installs rules from a single specified NPM package.
  - Dynamically imports `<pkgName>/llms` using `importModuleFromCwd`.
  - Calls `clearExistingRules` before processing new rules.
  - Validates the imported module content (string or array of rules/rule objects) using `VibePackageRulesSchema`.
  - For each rule, determines the final target path and uses `provider.appendFormattedRule` to apply it.
  - Prefixes rule names with `${pkgName}_` if not already present.
  - Handles metadata (`alwaysApply`, `globs`) from rule objects.
  - Returns the count of successfully applied rules.
- `clearExistingRules(pkgName: string, editorType: RuleType, options: { global?: boolean }): Promise<void>`
  - Clears previously installed rules for a given package and editor type.
  - For single-file providers (Windsurf, Claude Code, Codex), removes XML-like blocks matching `<pkgName_ruleName>...</pkgName_ruleName>` from the target file.
  - For multi-file providers (Cursor, Clinerules), deletes files starting with `${pkgName}_` in the target directory.
- `importModuleFromCwd(ruleModulePath: string): Promise<any>`
  - Dynamically imports a module from the current working directory's `node_modules`.
  - Attempts `require` first for CommonJS compatibility.
  - Falls back to dynamic `import()` if `ERR_REQUIRE_ESM` is encountered.

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
  - `CLAUDE_CODE`: "claude-code" - For Claude Code IDE
  - `CODEX`: "codex" - For Codex IDE
  - `CLINERULES`: "clinerules" - For Cline/Roo IDEs
  - `ROO`: "roo" - Alias for CLINERULES
  - `ZED`: "zed" - For Zed editor
  - `UNIFIED`: "unified" - For the unified `.rules` file convention (Added)
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
Utilizes `debugLog` from `cli.ts` for conditional logging in `ensureDirectoryExists`.

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
- Returns: The specific path (e.g., `~/.claude/CLAUDE.md`, `./.cursor/rules/my-rule.mdc`, `./.clinerules`, `./.rules` for Zed and Unified)

#### `getDefaultTargetPath(ruleType: RuleType, isGlobalHint: boolean = false): string`

- Gets the default target directory or file path where rules of a certain type are typically applied (used by commands like `apply` if no target is specified).
- Parameters:
  - `ruleType`: The type of rule/editor
  - `isGlobalHint`: Hint for global context
- Returns: The conventional default path (e.g., `~/.codex`, `./.cursor/rules`, `./.clinerules`, `./.rules` for Zed and Unified)

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
Utilizes `debugLog` from `cli.ts` for conditional logging (Updated).

#### `appendOrUpdateTaggedBlock(targetPath: string, config: RuleConfig, options?: RuleGeneratorOptions, appendInsideVibeToolsBlock: boolean = false): Promise<boolean>` (Updated)

- Encapsulates the logic for managing rules in single-file providers (Windsurf, Claude Code, Codex, Zed).
- Reads the `targetPath` file content.
- Uses `createTaggedRuleBlock` to generate the XML-like block for the rule.
- **Bug Fix:** Now properly handles file creation for dot-files (e.g., `.rules`, `.windsurfrules`):
  - Explicitly checks if a target file exists using `fs.stat`
  - If the path exists but is a directory, removes it with `fs.rm` (recursive: true)
  - For new files, uses `fsExtra.ensureFileSync` to create an empty file before writing content
  - This prevents the dot-files from being incorrectly created as directories
- Searches for an existing block using a regex based on the `config.name` (e.g., `<rule-name>...</rule-name>`).
- **If found:** Replaces the existing block with the newly generated one.
- **If not found:** Appends the new block.
  - If `appendInsideVibeToolsBlock` is `true` (for Claude, Codex), it attempts to insert the block just before the `</vibe-tools Integration>` tag if present.
  - Otherwise (or if the integration block isn't found), it appends the block to the end of the file.
- Writes the updated content back to the `targetPath`.
- Ensures the parent directory exists using `ensureDirectoryExists`.
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
Handles `CURSOR`, `WINDSURF`, `CLAUDE_CODE`, `CODEX`, `CLINERULES`, `ROO`, `ZED`, and `UNIFIED` (Added).

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
  - Passes these options along to `generateRuleContent` to allow for dynamic frontmatter generation based on the source of the rule (e.g., from `install`

### src/providers/zed-provider.ts (Added)

Implementation of the `RuleProvider` interface for Zed editor.

#### `ZedRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Manages rules within a single `.rules` file in the project root.
- Uses `appendOrUpdateTaggedBlock` from `single-file-helpers.ts` for file operations.
- Uses `createTaggedRuleBlock` from `rule-formatter.ts` to generate rule content with metadata.
- Delegates rule definition storage (`saveRule`, `loadRule`, `listRules`) to `src/utils/rule-storage.ts` using `RuleType.ZED`.

### src/providers/unified-provider.ts (Added)

Implementation of the `RuleProvider` interface for the unified `.rules` file convention.

#### `UnifiedRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Manages rules within a single `.rules` file located in the project root (by convention).
- Uses `appendOrUpdateTaggedBlock` from `src/utils/single-file-helpers.ts` to read, update, or append tagged rule blocks within the `.rules` file.
- Uses `createTaggedRuleBlock` from `src/utils/rule-formatter.ts` to generate the XML-like tagged content for each rule, including any metadata provided.
- Delegates the storage of rule definitions (when using `vibe-rules save unified <name> ...`) to the common internal storage via `src/utils/rule-storage.ts`, using `RuleType.UNIFIED`.
- The `targetPath` for `appendFormattedRule` is expected to be the path to the `.rules` file itself (e.g., `./.rules`).

## New Documentation Files

### UNIFIED_RULES_CONVENTION.md (Added)

- Describes the purpose, location, format, and usage of the `.rules` file.
- Provides examples of the tagged rule block structure and how to interact with it using `vibe-rules` commands (`load unified`, `install unified`).
