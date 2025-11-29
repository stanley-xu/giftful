## Project management with GitHub

**Always use MCP GitHub tools** (`mcp__github__*`) instead of `gh` CLI commands for GitHub operations:

- **Creating/updating issues**: Use `mcp__github__issue_write` with `method: "create"` or `method: "update"`
- **Searching issues**: Use `mcp__github__search_issues` for queries with criteria
- **Listing issues**: Use `mcp__github__list_issues` for board-style views
- **Reading issue details**: Use `mcp__github__issue_read` with appropriate method
- **Creating PRs**: Use `mcp__github__create_pull_request`

MCP tools provide better structure, type safety, error handling, and integration with planning workflows.

Only use `gh` CLI when MCP doesn't support the specific operation.

## When I ask "What's next?"

When I ask about what to work on (e.g., "What should I do today?", "What's the plan?", "Where did I leave off?"), follow this workflow:

Check primary resources

1. **Use GitHub MCP** to check the status of the project board
2. **Review roadmap/milestones** to see where we generally want to be
3. **Check current GitHub issues** that are in progress
4. **Check git status and history** for any work in progress

Supplementary resources

1. **Read `docs/project.md`** to check alignment with high-level direction. I will also write some rough notes and ideas I should keep track of that you should remind me of.
2. **Read `docs/claude-notes/`** to check for handoff notes you may have created. This is to regain context you may have lost (especially due to conversation compacting)
3. **Check for TODOs** in the codebase (comments, task lists, etc.)

Then **create a small plan** for me. **Present the smallest task that I could reasonably accomplish** to encourage me to start.

**Example prompts that trigger this:**

- "What should I do today?"
- "What's the plan?"
- "Where did I leave off?"

## Rules for code generation

IMPORTANT

- **DO offer simple examples** - When presenting a solution, show a concise example so I can decide if I want to implement it myself or have you generate it
- **DO explain concepts** - What are design tokens? How do RN components work?
- **DO show patterns and structure** - "Here's how you typically build a Button component..."
- **DO review and critique** - Point out improvements, better patterns, edge cases
- **DO act as tech lead** - Provide high-level architectural guidance, use the react-native-tech-lead agent when appropriate
- **DO rapidly write mechanical code** - Generate tests, Storybook stories, and other repetitive/boilerplate code without asking

Use the agents found for this project as you see fit as you (Claude) are likely to receive questions about (mobile) system architecture and UX.

## Project preferences

IMPORTANT

- Simple and understandable > Clever
- Prefer not using DB triggers
- When you troubleshoot problems and realizing you're running in circles, take a step back and do web searches for the problems we see at a high level. (e.g. instead of "supabase 2025 polyfill", do "supabase js hangs")
- Before writing new migrations make sure you understand the current database schema. Use `npx supabase db pull --schema public` to check.
- Use zod v4 syntax
- For any database schema changes NOTE:

  1. After migration is created,
  2. run `npm run db:reset` to migrate and reseed DB, and regen types
  3. Update the zod schemas to reflect the changes (remember to use zod v4 syntax)
