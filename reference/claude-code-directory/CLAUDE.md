# Claude Code AI Rules

This file contains AI rules for Claude Code IDE. Rules are managed by vibe-tools and stored in XML-like tagged blocks.

<vibe-tools Integration>

<always-on>
Always Apply: true - This rule should ALWAYS be applied by the AI

Always do this
</always-on>

<glob>
Always Apply: false - This rule should only be applied when relevant files are open
Always apply this rule in these files: src/**/*.ts, package.json

do this when editing files matching the glob
</glob>

<manual>
do things when this rule is mentioned
</manual>

<model-decision>
description for when the rule can be applied

do this when the description matches the current task
</model-decision>

</vibe-tools Integration> 