<template>
  <div>
    <!-- Modern Hero Section -->
    <section
      class="relative overflow-hidden bg-gradient-to-br from-white via-primary-50/30 to-primary-100/50 dark:from-gray-950 dark:via-primary-950/30 dark:to-primary-900/20 section-padding"
    >
      <!-- Background Grid Pattern -->
      <div class="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>

      <!-- Gradient Orbs -->
      <div
        class="absolute top-1/4 -left-40 w-80 h-80 bg-primary-300/20 dark:bg-primary-600/10 rounded-full blur-3xl animate-pulse"
      ></div>
      <div
        class="absolute bottom-1/4 -right-40 w-80 h-80 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl animate-pulse delay-1000"
      ></div>

      <div class="container-custom relative">
        <div class="max-w-5xl mx-auto text-center">
          <!-- Badge -->
          <div
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 rounded-full text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in"
          >
            <span class="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            AI Rules Management CLI
          </div>

          <!-- Main Heading -->
          <h1 class="text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
            <span class="text-gradient">vibe-rules</span>
          </h1>

          <!-- Subtitle -->
          <p
            class="text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up"
            style="animation-delay: 0.1s"
          >
            Manage and share AI rules (prompts, configurations) across different editors and tools.
            <span class="text-primary-600 dark:text-primary-400 font-semibold"
              >One CLI, every editor.</span
            >
          </p>

          <!-- Quick Start Card -->
          <div
            class="feature-card max-w-4xl mx-auto mb-12 glow-effect animate-slide-up"
            style="animation-delay: 0.2s"
          >
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">Quick Start</h2>
              <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm6 2a1 1 0 100 2h2a1 1 0 100-2H9z"
                    clip-rule="evenodd"
                  />
                </svg>
                Terminal
              </div>
            </div>
            <div class="code-block text-left">
              <div class="text-primary-400 mb-2"># Install globally</div>
              <div class="text-gray-300">bun i -g vibe-rules</div>
              <br />
              <div class="text-primary-400 mb-2"># Save your prompt locally</div>
              <div class="text-gray-300">
                vibe-rules save my-react-helper -f ./prompts/react-helper.md
              </div>
              <br />
              <div class="text-primary-400 mb-2"># Apply it to Cursor</div>
              <div class="text-gray-300">vibe-rules load my-react-helper cursor</div>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div
            class="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up"
            style="animation-delay: 0.3s"
          >
            <NuxtLink to="/local-usage" class="btn-primary">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Get Started
            </NuxtLink>
            <a
              href="https://github.com/futureexcited/vibe-rules"
              target="_blank"
              class="btn-secondary"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clip-rule="evenodd"
                />
              </svg>
              View on GitHub
            </a>
          </div>

          <!-- Trust Indicators -->
          <div
            class="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400 animate-fade-in"
            style="animation-delay: 0.4s"
          >
            <a
              href="https://github.com/futureexcited/vibe-rules"
              target="_blank"
              class="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
              {{ formatStars(stars) }} Stars
            </a>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              MIT License
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                  clip-rule="evenodd"
                />
              </svg>
              8+ Editors Supported
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm6 2a1 1 0 100 2h2a1 1 0 100-2H9z"
                  clip-rule="evenodd"
                />
              </svg>
              TypeScript Ready
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="section-padding bg-gray-50/50 dark:bg-gray-900/20">
      <div class="container-custom">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Key Features
            </h2>
            <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Everything you need to manage AI rules across your development workflow
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Save Rules -->
            <div class="feature-card group">
              <div
                class="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200"
              >
                <svg
                  class="w-7 h-7 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  ></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Save Rules</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Store AI rules locally for reuse across projects and editors with metadata support.
              </p>
              <div class="code-block text-sm">
                <div class="text-primary-400">vibe-rules save my-rule -f ./rule.md</div>
              </div>
            </div>

            <!-- Load Rules -->
            <div class="feature-card group">
              <div
                class="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200"
              >
                <svg
                  class="w-7 h-7 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  ></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Load Rules</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Apply saved rules to any supported editor with proper formatting and metadata.
              </p>
              <div class="code-block text-sm">
                <div class="text-green-400">vibe-rules load my-rule cursor</div>
              </div>
            </div>

            <!-- Install from NPM -->
            <div class="feature-card group">
              <div
                class="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200"
              >
                <svg
                  class="w-7 h-7 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  ></path>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Install from NPM</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Automatically install rules from NPM packages with
                <code class="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">llms</code>
                exports.
              </p>
              <div class="code-block text-sm">
                <div class="text-purple-400">vibe-rules install cursor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Supported Editors -->
    <section class="section-padding">
      <div class="container-custom">
        <div class="max-w-5xl mx-auto text-center">
          <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Supported Editors & Tools
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-300 mb-16 max-w-3xl mx-auto">
            Works seamlessly with your favorite development environment
          </p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div
              class="feature-card text-center group hover:border-primary-300 dark:hover:border-primary-700"
            >
              <div
                class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
              >
                <img src="/logos/cursor.svg" alt="Cursor" class="w-12 h-12" />
              </div>
              <div class="font-bold text-gray-900 dark:text-white">Cursor</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">.mdc files</div>
            </div>
            <div
              class="feature-card text-center group hover:border-primary-300 dark:hover:border-primary-700"
            >
              <div
                class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
              >
                <img src="/logos/windsurf.svg" alt="Windsurf" class="w-12 h-12" />
              </div>
              <div class="font-bold text-gray-900 dark:text-white">Windsurf</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">.windsurfrules</div>
            </div>
            <div
              class="feature-card text-center group hover:border-primary-300 dark:hover:border-primary-700"
            >
              <div
                class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
              >
                <img src="/logos/claude-code.svg" alt="Claude Code" class="w-12 h-12" />
              </div>
              <div class="font-bold text-gray-900 dark:text-white">Claude Code</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">CLAUDE.md</div>
            </div>
            <div
              class="feature-card text-center group hover:border-primary-300 dark:hover:border-primary-700"
            >
              <div
                class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
              >
                <img src="/logos/vscode.svg" alt="VS Code" class="w-12 h-12" />
              </div>
              <div class="font-bold text-gray-900 dark:text-white">VS Code</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">.instructions.md</div>
            </div>
            <div
              class="feature-card text-center group hover:border-primary-300 dark:hover:border-primary-700"
            >
              <div
                class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
              >
                <img src="/logos/zed.svg" alt="Zed" class="w-12 h-12" />
              </div>
              <div class="font-bold text-gray-900 dark:text-white">Zed</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">.rules</div>
            </div>
            <div
              class="feature-card text-center group hover:border-primary-300 dark:hover:border-primary-700"
            >
              <div
                class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
              >
                <img src="/logos/cline.svg" alt="Cline/Roo" class="w-12 h-12" />
              </div>
              <div class="font-bold text-gray-900 dark:text-white">Cline/Roo</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">.clinerules/</div>
            </div>
            <div
              class="feature-card text-center group hover:border-primary-300 dark:hover:border-primary-700"
            >
              <div
                class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
              >
                <img src="/logos/codex.svg" alt="Codex" class="w-12 h-12" />
              </div>
              <div class="font-bold text-gray-900 dark:text-white">Codex</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">AGENTS.md</div>
            </div>
            <div
              class="feature-card text-center group hover:border-primary-300 dark:hover:border-primary-700"
            >
              <div
                class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
              >
                <img src="/logos/amp.svg" alt="Amp" class="w-12 h-12" />
              </div>
              <div class="font-bold text-gray-900 dark:text-white">Amp</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">AGENT.md</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Example Usage -->
    <section class="section-padding bg-gray-50/50 dark:bg-gray-900/20">
      <div class="container-custom">
        <div class="max-w-6xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Example Usage
            </h2>
            <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See how easy it is to manage AI rules across your development workflow
            </p>
          </div>

          <div class="grid lg:grid-cols-2 gap-8">
            <!-- Save and Load Example -->
            <div class="feature-card">
              <div class="flex items-center gap-3 mb-6">
                <div
                  class="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl flex items-center justify-center"
                >
                  <svg
                    class="w-5 h-5 text-primary-600 dark:text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Save & Load Rules</h3>
              </div>
              <div class="code-block">
                <div class="text-primary-400 mb-1"># Save a rule from a file</div>
                <div class="text-gray-300 mb-3">
                  vibe-rules save react-best-practices -f ./prompts/react.md
                </div>

                <div class="text-green-400 mb-1"># Load it into Cursor</div>
                <div class="text-gray-300 mb-3">vibe-rules load react-best-practices cursor</div>

                <div class="text-blue-400 mb-1"># Load it into Claude Code globally</div>
                <div class="text-gray-300 mb-3">
                  vibe-rules load react-best-practices claude-code --global
                </div>

                <div class="text-purple-400 mb-1"># List all saved rules</div>
                <div class="text-gray-300">vibe-rules list</div>
              </div>
            </div>

            <!-- Install from NPM Example -->
            <div class="feature-card">
              <div class="flex items-center gap-3 mb-6">
                <div
                  class="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl flex items-center justify-center"
                >
                  <svg
                    class="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                    ></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                  Install from NPM Packages
                </h3>
              </div>
              <div class="code-block">
                <div class="text-primary-400 mb-1">
                  # Install rules from all dependencies for Cursor
                </div>
                <div class="text-gray-300 mb-3">vibe-rules install cursor</div>

                <div class="text-green-400 mb-1"># Install from a specific package</div>
                <div class="text-gray-300 mb-3">vibe-rules install cursor my-awesome-prompts</div>

                <div class="text-yellow-400 mb-1"># Install with debug logging</div>
                <div class="text-gray-300">vibe-rules install cursor --debug</div>
              </div>
            </div>
          </div>

          <!-- CTA Section -->
          <div class="text-center mt-16">
            <div class="feature-card max-w-2xl mx-auto">
              <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to get started?
              </h3>
              <p class="text-gray-600 dark:text-gray-300 mb-8">
                Install vibe-rules and start managing your AI rules like a pro
              </p>
              <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <NuxtLink to="/local-usage" class="btn-primary">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Get Started
                </NuxtLink>
                <NuxtLink to="/maintainers" class="btn-ghost">
                  For Maintainers
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// Get GitHub stars
const { stars, formatStars } = useGitHubStars();

// Set page meta
useHead({
  title: "vibe-rules - AI Rules Management CLI",
  meta: [
    {
      name: "description",
      content:
        "A powerful CLI tool for managing and sharing AI rules (prompts, configurations) across different editors and tools like Cursor, Windsurf, Claude Code, and more.",
    },
  ],
});
</script>
