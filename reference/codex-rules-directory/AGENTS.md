# CODEX Agent Configuration

This file demonstrates how `vibe-rules` formats and manages rules for the CODEX editor. Rules are stored as XML-like tagged blocks within a `<vibe-tools Integration>` section.

## Codex File Hierarchy

Codex looks for AGENTS.md files in the following places and merges them top-down:
1. `~/.codex/AGENTS.md` - personal global guidance (use `--global` flag)
2. `AGENTS.md` at repo root - shared project notes (default behavior)
3. `AGENTS.md` in current working directory - sub-folder/feature specifics (use `--target` flag)

## Custom Project Rules

Add your custom CODEX rules here...

## Rule Examples

<!-- vibe-tools Integration -->
<react-component-patterns>
React Component Development Guidelines

Always Apply: true
Globs: src/components/**/*.tsx, src/components/**/*.jsx

When creating React components:
1. Use functional components with hooks instead of class components
2. Implement proper TypeScript interfaces for props
3. Use descriptive component and prop names
4. Extract complex logic into custom hooks
5. Add proper JSDoc comments for complex components
6. Use React.memo() for performance optimization when appropriate
7. Implement proper error boundaries for critical components
</react-component-patterns>

<api-design-patterns>
API Development Best Practices

Always Apply: false
Globs: src/api/**/*.ts, src/routes/**/*.ts

For API development:
1. Use consistent REST conventions (GET, POST, PUT, DELETE)
2. Implement proper error handling with meaningful HTTP status codes
3. Use middleware for authentication and validation
4. Document APIs with OpenAPI/Swagger specifications
5. Implement rate limiting and request validation
6. Use proper TypeScript types for request/response objects
7. Add comprehensive logging for debugging
</api-design-patterns>

<testing-guidelines>
Testing and Quality Assurance

Always Apply: true

Testing best practices:
1. Write unit tests for all business logic functions
2. Use integration tests for API endpoints
3. Implement end-to-end tests for critical user flows
4. Maintain at least 80% code coverage
5. Use descriptive test names that explain the scenario
6. Mock external dependencies appropriately
7. Test both success and error cases
8. Use factories or fixtures for test data setup
</testing-guidelines>

<architecture-patterns>
Software Architecture Guidelines

Globs: src/models/**/*.ts, src/services/**/*.ts, src/utils/**/*.ts

Architecture principles:
1. Follow SOLID principles in class design
2. Use dependency injection for better testability
3. Implement proper separation of concerns
4. Use design patterns appropriately (Factory, Strategy, Observer)
5. Keep functions small and focused on single responsibility
6. Implement proper error handling and logging
7. Use TypeScript interfaces to define contracts
8. Follow consistent naming conventions
</architecture-patterns>
<!-- /vibe-tools Integration -->

## Additional Notes

The CODEX editor reads agent instructions from `AGENTS.md` files. The hierarchy allows for flexible configuration:
- Global rules apply to all projects
- Project-root rules apply to the entire project  
- Directory-specific rules apply to current working directory contexts

Rules managed by `vibe-rules` are contained within the `<!-- vibe-tools Integration -->` comment block to distinguish them from manually added rules.

Rules can include metadata such as:
- **Always Apply**: Whether the rule should be automatically applied to all relevant contexts
- **Globs**: File patterns that determine when the rule should be active

Use `vibe-rules` commands to manage these rules:
- `vibe-rules save my-rule -f ./my-rule.md` - Save a rule to local storage
- `vibe-rules load my-rule codex` - Apply a saved rule to this file
- `vibe-rules load my-rule codex --global` - Apply to global `~/.codex/AGENTS.md`
- `vibe-rules load my-rule codex --target ./subdir/AGENTS.md` - Apply to specific directory
- `vibe-rules install codex` - Install rules from NPM packages with `llms` exports 