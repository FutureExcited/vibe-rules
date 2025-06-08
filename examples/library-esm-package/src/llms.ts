import type { PackageRuleObject } from "vibe-rules";

const rules: PackageRuleObject[] = [
{
    name: 'api',
    description: 'TanStack Router: API',
    rule: "Rules for API",
    alwaysApply: false,
    globs: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    {
    name: 'guide',
    description: 'TanStack Router: Guide',
    rule: "Rules for Guide",
    alwaysApply: false,
    globs: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    {
    name: 'routing',
    description: 'TanStack Router: Routing',
    rule: "Rules for Routing",
    alwaysApply: false,
    globs: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    {
    name: 'setup-and-architecture',
    description: 'TanStack Router: Setup and Architecture',
    rule: "Rules for Setup and Architecture",
    alwaysApply: false,
    globs: ['package.json', 'vite.config.ts', 'tsconfig.json', 'src/**/*.ts', 'src/**/*.tsx'],
    }
]
export default rules;