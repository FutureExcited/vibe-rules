# Reference project structures

This directory contains reference project structures for different editor configurations and all the kinds of rule files they use.

## Cline

[cline-rules-directory](./cline-rules-directory/) contains an example of workspace rules structure for the Cline AI coding assistant.

Cline supports both workspace and global rules:
- **Workspace rules**: Stored in `.clinerules/` directory
- **Global rules**: Stored in `~/Documents/Cline/Rules` directory (applies across all projects)
- **Format**: All files use Markdown format with no special formatting.

## Claude Code

[claude-code-directory](./claude-code-directory/) contains an example of how Claude Code IDE manages AI rules.

Claude Code uses a single file for all rules:
- **Project rules**: Stored in `./CLAUDE.md` file in project root
- **Global rules**: Stored in `~/.claude/CLAUDE.md` file (applies across all projects)
- **Format**: Single markdown file with XML-like tagged blocks. When using vibe-rules, each rule is encapsulated in tags (e.g., `<rule-name>...</rule-name>`) within a `<vibe-tools Integration>...</vibe-tools Integration>` block for organization.

## Windsurf 

[windsurf-rules-directory](./windsurf-rules-directory/) contains an example of workspace rules structure (in `./.windsurf/rules/`) for the Windsurf editor.

Windsurf also stores global rules in a *single markdown file* ~/.codeium/windsurf/memories/global_rules.md

- **Workspace rules**: Stored in `./.windsurf/rules/` as markdown files
- **Global rules**: Stored in `~/.codeium/windsurf/memories/global_rules.md` file
- **Format**: global_rules.md is a single markdown file with no special formatting. `.windsurf/rules/` contains markdown files with a special header section that includes the rule name, description and configuration for when the rule should be applied (check the [windsurf-rules-directory](./windsurf-rules-directory/) for examples).

## Cursor

[cursor-rules-directory](./cursor-rules-directory/) contains an example of workspace rules structure for the Cursor editor.

- **Workspace rules**: Stored in `./.cursor/rules/` as mdc (a special markdown format) files.
- **Global rules**: Stored in `~/.cursor/rules/` as mdc files.
- **Format**: mdc files are a special markdown format that includes a header section with the rule name, description and configuration for when the rule should be applied (check the [cursor-rules-directory](./cursor-rules-directory/) for examples).




