# vibe-rules

A simple utility for managing Cursor rules, Windsurf rules, and other AI prompts.

## Installation

```bash
# Install globally using bun
bun i -g vibe-rules
```

## Usage

### Save rules

Save a rule to your local store:

```bash
# Save a rule with content directly
vibe-rules save my-rule -c "This is my rule content" -d "A helpful description"

# Save a rule from a file
vibe-rules save my-rule -f path/to/rule-content.txt
```

Options:

- `-c, --content <content>`: Rule content (required if `-f` is not used)
- `-f, --file <file>`: Load rule content from file (required if `-c` is not used)
- `-d, --description <desc>`: Rule description (optional, defaults to rule name)

### List available rules

```bash
# List all rules stored locally
vibe-rules list
```

### Load a rule into an editor configuration (add alias)

Load a saved rule and either create a new rule file (Cursor default) or append it to an existing rules file (Windsurf default, or Cursor with `--append`). This command can also be invoked using the alias `add`.

```bash
# Create a new rule file for Cursor (default behavior)
vibe-rules load my-rule cursor
# Alias: vibe-rules add my-rule cursor

# Append a rule to the existing .cursorrules file
vibe-rules load my-rule cursor --append
# Alias: vibe-rules add my-rule cursor --append

# Append a rule for Windsurf (always appends)
vibe-rules load my-rule windsurf
# Alias: vibe-rules add my-rule windsurf

# Load into a specific target path (creates file if non-existent, otherwise appends)
vibe-rules load my-rule cursor -t /path/to/custom/target.mdc
# Alias: vibe-rules add my-rule cursor -t /path/to/custom/target.mdc
```

Options:

- `-a, --append`: Append to an existing file (e.g., `.cursorrules`) instead of creating a new one. Always true for Windsurf.
- `-t, --target <path>`: Custom target file path (optional, overrides default locations).

## File Formats

When loading rules into editor configurations, the correct format is automatically applied based on the editor:

### Cursor Rules

- **Default (No `--append`)**: Creates a new `.mdc` file in the `.cursor/rules/` directory of your current project, slugifying the rule name.

  ```
  ---
  description: Rule description
  globs: *,**/*
  alwaysApply: true
  ---

  Rule content here
  ```

- **With `--append`**: Appends the rule to `.cursorrules` in the current project directory (creates the file if it doesn't exist).

  ```
  ---
  description: Rule description
  globs: *,**/*
  alwaysApply: true
  ---

  Rule content here
  ```

  _(Appended to existing content)_

### Windsurf Rules

Windsurf rules are formatted with XML-like tags and appended to a `.windsurfrules` file in the project root (creates the file if it doesn't exist):

```xml
<rule-name>
Rule content here
</rule-name>
```

_(Appended to existing content)_

## License

MIT
