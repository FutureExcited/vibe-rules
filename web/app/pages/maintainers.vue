<template>
  <div class="section-padding">
    <div class="container-custom">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 rounded-full text-primary-700 dark:text-primary-300 text-sm font-medium mb-8">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            For Package Maintainers
          </div>
          <h1 class="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Export AI Rules from <span class="text-gradient">NPM Packages</span>
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Learn how to export AI rules from your NPM packages so users can install them with vibe-rules.
          </p>
        </div>

        <!-- Overview -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Overview</h2>
          <div class="feature-card">
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              As AI becomes more integrated into development workflows, reusable AI rules and prompts are becoming valuable shared assets. 
              By exporting rules from your NPM packages, you can help developers get up to speed with your library's best practices quickly.
            </p>
            <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
              <p class="text-sm text-blue-700 dark:text-blue-300 dark:text-blue-300">
                vibe-rules looks for an <code class="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs">llms</code> export in your package that contains rule definitions compatible with various AI-powered editors.
              </p>
            </div>
          </div>
        </section>

        <!-- Package Setup -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Package Setup</h2>
          
          <div class="space-y-6">
            <!-- Package.json Configuration -->
            <div class="feature-card">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-4">1. Configure package.json</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">Add an <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">llms</code> export to your package.json:</p>
              <div class="code-block mb-4">
                <div class="text-gray-300">{</div>
                <div class="text-gray-300 ml-4">"name": "my-awesome-library",</div>
                <div class="text-gray-300 ml-4">"version": "1.0.0",</div>
                <div class="text-gray-300 ml-4">"exports": {</div>
                <div class="text-primary-400 ml-8">"./llms": {</div>
                <div class="text-green-400 ml-12">"import": "./dist/llms.mjs",</div>
                <div class="text-blue-400 ml-12">"require": "./dist/llms.cjs"</div>
                <div class="text-primary-400 ml-8">}</div>
                <div class="text-gray-300 ml-4">}</div>
                <div class="text-gray-300">}</div>
              </div>
              <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
                <p class="text-sm text-yellow-700 dark:text-yellow-300 dark:text-yellow-300">
                  <strong>Note:</strong> You can also use a simple string export: <code class="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded text-xs">"./llms": "./dist/llms.js"</code>
                </p>
              </div>
            </div>

            <!-- Create Rules File -->
            <div class="feature-card">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-4">2. Create Rules File</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">Create your rules file that exports an array of rule definitions:</p>
              
              <!-- ESM Example -->
              <div class="mb-6">
                <h4 class="font-semibold text-gray-800 dark:text-gray-200 dark:text-gray-200 mb-2">ESM Example (src/llms.mjs):</h4>
                <div class="code-block">
                  <div class="text-gray-500 mb-2">// Simple string rules</div>
                  <div class="text-yellow-400 mb-1">const simpleRules = [</div>
                  <div class="text-green-400 ml-4">"Always use TypeScript for this library",</div>
                  <div class="text-green-400 ml-4">"Follow the established API patterns"</div>
                  <div class="text-yellow-400 mb-3">];</div>
                  
                  <div class="text-gray-500 mb-2">// Advanced rule objects with metadata</div>
                  <div class="text-yellow-400 mb-1">const advancedRules = [</div>
                  <div class="text-primary-400 ml-4">{</div>
                  <div class="text-blue-400 ml-8">name: "api-guidelines",</div>
                  <div class="text-green-400 ml-8">rule: "When working with our API, always validate input parameters and handle errors gracefully.",</div>
                  <div class="text-purple-400 ml-8">description: "API development best practices",</div>
                  <div class="text-orange-400 ml-8">alwaysApply: true,</div>
                  <div class="text-cyan-400 ml-8">globs: ["src/api/**/*.ts", "src/routes/**/*.ts"]</div>
                  <div class="text-primary-400 ml-4">},</div>
                  <div class="text-primary-400 ml-4">{</div>
                  <div class="text-blue-400 ml-8">name: "testing-patterns",</div>
                  <div class="text-green-400 ml-8">rule: "Write comprehensive tests using our testing utilities. Mock external dependencies.",</div>
                  <div class="text-purple-400 ml-8">description: "Testing guidelines for this library",</div>
                  <div class="text-cyan-400 ml-8">globs: ["**/*.test.ts", "**/*.spec.ts"]</div>
                  <div class="text-primary-400 ml-4">}</div>
                  <div class="text-yellow-400 mb-3">];</div>
                  
                  <div class="text-red-400">export default [...simpleRules, ...advancedRules];</div>
                </div>
              </div>

              <!-- CommonJS Example -->
              <div class="mb-6">
                <h4 class="font-semibold text-gray-800 dark:text-gray-200 dark:text-gray-200 mb-2">CommonJS Example (src/llms.cjs):</h4>
                <div class="code-block">
                  <div class="text-red-400 mb-1">module.exports = [</div>
                  <div class="text-green-400 ml-4">"Always use TypeScript for this library",</div>
                  <div class="text-primary-400 ml-4">{</div>
                  <div class="text-blue-400 ml-8">name: "component-patterns",</div>
                  <div class="text-green-400 ml-8">rule: "Use our component composition patterns for building reusable UI elements.",</div>
                  <div class="text-purple-400 ml-8">description: "Component development guidelines",</div>
                  <div class="text-orange-400 ml-8">alwaysApply: false,</div>
                  <div class="text-cyan-400 ml-8">globs: ["src/components/**/*.tsx", "src/ui/**/*.tsx"]</div>
                  <div class="text-primary-400 ml-4">}</div>
                  <div class="text-red-400">];</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Rule Format Reference -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Rule Format Reference</h2>
          
          <div class="feature-card">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rule Object Schema</h3>
            <div class="code-block mb-4">
              <div class="text-blue-400 mb-1">interface PackageRuleObject {</div>
              <div class="text-green-400 ml-4">name: string;                    <span class="text-gray-500">// Rule identifier</span></div>
              <div class="text-green-400 ml-4">rule: string;                    <span class="text-gray-500">// The actual rule content</span></div>
              <div class="text-green-400 ml-4">description?: string;            <span class="text-gray-500">// Optional description</span></div>
              <div class="text-green-400 ml-4">alwaysApply?: boolean;           <span class="text-gray-500">// Apply automatically (Cursor)</span></div>
              <div class="text-green-400 ml-4">globs?: string | string[];       <span class="text-gray-500">// File patterns to match</span></div>
              <div class="text-blue-400">}</div>
            </div>
            
            <div class="grid gap-4 mt-6">
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">name</h4>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  A unique identifier for the rule. Will be prefixed with your package name when installed.
                </p>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">rule</h4>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  The actual rule content - this is what gets applied to the editor. Can be markdown formatted.
                </p>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">alwaysApply (Optional)</h4>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  For Cursor editor: when <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">true</code>, the rule is automatically applied to all files. When <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">false</code> or omitted, it's applied based on context.
                </p>
              </div>
              
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">globs (Optional)</h4>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  File patterns to match. Can be a single string or array of strings. Examples: <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">"src/**/*.ts"</code>, <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">["**/*.test.js", "**/*.spec.js"]</code>
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Build Process -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Build Process</h2>
          
          <div class="feature-card">
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Make sure your build process generates the llms files in the correct format and location:
            </p>
            
            <div class="code-block mb-4">
              <div class="text-gray-500 mb-2"># Example build script in package.json</div>
              <div class="text-gray-300">{</div>
              <div class="text-primary-400 ml-4">"scripts": {</div>
              <div class="text-green-400 ml-8">"build": "tsc && npm run build:llms",</div>
              <div class="text-blue-400 ml-8">"build:llms": "cp src/llms.js dist/llms.cjs && cp src/llms.mjs dist/llms.mjs"</div>
              <div class="text-primary-400 ml-4">}</div>
              <div class="text-gray-300">}</div>
            </div>
            
            <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4">
              <p class="text-sm text-green-700 dark:text-green-300 dark:text-green-300">
                <strong>Tip:</strong> You can also use a bundler like Rollup or esbuild to generate both CommonJS and ESM versions automatically.
              </p>
            </div>
          </div>
        </section>

        <!-- Testing Your Rules -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Testing Your Rules</h2>
          
          <div class="space-y-6">
            <div class="feature-card">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Local Testing</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">Test your rules locally before publishing:</p>
              <div class="code-block mb-4">
                <div class="text-primary-400 mb-1"># 1. Build your package</div>
                <div class="text-gray-300 mb-3">npm run build</div>
                
                <div class="text-green-400 mb-1"># 2. Test the llms export</div>
                <div class="text-gray-300 mb-3">node -e "console.log(require('./dist/llms.cjs'))"</div>
                
                <div class="text-blue-400 mb-1"># 3. Test with vibe-rules (link your package first)</div>
                <div class="text-gray-300 mb-1">npm link</div>
                <div class="text-gray-300 mb-1">cd ../test-project</div>
                <div class="text-gray-300 mb-1">npm link your-package-name</div>
                <div class="text-gray-300">vibe-rules install cursor your-package-name --debug</div>
              </div>
            </div>

            <div class="feature-card">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Validation</h3>
              <p class="text-gray-600 dark:text-gray-300 mb-4">vibe-rules validates your rule exports using Zod schemas. Common issues:</p>
              
              <div class="space-y-3">
                <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3">
                  <p class="text-sm text-red-700 dark:text-red-300">
                    <strong>Missing required fields:</strong> Make sure rule objects have <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">name</code> and <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">rule</code> properties.
                  </p>
                </div>
                
                <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3">
                  <p class="text-sm text-red-700 dark:text-red-300">
                    <strong>Wrong export format:</strong> Export should be an array of strings/objects, not a single object.
                  </p>
                </div>
                
                <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3">
                  <p class="text-sm text-red-700 dark:text-red-300">
                    <strong>Invalid globs:</strong> Globs should be strings or arrays of strings, not other types.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Best Practices -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Best Practices</h2>
          
          <div class="grid gap-4">
            <div class="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4">
              <h3 class="font-semibold text-green-800 mb-2">Clear Rule Names</h3>
              <p class="text-sm text-green-700 dark:text-green-300">
                Use descriptive names like "api-guidelines" or "testing-patterns" rather than generic names like "rule1".
              </p>
            </div>
            
            <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4">
              <h3 class="font-semibold text-blue-800 mb-2">Specific File Patterns</h3>
              <p class="text-sm text-blue-700 dark:text-blue-300">
                Use precise glob patterns to ensure rules only apply to relevant files. Avoid overly broad patterns like <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">"**/*"</code>.
              </p>
            </div>
            
            <div class="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 p-4">
              <h3 class="font-semibold text-purple-800 mb-2">Meaningful Descriptions</h3>
              <p class="text-sm text-purple-700 dark:text-purple-300">
                Add descriptions to help users understand when and why to use each rule.
              </p>
            </div>
            
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
              <h3 class="font-semibold text-yellow-800 mb-2">Use alwaysApply Sparingly</h3>
              <p class="text-sm text-yellow-700 dark:text-yellow-300">
                Only set <code class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">alwaysApply: true</code> for fundamental rules that should always be considered.
              </p>
            </div>
          </div>
        </section>

        <!-- Example Package -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Complete Example</h2>
          
          <div class="feature-card">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Example: React Component Library</h3>
            <div class="code-block">
              <div class="text-gray-500 mb-2">// src/llms.mjs</div>
              <div class="text-red-400 mb-1">export default [</div>
              <div class="text-primary-400 ml-4">{</div>
              <div class="text-blue-400 ml-8">name: "component-structure",</div>
              <div class="text-green-400 ml-8">rule: `When creating components with our library:</div>
              <div class="text-green-400 ml-8">- Use TypeScript interfaces for props</div>
              <div class="text-green-400 ml-8">- Follow our naming conventions (PascalCase)</div>
              <div class="text-green-400 ml-8">- Include JSDoc comments for public components</div>
              <div class="text-green-400 ml-8">- Use our theme system for styling`,</div>
              <div class="text-purple-400 ml-8">description: "Component development guidelines",</div>
              <div class="text-orange-400 ml-8">alwaysApply: false,</div>
              <div class="text-cyan-400 ml-8">globs: ["src/components/**/*.tsx", "src/ui/**/*.tsx"]</div>
              <div class="text-primary-400 ml-4">},</div>
              <div class="text-primary-400 ml-4">{</div>
              <div class="text-blue-400 ml-8">name: "testing-components",</div>
              <div class="text-green-400 ml-8">rule: `For component testing:</div>
              <div class="text-green-400 ml-8">- Use our custom render utility</div>
              <div class="text-green-400 ml-8">- Test accessibility with our a11y helpers</div>
              <div class="text-green-400 ml-8">- Mock theme provider in tests`,</div>
              <div class="text-purple-400 ml-8">description: "Component testing patterns",</div>
              <div class="text-cyan-400 ml-8">globs: ["**/*.test.tsx", "**/*.stories.tsx"]</div>
              <div class="text-primary-400 ml-4">},</div>
              <div class="text-primary-400 ml-4">{</div>
              <div class="text-blue-400 ml-8">name: "performance",</div>
              <div class="text-green-400 ml-8">rule: "Always consider performance: use React.memo for expensive components, useMemo for heavy calculations.",</div>
              <div class="text-purple-400 ml-8">description: "Performance optimization guidelines",</div>
              <div class="text-orange-400 ml-8">alwaysApply: true</div>
              <div class="text-primary-400 ml-4">}</div>
              <div class="text-red-400">];</div>
            </div>
          </div>
        </section>

        <!-- Publishing -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Publishing</h2>
          
          <div class="feature-card">
            <p class="text-gray-600 dark:text-gray-300 mb-4">Once your rules are ready, publish your package normally:</p>
            <div class="code-block mb-4">
              <div class="text-primary-400">npm publish</div>
            </div>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Users can then install your rules with:</p>
            <div class="code-block">
              <div class="text-green-400">vibe-rules install cursor your-package-name</div>
            </div>
            
            <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-4 mt-4">
              <p class="text-sm text-blue-700 dark:text-blue-300">
                <strong>Documentation:</strong> Consider adding a section to your README explaining that your package exports AI rules that can be installed with vibe-rules.
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
  title: 'Guide for Package Maintainers - vibe-rules',
  meta: [
    {
      name: 'description',
      content: 'Learn how to export AI rules from your NPM packages so users can install them with vibe-rules. Complete guide for library maintainers.'
    }
  ]
})
</script>