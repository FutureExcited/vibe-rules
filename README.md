# vibe-rules

A simple utility for managing Cursor rules, Windsurf rules, and other AI prompts.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vibe-rules.git
cd vibe-rules

# Install dependencies
npm install

# Build the project
npm run build

# Install globally
npm install -g .
```

## Usage

### Initialize directory structure

Before appending rules to your project, you may need to initialize the directory structure:

```bash
# Initialize for Cursor
vibe-rules init cursor

# Initialize for Windsurf
vibe-rules init windsurf
```

### Save rules

Save a rule to your local store:

```bash
# Save a rule
vibe-rules save my-rule -c "This is my rule content" -d "A helpful description"

# Save from a file
vibe-rules save my-rule -f path/to/rule-content.txt
```

Options:

- `-c, --content <content>`: Rule content
- `-f, --file <file>`: Load rule content from file
- `-d, --description <desc>`: Rule description (optional)

### List available rules

```bash
# List all rules
vibe-rules list
```

### Load a rule

Print a rule's content to stdout:

```bash
# Load a rule
vibe-rules load my-rule
```

### Append a rule to a project

Append a rule to your project, specifying which editor it's for:

```bash
# Append a rule for Cursor
vibe-rules append my-rule cursor

# Append a rule for Windsurf
vibe-rules append my-rule windsurf

# Append to a specific target path
vibe-rules append my-rule cursor -t /path/to/target/.cursor/rules/custom-rule.mdc
```

Options:

- `-t, --target <path>`: Target file path (optional)

## File Formats

When appending rules to projects, the correct format is automatically applied based on the editor:

### Cursor Rules

Cursor rules are formatted as `.mdc` files in the `.cursor/rules/` directory with the following format:

```
---
description: Your rule description
globs: *,**/*
alwaysApply: true
---

Your rule content here
```

### Windsurf Rules

Windsurf rules are formatted with XML-like tags and appended to a `.windsurfrules` file:

```xml
<rule-name>
Your rule content here
</rule-name>
```

## License

MIT
