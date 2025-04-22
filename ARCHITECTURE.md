# vibe-rules Architecture

This document outlines the architecture of the vibe-rules utility - a tool for managing AI prompts for different editors.

## Project Structure

```
vibe-rules/
├── src/                   # Source code
│   ├── cli.ts             # Command-line interface
│   ├── index.ts           # Main exports
│   ├── types.ts           # Type definitions
│   ├── providers/         # Provider implementations
│   │   ├── index.ts       # Provider factory
│   │   ├── cursor-provider.ts  # Cursor editor provider
│   │   └── windsurf-provider.ts # Windsurf editor provider
│   └── utils/             # Utility functions
│       ├── path.ts        # Path helpers
│       └── similarity.ts  # Text similarity utilities
└── examples/              # Example usage
```

## File Descriptions

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
  - `CUSTOM`: "custom" - For custom implementations

#### `RuleProvider`

- Interface that providers must implement
- Methods:
  - `saveRule(config: RuleConfig, options?: RuleGeneratorOptions): Promise<string>` - Saves a rule and returns the file path
  - `loadRule(name: string): Promise<RuleConfig | null>` - Loads a rule by name
  - `listRules(): Promise<string[]>` - Lists all available rules
  - `appendRule(name: string, targetPath?: string): Promise<boolean>` - Appends a rule to a target file
  - `appendFormattedRule(config: RuleConfig, targetPath: string): Promise<boolean>` - Formats and appends a rule directly
  - `generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string` - Generates formatted rule content with editor-specific formatting

#### `RuleGeneratorOptions`

- Interface for optional configuration when generating rules
- Properties:
  - `description?`: string - Custom description
  - `isGlobal?`: boolean - Whether the rule should be applied globally (for Cursor)

### src/utils/path.ts

Provides utility functions for managing file paths.

#### `RULES_BASE_DIR`

- Constant storing the base directory for rules (under user's home directory)

#### `getCommonRulesDir(): string`

- Gets (and ensures exists) the common directory for storing all rules
- Returns: The path to the common rules directory

#### `getRuleTypePath(ruleType: RuleType): string`

- Gets the path for a specific rule type
- Parameters:
  - `ruleType`: The type of rule (from RuleType enum)
- Returns: The path to the directory for that rule type

#### `getRulePath(ruleType: RuleType, ruleName: string): string`

- Gets the full path for a specific rule
- Parameters:
  - `ruleType`: The type of rule
  - `ruleName`: The name of the rule
- Returns: The full path to the rule file with appropriate extension

#### `getCommonRulePath(ruleName: string): string`

- Gets the path for a rule in the common rules directory
- Parameters:
  - `ruleName`: The name of the rule
- Returns: The full path to the rule file

#### `getDefaultTargetPath(ruleType: RuleType): string`

- Gets the default target path for a specific editor
- Parameters:
  - `ruleType`: The type of editor
- Returns: The default path where rules for that editor should be stored

#### `ensureTargetDir(targetPath: string): void`

- Ensures that the directory for a target path exists
- Parameters:
  - `targetPath`: The path to ensure exists

#### `slugifyRuleName(name: string): string`

- Converts a rule name to a valid filename
- Parameters:
  - `name`: The rule name to convert
- Returns: A slug-formatted string safe for filenames

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

### src/providers/cursor-provider.ts

Implementation of the RuleProvider interface for Cursor editor.

#### `CursorRuleProvider` (class)

- Implements the RuleProvider interface for Cursor

##### `generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string`

- Generates formatted content with Cursor frontmatter
- Parameters:
  - `config`: Rule configuration
  - `options`: Optional generation options
- Returns: Formatted rule content with frontmatter

##### `saveRule(config: RuleConfig, options?: RuleGeneratorOptions): Promise<string>`

- Saves a rule with Cursor formatting
- Parameters:
  - `config`: Rule configuration
  - `options`: Optional generation options
- Returns: The path where the rule was saved

##### `loadRule(name: string): Promise<RuleConfig | null>`

- Loads a Cursor rule by name, parsing frontmatter
- Parameters:
  - `name`: The name of the rule to load
- Returns: The rule configuration or null if not found

##### `listRules(): Promise<string[]>`

- Lists all Cursor rules in the default directory
- Returns: Array of rule names

##### `appendRule(name: string, targetPath?: string): Promise<boolean>`

- Appends a Cursor rule to a target file
- Parameters:
  - `name`: The name of the rule to append
  - `targetPath`: Optional custom target path
- Returns: Boolean indicating success

##### `appendFormattedRule(config: RuleConfig, targetPath: string): Promise<boolean>`

- Formats and appends a rule directly from configuration
- Parameters:
  - `config`: Rule configuration
  - `targetPath`: Target path for the rule
- Returns: Boolean indicating success

### src/providers/windsurf-provider.ts

Implementation of the RuleProvider interface for Windsurf editor.

#### `WindsurfRuleProvider` (class)

- Implements the RuleProvider interface for Windsurf

##### `formatRuleContent(config: RuleConfig): string`

- Formats rule content with XML-like tags
- Parameters:
  - `config`: Rule configuration
- Returns: Formatted rule content with XML tags

##### `generateRuleContent(config: RuleConfig, options?: RuleGeneratorOptions): string`

- Generates formatted rule content with Windsurf XML tags
- Parameters:
  - `config`: Rule configuration
  - `options`: Optional generation options
- Returns: Formatted rule content

##### `saveRule(config: RuleConfig, options?: RuleGeneratorOptions): Promise<string>`

- Saves a rule with Windsurf formatting
- Parameters:
  - `config`: Rule configuration
  - `options`: Optional generation options (not used)
- Returns: The path where the rule was saved

##### `loadRule(name: string): Promise<RuleConfig | null>`

- Loads a Windsurf rule by name, extracting content from XML tags
- Parameters:
  - `name`: The name of the rule to load
- Returns: The rule configuration or null if not found

##### `listRules(): Promise<string[]>`

- Lists all Windsurf rules in the default directory
- Returns: Array of rule names

##### `appendRule(name: string, targetPath?: string): Promise<boolean>`

- Appends a Windsurf rule to a target file
- Parameters:
  - `name`: The name of the rule to append
  - `targetPath`: Optional custom target path
- Returns: Boolean indicating success

##### `appendFormattedRule(config: RuleConfig, targetPath: string): Promise<boolean>`

- Formats and appends a rule directly from configuration
- Parameters:
  - `config`: Rule configuration
  - `targetPath`: Target path for the rule
- Returns: Boolean indicating success

### src/providers/index.ts

Provides a factory function for getting the appropriate provider.

#### `getRuleProvider(ruleType: RuleType): RuleProvider`

- Factory function that returns the appropriate provider based on rule type
- Parameters:
  - `ruleType`: The type of rule/editor
- Returns: An instance of the appropriate provider

### src/cli.ts

Implements the command-line interface for vibe-rules.

#### Command: `save`

- Saves a rule to the local store
- Arguments:
  - `name`: Name of the rule
- Options:
  - `-c, --content <content>`: Rule content
  - `-f, --file <file>`: Load rule content from file
  - `-d, --description <desc>`: Rule description

#### Command: `list`

- Lists all available rules
- No arguments or options

#### Command: `load`

- Loads a rule into an editor configuration
- Arguments:
  - `name`: Name of the rule
  - `editor`: Target editor (cursor, windsurf)
- Options:
  - `-a, --append`: Append to an existing file instead of creating a new rule file
  - `-t, --target <path>`: Custom target path
- Behavior:
  - For Cursor (default): Creates a new rule file in .cursor/rules/ directory with slugified filename
  - For Cursor (with --append): Appends the rule to .cursorrules file
  - For Windsurf: Always appends rules to .windsurfrules file

#### Command: `init`

- Initializes directory structure for a specific editor
- Arguments:
  - `editor`: Editor to initialize (cursor, windsurf)

### src/index.ts

Exports all types and utilities for use as a library.

- Exports all types from `./types`
- Exports all path utilities from `./utils/path`
- Exports all similarity utilities from `./utils/similarity`
- Exports all providers from `./providers`
- Explicitly exports provider implementations:
  - `CursorRuleProvider`
  - `WindsurfRuleProvider`
