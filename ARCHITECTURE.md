# vibe-rules Architecture

This document outlines the architecture of the vibe-rules utility - a tool for managing AI prompts for different editors.

**Note:** The tool is intended for global installation via `bun i -g vibe-rules`.

## Key Dependencies

The project relies on several critical dependencies for its functionality:

- **import-meta-resolve**: Ponyfill for `import.meta.resolve()` functionality, enabling module path resolution without the need for Node.js experimental flags. Essential for the dual CommonJS/ESM module loading strategy in the install command.
- **commander**: CLI framework for handling command-line interface, argument parsing, and command routing.
- **zod**: Schema validation library used for validating rule configurations and package exports.
- **fs-extra**: Enhanced file system utilities with promise support, used throughout for file operations.
- **chalk**: Terminal styling library for colored console output and improved user experience.

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
├── examples/              # Example packages for end-users and library authors
│   ├── end-user-cjs-package/   # CommonJS project consuming rules from multiple packages (Updated)
│   │   ├── src/
│   │   ├── install.test.ts     # Integration test for vibe-rules install functionality (Added)
│   │   └── package.json        # Uses Bun for testing, includes vibe-rules script (Updated)
│   ├── end-user-esm-package/   # ES Module project consuming rules from multiple packages  
│   ├── library-cjs-package/    # CommonJS library that exports AI prompt rules
│   ├── library-esm-package/    # ES Module library that exports AI prompt rules
│   └── README.md          # Comprehensive guide to examples (Updated)
├── reference/             # Reference implementations for different editors
│   ├── cursor-rules-directory/     # Example Cursor workspace rules structure
│   ├── windsurf-rules-directory/   # Example Windsurf workspace rules structure
│   ├── cline-rules-directory/      # Example Cline workspace rules structure (Added)
│   ├── codex-rules-directory/      # Example CODEX workspace rules structure (Added)
│   ├── zed-rules-directory/        # Example ZED editor rules structure (Added)
│   └── README.md               # Documentation of reference structures (Updated: ZED section)
├── web/                   # Web interface
│   ├── pages/             # Vue/Nuxt pages
│   │   └── index.vue      # Landing page
│   ├── public/            # Public assets
│   └── nuxt.config.ts     # Nuxt configuration
├── package.json           # Project metadata and dependencies (including import-meta-resolve polyfill, dynamic build/test scripts, CI automation)
├── scripts/               # Build and utility scripts
│   ├── build-examples.ts  # Dynamic parallel script for building all example projects
│   └── test-examples.ts   # Dynamic parallel script for running tests across all example projects
├── .github/               # GitHub Actions workflows
│   └── workflows/
│       └── ci.yml         # Continuous Integration workflow
├── README.md              # Project documentation (Updated: Unified convention, Added note about --debug flag)
├── ARCHITECTURE.md        # This file (Being updated)
├── UNIFIED_RULES_CONVENTION.md # Documentation for .rules (Added)
```

## File Descriptions

### scripts/build-examples.ts (Added)

A dynamic TypeScript script that automatically discovers and builds all example projects in the `examples/` directory using Bun shell for parallel execution.

#### Key Features

- **Dynamic Discovery**: Automatically finds all directories in `examples/` that contain a `package.json` file
- **Parallel Execution**: Runs npm install and build operations for all projects simultaneously using `Promise.all()`
- **Smart Build Detection**: Determines whether a project needs building by checking for a `build` script in `package.json`
- **Bun Shell Integration**: Uses Bun's shell (`$`) for efficient command execution
- **Comprehensive Logging**: Provides detailed progress feedback with emojis and clear status messages
- **Error Handling**: Gracefully handles failures and provides detailed error reporting

#### Functions

- `discoverExampleProjects(): Promise<ExampleProject[]>`
  - Scans the `examples/` directory for subdirectories containing `package.json`
  - Returns an array of project metadata including name, path, and build requirements
  - Skips directories without `package.json` files
- `buildProject(project: ExampleProject): Promise<void>`
  - Executes npm install for a single project
  - Optionally runs npm build if the project has a build script
  - Provides progress logging for each step
- `main(): Promise<void>`
  - Orchestrates the entire build process
  - Runs all project builds in parallel
  - Provides summary statistics of built vs install-only projects

#### Usage

The script is executed via the `build:examples` npm script:
```bash
npm run build:examples
```

This replaces the previous hardcoded script with a dynamic solution that automatically adapts to new example projects without requiring configuration changes.

### scripts/test-examples.ts (Added)

A dynamic TypeScript script that automatically discovers and runs tests for all example projects in the `examples/` directory using Bun shell, with comprehensive output capture and reporting.

#### Key Features

- **Dynamic Discovery**: Automatically finds all directories in `examples/` that contain a `package.json` file with a valid test script
- **Parallel Execution**: Runs all test suites simultaneously using `Promise.allSettled()` to ensure all tests run even if some fail
- **Smart Test Detection**: Filters out placeholder test scripts (like `echo "Error: no test specified" && exit 1`)
- **Comprehensive Output Capture**: Captures both stdout and stderr from each test run for detailed reporting
- **Failure Tolerance**: Continues running all tests even when some fail, providing complete results
- **Rich Reporting**: Provides detailed summaries with timing, success rates, and organized output display
- **Bun Shell Integration**: Uses Bun's shell (`$`) for efficient command execution

#### Functions

- `discoverTestableProjects(): Promise<ExampleProject[]>`
  - Scans the `examples/` directory for subdirectories containing `package.json` with valid test scripts
  - Returns an array of project metadata including name, path, and test script command
  - Skips directories without `package.json` files or placeholder test scripts
- `runProjectTests(project: ExampleProject): Promise<TestResult>`
  - Executes the test command for a single project with timing measurement
  - Captures both success and failure output for comprehensive reporting
  - Returns detailed test results including duration, output, and error information
- `formatDuration(ms: number): string`
  - Formats millisecond durations into human-readable strings (ms, s, m)
- `printTestResults(results: TestResult[]): void`
  - Presents comprehensive test results in organized sections:
    - Summary with pass/fail counts and success rate
    - Detailed failure output for debugging failed tests
    - Condensed passed test output (last 10 lines) for verification
- `main(): Promise<void>`
  - Orchestrates the entire test process
  - Uses `Promise.allSettled()` to run all tests in parallel without stopping on failures
  - Provides final summary and appropriate exit codes

#### Output Format

The script provides structured output with multiple sections:
1. **Discovery Phase**: Lists all testable projects found
2. **Execution Phase**: Real-time progress updates as tests run
3. **Summary Section**: Pass/fail counts, timing, and success rate
4. **Detailed Failure Output**: Full output and error details for failed tests
5. **Passed Tests Output**: Last 10 lines of output for successful tests

#### Usage

The script is executed via the `test:examples` npm script:
```bash
npm run test:examples
```

This provides a comprehensive view of test results across all example projects, making it easy to identify and debug issues while ensuring all tests are run regardless of individual failures.

### .github/workflows/ci.yml (Added)

A comprehensive GitHub Actions workflow that provides continuous integration for the vibe-rules project, supporting both Bun and npm package managers.

#### Key Features

- **Dual Package Manager Support**: Sets up both Bun (for main project) and Node.js/npm (for example packages)
- **Comprehensive Testing**: Runs the complete build and test pipeline using our dynamic scripts
- **Efficient Caching**: Leverages Bun's fast dependency resolution and GitHub Actions runner caching
- **Multi-Branch Support**: Triggers on pushes to any branch (`branches: [ '*' ]`)
- **Smart Concurrency Control**: Automatically cancels older runs when new pushes are made to the same branch
- **Clear Progress Indicators**: Uses emojis and descriptive step names for easy monitoring

#### Workflow Configuration

- **Concurrency Control**: Uses `group: ci-${{ github.ref }}` with `cancel-in-progress: true` to automatically cancel older runs when new commits are pushed to the same branch
- **Branch Coverage**: Triggers on pushes to any branch (`branches: [ '*' ]`) for comprehensive testing

#### Workflow Steps

1. **Repository Checkout**: Uses `actions/checkout@v4` to get the latest code
2. **Bun Setup**: Uses `oven-sh/setup-bun@v2` with latest version for running our scripts
3. **Node.js Setup**: Uses `actions/setup-node@v4` with Node 20 to provide npm binary for example packages
4. **Dependency Installation**: Runs `bun install` to install root project dependencies
5. **Main Build**: Executes `bun run build` (TypeScript compilation via `tsc`)
6. **Example Build**: Runs `bun run build:examples` using our dynamic build script
7. **Example Testing**: Executes `bun run test:examples` using our comprehensive test runner

#### CI Pipeline Flow

```
Repository Checkout
        ↓
Setup Bun + Node.js (with caching)
        ↓
Install root dependencies
        ↓
Build main project (TypeScript)
        ↓
Build all example projects (parallel)
        ↓
Run all example tests (parallel with failure tolerance)
        ↓
Success confirmation
```

#### Benefits

- **Fast Execution**: Bun's speed for script execution and dependency management
- **Resource Efficient**: Concurrency controls cancel outdated runs, saving GitHub Actions quota
- **Robust Testing**: All example projects are built and tested automatically
- **Developer Friendly**: Clear step names and emoji indicators for easy monitoring
- **Failure Tolerance**: Tests continue running even if some examples fail, providing complete results
- **Scalable**: Automatically adapts to new example projects without workflow changes

This CI setup ensures that every change to the vibe-rules project is thoroughly validated across all supported use cases and package formats.

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

Contains the action handler for the `vibe-rules install` command and handles the complex module loading requirements for both CommonJS and ES modules.

#### Dependencies

- **import-meta-resolve**: A ponyfill for the native `import.meta.resolve()` functionality that resolves module specifiers to URLs without loading the module. This is required because Node.js's native `import.meta.resolve()` requires the `--experimental-import-meta-resolve` flag. The polyfill enables synchronous module path resolution and supports import maps and export maps, making it essential for the dynamic module loading strategy in `importModuleFromCwd`.

#### Functions

- `installCommandAction(editor: string, packageName: string | undefined, options: { global?: boolean; target?: string; debug?: boolean }): Promise<void>` (Exported)
  - Main handler for the `install` command.
  - If `packageName` is provided, it calls `installSinglePackage` for that specific package.
  - If `packageName` is not provided, it reads `package.json`, gets all dependencies and devDependencies, and calls `installSinglePackage` for each.
  - Uses `getRuleProvider` to get the appropriate provider for the editor.
  - Handles overall error reporting for the command.
- `installSinglePackage(pkgName: string, editorType: RuleType, provider: RuleProvider, installOptions: { global?: boolean; target?: string; debug?: boolean }): Promise<number>`
  - Installs rules from a single specified NPM package.
  - **Pre-validation**: Checks if the package exports `./llms` in its `package.json` before attempting import.
  - Creates the necessary directories for the specified editor type (e.g., `.cursor/` for Cursor, `.clinerules/` for Clinerules).
  - Dynamically imports `<pkgName>/llms` using `importModuleFromCwd`.
  - Calls `clearExistingRules` before processing new rules.
  - Validates the imported module content (string or array of rules/rule objects) using `VibePackageRulesSchema`.
  - **Rule Processing**: Handles both simple string rules and complex rule objects with metadata.
  - For each rule, determines the final target path and uses `provider.appendFormattedRule` to apply it.
  - Prefixes rule names with `${pkgName}_` if not already present.
  - **Metadata Handling**: Extracts and applies metadata (`alwaysApply`, `globs`) from rule objects to the provider options.
  - **Error Handling**: Provides specific error messages for different failure modes (module not found, syntax errors, initialization errors).
  - Returns the count of successfully applied rules.
- `clearExistingRules(pkgName: string, editorType: RuleType, options: { global?: boolean }): Promise<void>`
  - Clears previously installed rules for a given package and editor type.
  - **Single-File Providers** (Windsurf, Claude Code, Codex): Uses regex to remove XML-like blocks matching `<pkgName_ruleName>...</pkgName_ruleName>` patterns from the target file.
  - **Multi-File Providers** (Cursor, Clinerules): Deletes files starting with `${pkgName}_` in the target directory.
  - Handles cases where target paths don't exist gracefully.
- `importModuleFromCwd(ruleModulePath: string): Promise<any>`
  - **Dual-Strategy Module Loading**: Implements a robust approach for loading modules that works with both CommonJS and ES modules.
  - **Primary Strategy**: Attempts `createRequire()` with the current working directory's `package.json` as the context for CommonJS compatibility.
  - **Fallback Strategy**: When `require()` fails (typically for ESM-only modules), uses `import-meta-resolve` to resolve the module specifier to a full URL, then performs dynamic `import()`.
  - **Resolution Process**: 
    - Constructs a file URL from the current working directory's `package.json`
    - Uses `importMetaResolve(ruleModulePath, fileUrlString)` to resolve the module path
    - Performs dynamic import with the resolved path
  - **Error Handling**: Provides detailed debug logging for each step and comprehensive error reporting.
  - Returns the default export or the module itself, handling both export patterns.

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

#### `editorConfigExists(ruleType: RuleType, isGlobal: boolean, projectRoot: string = process.cwd()): Promise<boolean>` (Added)

- Utility function that checks if the configuration for a given editor type exists in the project.
- Currently available for potential future use but not actively used by install command.
- Parameters:
  - `ruleType`: The editor type to check
  - `isGlobal`: Whether to check the global or local path
  - `projectRoot`: The root directory of the project (defaults to current working directory)
- Returns: A promise that resolves to `true` if the configuration exists, `false` otherwise
- **Behavior by Editor Type:**
  - `CURSOR`: Checks for `.cursor` directory
  - `WINDSURF`: Checks for `.windsurfrules` file
  - `CLINERULES`/`ROO`: Checks for `.clinerules` directory
  - `ZED`/`UNIFIED`: Checks for `.rules` file
  - `CLAUDE_CODE`: Checks for `CLAUDE.md` (global: `~/.claude/CLAUDE.md`, local: `./CLAUDE.md`)
  - `CODEX`: Checks for instructions file (global: `~/.codex/instructions.md`, local: `./codex.md`)

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
  - If `appendInsideVibeToolsBlock` is `true` (for Claude, Codex), it attempts to insert the block just before the `<!-- /vibe-tools Integration -->` tag if present.
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
Handles `CURSOR`, `WINDSURF`, `CLAUDE_CODE`, `CODEX`, `CLINERULES`, `ROO`, `ZED`, `UNIFIED`, and `VSCODE` (Added).

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

### src/providers/claude-code-provider.ts

Implementation of the `RuleProvider` interface for Claude Code IDE.

#### `ClaudeCodeRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Manages rules within a single `CLAUDE.md` file with XML-like tagged blocks contained within a `<!-- vibe-tools Integration -->` wrapper.
- **`saveRule`, `loadRule`, `listRules`:** Use utility functions from `src/utils/rule-storage.ts` to interact with internal storage.
- **`generateRuleContent`:** Formats rule content with metadata using `formatRuleWithMetadata`.
- **`appendFormattedRule` (Updated):**
  - Creates XML-like tagged blocks using `createTaggedRuleBlock` from `rule-formatter.ts`.
  - **Integration Block Management:** When no existing `<!-- vibe-tools Integration -->` block is found:
    - For new/empty files: Creates the integration block wrapper with the new rule inside.
    - For files with existing content but no integration block: Wraps all existing content and the new rule within the integration block.
  - **Rule Updating:** If a rule with the same name already exists, replaces its content.
  - **Rule Insertion:** If an integration block exists, inserts new rules just before the closing `<!-- /vibe-tools Integration -->` tag.
  - Ensures all rules are properly contained within the integration wrapper for consistency with expected file format.

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

### src/providers/vscode-provider.ts (Added)

Implementation of the `RuleProvider` interface for Visual Studio Code.

#### `VSCodeRuleProvider` (class)

##### Methods: `generateRuleContent`, `saveRule`, `loadRule`, `listRules`, `appendRule`, `appendFormattedRule`

- Manages rules within individual `.instructions.md` files stored in the `.github/instructions/` directory.
- **`saveRule`, `loadRule`, `listRules`:** Use utility functions from `src/utils/rule-storage.ts` to interact with internal storage.
- **`generateRuleContent` (VSCode-specific format):**
  - Uses YAML frontmatter with `applyTo` field for file targeting.
  - **VSCode Bug Workaround:** Always uses `applyTo: "**"` due to VSCode's limitations with multiple globs in the `applyTo` field.
  - Preserves the original rule content without adding redundant headings (since rule content already includes proper headings).
  - Adds rule name and description as markdown headings in the content section.
- **`appendFormattedRule`:** Creates individual `.instructions.md` files in the `.github/instructions/` directory using the multi-file pattern (similar to Cursor and Clinerules providers).
- File naming follows the pattern: `{packageName}_{ruleName}.instructions.md`

## New Documentation Files

### UNIFIED_RULES_CONVENTION.md (Added)

- Describes the purpose, location, format, and usage of the `.rules` file.
- Provides examples of the tagged rule block structure and how to interact with it using `vibe-rules` commands (`load unified`, `install unified`).

### examples/README.md (Updated)

- Comprehensive documentation for the examples directory.
- Explains what vibe-rules is and its purpose for managing AI prompts across different editors.
- Describes the difference between end-user examples (CommonJS/ESM projects consuming rules) and library examples (packages that export rules).
- Provides detailed instructions for testing the examples and understanding the package structure.
- Documents the workflow for both library authors (how to export rules) and end users (how to install rules).
- Explains the generated files and supported editors (Cursor, Windsurf, Claude Code, VSCode, etc.).

### examples/end-user-cjs-package/ (Updated)

CommonJS example project demonstrating how end-users consume vibe-rules from multiple library packages.

#### Key Changes

- **Testing Framework:** Migrated from vitest to Bun's built-in test runner for improved performance and reduced dependencies.
- **Dependencies:** Removed vitest (^3.2.2 → removed), added @types/bun for TypeScript support.
- **Scripts:** Updated test script from incomplete `"vibe-"` to `"bun test"`, added `"vibe-rules": "vibe-rules"` script.
- **Node.js Version:** Added `engines.node: ">=22"` requirement.

### examples/end-user-esm-package/ (Updated)

ES Module example project demonstrating how end-users consume vibe-rules from multiple library packages.

#### Key Changes

- **Shared Test File:** Uses a symbolic link (`install.test.ts -> ../end-user-cjs-package/install.test.ts`) to share the exact same comprehensive test suite with the CJS package.
- **Testing Framework:** Updated to use Bun's built-in test runner for consistency with CJS package.
- **Dependencies:** Added @types/bun for TypeScript support.
- **Scripts:** Updated test script to `"bun test"`, added `"vibe-rules": "vibe-rules"` script.
- **Node.js Version:** Added `engines.node: ">=22"` requirement matching CJS package.

#### Symlinked Test Benefits

- **Zero Duplication:** Maintains the exact same test logic across both CJS and ESM packages without file duplication.
- **Automatic Synchronization:** Any changes to the test file in the CJS package are automatically reflected in the ESM package.
- **Cross-Platform Compatibility:** The symlink approach works well on macOS and Linux development environments.
- **Comprehensive Coverage:** Both packages now validate the complete vibe-rules installation workflow for all supported editors (Cursor, Windsurf, Clinerules, Claude Code, Codex, ZED, VSCode).

#### install.test.ts (Added)

Integration test that validates the complete vibe-rules installation workflow for both Cursor and Windsurf editors:

##### Test Functionality

**Cursor Installation Test:**
- **Setup:** Cleans existing `.cursor` directory to ensure fresh test environment
- **Installation Process:** 
  - Runs `npm install` to ensure dependencies are available
  - Executes `npm run vibe-rules install cursor` to install rules from all package dependencies
- **Validation:**
  - Verifies `.cursor/rules` directory exists
  - Counts generated `.mdc` files (expects exactly 8 files)
  - Validates rule naming convention (files prefixed with package names)
  - Confirms presence of expected rule types from both `cjs-package` and `esm-package` dependencies

**Windsurf Installation Test:**
- **Setup:** Cleans existing `.windsurfrules` file to ensure fresh test environment
- **Installation Process:**
  - Runs `npm install` to ensure dependencies are available
  - Executes `npm run vibe-rules install windsurf` to install rules from all package dependencies
- **Validation:**
  - Verifies `.windsurfrules` file exists
  - Counts generated rule blocks (expects exactly 8 tagged blocks)
  - Validates XML-like tagged block structure with proper opening/closing tags
  - Confirms presence of expected rule content and metadata from both dependency packages

##### Expected Rules Structure
The tests validate that 8 rules are generated from the two dependency packages:
- **From cjs-package:** `usage`, `api`, `architecture`, `routing` (4 rules)  
- **From esm-package:** `usage`, `api`, `architecture`, `routing` (4 rules)

##### Enhanced PackageRuleObject Examples
The example packages now demonstrate the full range of `PackageRuleObject` configurations:

**CJS Package Examples:**
- **Usage Rule**: Always applied rule (`alwaysApply: true`) with no globs for universal guidelines
- **API Rule**: Specific globs for API development (`src/routes/**/*.tsx`, `src/api/**/*.ts`)
- **Architecture Rule**: Model decision rule with description for architecture/state management tasks
- **Routing Rule**: Basic rule with no specific configuration for manual triggering

**ESM Package Examples:**
- **Usage Rule**: Always applied rule (`alwaysApply: true`) with universal API usage guidelines
- **API Rule**: RESTful design principles with route and API-specific globs
- **Architecture Rule**: Component architecture patterns triggered by description matching
- **Routing Rule**: Navigation best practices with no specific triggering configuration

##### Robust Test Implementation
The test suite has been enhanced for maximum robustness:

- **Dynamic Rule Discovery**: Tests derive expected rule names from imported llms modules instead of hardcoded values
- **Flexible Property Validation**: Optional properties like `description` and `globs` are validated conditionally
- **Future-Proof Design**: Tests automatically adapt to changes in rule definitions without requiring manual updates
- **Cross-Reference Validation**: Ensures imported module structure matches generated files using actual data

**Cursor Format:**
- **File Format:** All rules stored as separate `.mdc` files in `.cursor/rules/` directory
- **Naming Pattern:** `{packageName}_{ruleName}.mdc` (e.g., `cjs-package_api.mdc`)

**Windsurf Format:**
- **File Format:** All rules stored as XML-like tagged blocks within a single `.windsurfrules` file
- **Block Pattern:** `<{packageName}_{ruleName}>...rule content...</{packageName}_{ruleName}>` (e.g., `<cjs-package_api>...content...</cjs-package_api>`)

**Clinerules Format:**
- **File Format:** All rules stored as separate `.md` files in `.clinerules/` directory
- **Naming Pattern:** `{packageName}_{ruleName}.md` (e.g., `cjs-package_api.md`)
- **Content:** Formatted using `formatRuleWithMetadata` with human-readable metadata lines

**Claude Code Installation Test:** (Added)
- **Setup:** Cleans existing `CLAUDE.md` file to ensure fresh test environment
- **Installation Process:**
  - Runs `npm install` to ensure dependencies are available
  - Executes `npm run vibe-rules install claude-code` to install rules from all package dependencies
- **Validation:**
  - Verifies `CLAUDE.md` file exists
  - Counts generated rule blocks (expects exactly 8 tagged blocks)
  - Validates XML-like tagged block structure with proper opening/closing tags
  - Confirms presence of `<!-- vibe-tools Integration -->` wrapper block
  - Validates rule content and metadata from both dependency packages

**Claude Code Format:**
- **File Format:** All rules stored as XML-like tagged blocks within a single `CLAUDE.md` file
- **Block Pattern:** `<{packageName}_{ruleName}>...rule content...</{packageName}_{ruleName}>` (e.g., `<cjs-package_api>...content...</cjs-package_api>`)
- **Wrapper Block:** All rules are contained within a `<!-- vibe-tools Integration -->...<!-- /vibe-tools Integration -->` block
- **Content:** Formatted using `formatRuleWithMetadata` with human-readable metadata lines

**CODEX Installation Test:** (Added)
- **Setup:** Cleans existing `codex.md` file to ensure fresh test environment
- **Installation Process:**
  - Runs `npm install` to ensure dependencies are available
  - Executes `npm run vibe-rules install codex` to install rules from all package dependencies
- **Validation:**
  - Verifies `codex.md` file exists
  - Counts generated rule blocks (expects exactly 8 tagged blocks)
  - Validates XML-like tagged block structure with proper opening/closing tags
  - Confirms presence of `<!-- vibe-tools Integration -->` comment wrapper block
  - Validates rule content and metadata from both dependency packages

**CODEX Format:**
- **File Format:** All rules stored as XML-like tagged blocks within a single `codex.md` file
- **Block Pattern:** `<{packageName}_{ruleName}>...rule content...</{packageName}_{ruleName}>` (e.g., `<cjs-package_api>...content...</cjs-package_api>`)
- **Wrapper Block:** All rules are contained within a `<!-- vibe-tools Integration -->...<!-- /vibe-tools Integration -->` comment block
- **Content:** Formatted using `formatRuleWithMetadata` with human-readable metadata lines

**ZED Installation Test:** (Added)
- **Setup:** Cleans existing `.rules` file to ensure fresh test environment
- **Installation Process:**
  - Runs `npm install` to ensure dependencies are available
  - Executes `npm run vibe-rules install zed` to install rules from all package dependencies
- **Validation:**
  - Verifies `.rules` file exists
  - Counts generated rule blocks (expects exactly 8 tagged blocks)
  - Validates XML-like tagged block structure with proper opening/closing tags
  - Confirms no wrapper blocks are used (unlike Claude Code or Codex)
  - Validates rule content and metadata from both dependency packages

**ZED Format:**
- **File Format:** All rules stored as XML-like tagged blocks within a single `.rules` file
- **Block Pattern:** `<{packageName}_{ruleName}>...rule content...</{packageName}_{ruleName}>` (e.g., `<cjs-package_api>...content...</cjs-package_api>`)
- **No Wrapper Block:** Rules are stored directly without any integration wrapper (follows unified .rules convention)
- **Content:** Formatted using `formatRuleWithMetadata` with human-readable metadata lines

**VSCode Installation Test:** (Added)
- **Setup:** Cleans existing `.github/instructions` directory to ensure fresh test environment
- **Installation Process:**
  - Runs `npm install` to ensure dependencies are available
  - Executes `npm run vibe-rules install vscode` to install rules from all package dependencies
- **Validation:**
  - Verifies `.github/instructions` directory exists
  - Counts generated `.instructions.md` files (expects exactly 8 files)
  - Validates file naming convention (files prefixed with package names)
  - Confirms presence of expected rule content and metadata from both dependency packages

**VSCode Format:**
- **File Format:** All rules stored as separate `.instructions.md` files in `.github/instructions/` directory
- **Naming Pattern:** `{packageName}_{ruleName}.instructions.md` (e.g., `cjs-package_api.instructions.md`)
- **Frontmatter:** Uses `applyTo: "**"` for all rules due to VSCode's limitations with multiple globs
- **Content:** Preserves original rule content with rule name and description as markdown headings
- **VSCode Bug Workaround:** Always applies rules universally (`**`) for better reliability

##### Test Implementation Details
- Uses Bun's test framework (`import { test, expect } from "bun:test"`)
- Leverages Bun's shell integration (`import { $ } from "bun"`) for command execution
- **Test Environment Cleanup:** Clears existing editor directories/files at both the start and end of each test to ensure clean test isolation
- **Direct Module Imports:** Imports actual llms modules from both dependency packages:
  - `const cjsRules = require("cjs-package/llms")` - CommonJS import
  - `const esmRules = await import("esm-package/llms")` - ES Module import
- **Comprehensive Validation (covering Cursor, Windsurf, Clinerules, Claude Code, Codex, ZED, and VSCode formats):**
  - **File System Validation:** Verifies directory/file creation, file count, and naming patterns for all supported editors
  - **Module Structure Validation:** Validates imported arrays have correct length and structure
  - **Rule Object Validation:** Ensures each rule has required properties (`name`, `rule`, `description`, `alwaysApply`, `globs`)
  - **Type Validation:** Confirms correct data types for all rule properties
  - **Content Validation:** 
    - For Cursor: Reads generated `.mdc` files and verifies they contain the actual rule content
    - For Windsurf: Parses `.windsurfrules` file and validates tagged blocks contain rule content and metadata
    - For Clinerules: Reads generated `.md` files in `.clinerules/` directory and validates content and metadata formatting
    - For VSCode: Reads generated `.instructions.md` files in `.github/instructions/` directory and validates content and VSCode-specific frontmatter
  - **Cross-Reference Validation:** Ensures rule names from imported modules match generated file names or tag names
- Includes comprehensive error handling and detailed logging
- Provides clear success confirmation message upon completion

## Recent Updates

### VSCode Glob Limitation Fix

Due to Microsoft's VSCode having a bug where multiple globs in the `applyTo` field don't work properly, the VSCode provider was updated to always use `applyTo: "**"` for universal application. This change includes:

- **Provider Logic:** Updated `generateRuleContent` to always use `**` regardless of globs configuration
- **User Warnings:** Added installation-time warnings to inform users about this limitation and workaround  
- **Documentation:** Updated README and ARCHITECTURE to reflect this VSCode limitation
- **Tests:** Modified test expectations to verify `**` is used for all rules regardless of original globs
