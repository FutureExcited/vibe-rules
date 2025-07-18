<template>
  <div class="section-padding">
    <div class="container-custom">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <div
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 rounded-full text-primary-700 dark:text-primary-300 text-sm font-medium mb-8"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Local Usage Guide
          </div>
          <h1 class="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Get Started with <span class="text-gradient">vibe-rules</span>
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Learn how to use vibe-rules to manage AI prompts and rules in your local development
            environment.
          </p>
        </div>

        <!-- Installation -->
        <section class="mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Installation
          </h2>
          <div class="feature-card">
            <p class="text-gray-600 dark:text-gray-300 mb-6 text-lg">
              Install vibe-rules globally using your preferred package manager:
            </p>
            <div class="code-block">
              <div class="text-primary-400 mb-1"># Using Bun (recommended)</div>
              <div class="text-gray-300 mb-4">bun i -g vibe-rules</div>

              <div class="text-green-400 mb-1"># Using npm</div>
              <div class="text-gray-300 mb-4">npm install -g vibe-rules</div>

              <div class="text-blue-400 mb-1"># Using yarn</div>
              <div class="text-gray-300">yarn global add vibe-rules</div>
            </div>
          </div>
        </section>

        <!-- Basic Commands -->
        <section class="mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Basic Commands
          </h2>

          <div class="space-y-6">
            <!-- Save Rule -->
            <div class="feature-card">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Save a Rule</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                Store a rule for later use in the common vibe-rules store.
              </p>
              <div class="code-block mb-4">
                <div class="text-primary-400 mb-1"># Save from a file</div>
                <div class="text-gray-300 mb-3">
                  vibe-rules save my-rule-name -f ./path/to/rule-content.md
                </div>

                <div class="text-green-400 mb-1"># Save directly from content string</div>
                <div class="text-gray-300 mb-3">
                  vibe-rules save another-rule -c "This is the rule content."
                </div>

                <div class="text-blue-400 mb-1"># Add a description</div>
                <div class="text-gray-300">
                  vibe-rules save my-rule-name -d "A concise description of what this rule does."
                </div>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
                <p class="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Options:</strong><br />
                  <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs"
                    >-f, --file &lt;file&gt;</code
                  >: Path to the file containing the rule content<br />
                  <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs"
                    >-c, --content &lt;content&gt;</code
                  >: Rule content provided as a string<br />
                  <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs"
                    >-d, --description &lt;desc&gt;</code
                  >: Optional description for the rule
                </p>
              </div>
            </div>

            <!-- List Rules -->
            <div class="feature-card">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                List Saved Rules
              </h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                See all the rules you've saved to the common local store.
              </p>
              <div class="code-block">
                <div class="text-primary-400">vibe-rules list</div>
              </div>
            </div>

            <!-- Load Rule -->
            <div class="feature-card">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Load (Apply) a Rule
              </h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                Apply a rule from your local store to a specific editor's configuration.
              </p>
              <div class="code-block mb-4">
                <div class="text-primary-400 mb-1"># Load for Cursor</div>
                <div class="text-gray-300 mb-3">vibe-rules load my-rule-name cursor</div>

                <div class="text-green-400 mb-1"># Load for Claude Code globally</div>
                <div class="text-gray-300 mb-3">
                  vibe-rules load my-rule-name claude-code --global
                </div>

                <div class="text-blue-400 mb-1"># Load for Windsurf</div>
                <div class="text-gray-300 mb-3">vibe-rules load my-rule-name windsurf</div>

                <div class="text-purple-400 mb-1"># Load to custom target path</div>
                <div class="text-gray-300">
                  vibe-rules load my-rule-name cursor -t ./my-project/.cursor-rules/
                </div>
              </div>
              <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4">
                <p class="text-sm text-green-700 dark:text-green-300">
                  <strong>Options:</strong><br />
                  <code class="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs"
                    >-g, --global</code
                  >: Apply to the editor's global configuration path<br />
                  <code class="bg-green-100 dark:bg-green-800 px-2 py-1 rounded text-xs"
                    >-t, --target &lt;path&gt;</code
                  >: Specify a custom target file path or directory
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Convert Command -->
        <section class="mb-16">
          <h2 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Convert Rule Formats
          </h2>

          <div class="space-y-6">
            <!-- Convert Rule -->
            <div class="feature-card">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Convert Between Formats
              </h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                Seamlessly convert rules between all supported editor formats.
              </p>
              <div class="code-block mb-4">
                <div class="text-primary-400 mb-1"># Convert from cursor to claude-code</div>
                <div class="text-gray-300 mb-3">
                  vibe-rules convert cursor claude-code ./.cursor/rules
                </div>
              </div>
              <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
                <p class="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Usage:</strong><br />
                  <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs"
                    >vibe-rules convert &lt;sourceFormat&gt; &lt;targetFormat&gt; &lt;sourcePath&gt;
                    [options]</code
                  >
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Install from NPM -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Install Rules from NPM Packages
          </h2>

          <div class="feature-card mb-6">
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Install rules directly from NPM packages into an editor's configuration. This
              automatically scans your project's dependencies for compatible rule exports.
            </p>
            <div class="code-block mb-4">
              <div class="text-primary-400 mb-1">
                # Install rules from ALL dependencies for Cursor
              </div>
              <div class="text-gray-300 mb-3">vibe-rules install cursor</div>

              <div class="text-green-400 mb-1"># Install rules from a specific package</div>
              <div class="text-gray-300 mb-3">vibe-rules install cursor my-rule-package</div>

              <div class="text-blue-400 mb-1"># Install with debug logging</div>
              <div class="text-gray-300 mb-3">vibe-rules install cursor --debug</div>

              <div class="text-purple-400 mb-1"># Install to custom target directory</div>
              <div class="text-gray-300">
                vibe-rules install roo my-rule-package -t ./custom-ruleset/
              </div>
            </div>
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>How it works:</strong><br />
                1. Looks for NPM packages with
                <code class="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded text-xs">llms</code>
                exports<br />
                2. Imports the
                <code class="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded text-xs">llms</code>
                module from each package<br />
                3. Applies the rules to your editor's configuration with proper formatting
              </p>
            </div>
          </div>
        </section>

        <!-- Supported Editors -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Supported Editors & Formats
          </h2>

          <div class="grid gap-4">
            <div class="feature-card">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Cursor</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Creates/updates individual .mdc files in ./.cursor/rules/
                  </p>
                </div>
                <code
                  class="text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded"
                  >cursor</code
                >
              </div>
            </div>

            <div class="feature-card">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Windsurf</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Appends rules to ./.windsurfrules with tagged blocks
                  </p>
                </div>
                <code
                  class="text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded"
                  >windsurf</code
                >
              </div>
            </div>

            <div class="feature-card">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Claude Code</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Updates ./CLAUDE.md (local) or ~/.claude/CLAUDE.md (global)
                  </p>
                </div>
                <code
                  class="text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded"
                  >claude-code</code
                >
              </div>
            </div>

            <div class="feature-card">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">VS Code</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Creates .instructions.md files in ./.github/instructions/
                  </p>
                </div>
                <code
                  class="text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded"
                  >vscode</code
                >
              </div>
            </div>

            <div class="feature-card">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Zed</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Manages rules within ./.rules file
                  </p>
                </div>
                <code
                  class="text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded"
                  >zed</code
                >
              </div>
            </div>

            <div class="feature-card">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white">Cline/Roo</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-300">
                    Creates .md files in ./.clinerules/ directory
                  </p>
                </div>
                <div class="flex gap-2">
                  <code
                    class="text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded"
                    >clinerules</code
                  >
                  <span class="text-gray-400">or</span>
                  <code
                    class="text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded"
                    >roo</code
                  >
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Example Workflow -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Example Workflow</h2>

          <div class="feature-card">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Complete Example: React Development Rules
            </h3>
            <div class="code-block mb-4">
              <div class="text-primary-400 mb-1"># 1. Save a React-specific rule</div>
              <div class="text-gray-300 mb-3">
                vibe-rules save react-best-practices -f ./prompts/react-rules.md -d "React
                development best practices"
              </div>

              <div class="text-green-400 mb-1"># 2. Apply it to multiple editors</div>
              <div class="text-gray-300 mb-1">vibe-rules load react-best-practices cursor</div>
              <div class="text-gray-300 mb-1">vibe-rules load react-best-practices windsurf</div>
              <div class="text-gray-300 mb-3">vibe-rules load react-best-practices claude-code</div>

              <div class="text-blue-400 mb-1"># 3. List all your saved rules</div>
              <div class="text-gray-300 mb-3">vibe-rules list</div>

              <div class="text-purple-400 mb-1">
                # 4. Install additional rules from NPM packages
              </div>
              <div class="text-gray-300 mb-3">vibe-rules install cursor my-react-library</div>

              <div class="text-yellow-400 mb-1"># 5. Apply to global configuration</div>
              <div class="text-gray-300">
                vibe-rules load react-best-practices claude-code --global
              </div>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
              <p class="text-sm text-blue-700 dark:text-blue-300">
                This workflow creates a reusable React rule that can be applied across different
                editors and projects, while also pulling in additional rules from NPM packages.
              </p>
            </div>
          </div>
        </section>

        <!-- Tips -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Tips & Best Practices
          </h2>

          <div class="space-y-4">
            <div class="bg-green-50 border-l-4 border-green-400 p-4">
              <h3 class="font-semibold text-green-800 mb-2">Organize Your Rules</h3>
              <p class="text-sm text-green-700">
                Use descriptive names and descriptions for your rules to make them easy to find and
                understand later.
              </p>
            </div>

            <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
              <h3 class="font-semibold text-blue-800 mb-2">Use Debug Mode</h3>
              <p class="text-sm text-blue-700">
                Add
                <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">--debug</code>
                to any command to see detailed logging and troubleshoot issues.
              </p>
            </div>

            <div class="bg-purple-50 border-l-4 border-purple-400 p-4">
              <h3 class="font-semibold text-purple-800 mb-2">Metadata Support</h3>
              <p class="text-sm text-purple-700">
                When saving from .mdc files, vibe-rules automatically extracts metadata like
                <code class="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded text-xs"
                  >alwaysApply</code
                >
                and
                <code class="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded text-xs">globs</code
                >.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
useHead({
  title: "Local Usage Guide - vibe-rules",
  meta: [
    {
      name: "description",
      content:
        "Complete guide for using vibe-rules locally to manage AI prompts and rules across different editors and tools.",
    },
  ],
});
</script>
