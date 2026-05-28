<!--
SYNC IMPACT REPORT
==================
Version change: (uninitialized template) → 1.0.0
Bump rationale: Initial ratification of the project constitution; no prior version
to amend.

Modified principles: N/A (initial adoption)
Added sections:
  - Core Principles (5 principles)
  - Technology Constraints
  - Development Workflow
  - Governance
Removed sections: None

Templates requiring updates:
  - .specify/templates/plan-template.md          ✅ no change required
    (Constitution Check section reads principles from this file at runtime)
  - .specify/templates/spec-template.md          ✅ no change required
    (spec scope is principle-agnostic)
  - .specify/templates/tasks-template.md         ✅ no change required
    (test-first ordering already enforced in "Within Each User Story" notes)
  - .claude/skills/speckit-*/SKILL.md            ✅ no change required
  - CLAUDE.md                                    ⚠ pending — points to "current plan"
    only; does not yet reference constitution. Update when first feature plan exists.
  - README.md                                    ✅ no change required
    (project overview, no governance content)

Follow-up TODOs: None
-->

# Blanko Game Constitution

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

Every behavior change MUST begin with a failing test. The order is fixed: write
the test, watch it fail, write the minimum code to make it pass, refactor.
Vitest covers units and components; Playwright covers user-visible flows. A pull
request that adds or modifies game logic, routing, or interactive UI without an
accompanying test that demonstrably fails on the parent commit MUST be rejected.

**Rationale**: A word/puzzle game's correctness lives in tiny rule interactions
(scoring, word validation, board state). Without tests written first, regressions
hide in plain sight and refactors stall. TDD keeps the rule engine truthful as
the UI evolves.

### II. Type Safety End-to-End

TypeScript `strict` mode MUST stay on. `any` is forbidden in production code;
use `unknown` and narrow, or define the type. React Router's generated route
types MUST be regenerated (`npm run typecheck`) and pass before a PR merges.
ESLint and `tsc` MUST be clean — warnings count as failures in CI.

**Rationale**: The route loader/action data flow only protects the app when
types are exact. Loose types here cause runtime crashes that bypass tests.

### III. Component-Driven UI

UI is assembled from small, composable components. Primitives come from
shadcn/`@base-ui/react`; layout and variants use Tailwind utilities and `cva`.
A component MUST live under `app/components/` once it is reused or exceeds
~80 lines. New design tokens MUST extend the existing Tailwind theme rather
than be hard-coded. Inline styles are forbidden outside one-off prototypes.

**Rationale**: A game grows by adding screens (menu, board, results, settings).
Shared primitives keep the look consistent and make a new screen cheap to build.

### IV. Simplicity & YAGNI

Build the smallest thing that satisfies the current user story. New
dependencies, abstractions, state-management libraries, or backend services
MUST be justified against a concrete, present-day requirement — not a
hypothetical future one. Three duplicated lines beat a premature abstraction.
Complexity additions MUST be recorded in the plan's Complexity Tracking table
with the alternative that was rejected and why.

**Rationale**: This is a browser game with a single developer. Every dependency,
build step, and indirection compounds maintenance cost. Staying small is the
only sustainable strategy.

### V. Local-First Data

Game state (progress, scores, settings, saved games) MUST persist in the
browser by default — `localStorage`, `IndexedDB`, or in-memory with explicit
serialization. No server round-trip is required for core gameplay. If a feature
genuinely needs a server (e.g., shared leaderboards), it MUST degrade
gracefully when offline and MUST NOT block the offline experience.

**Rationale**: A puzzle game should load instantly, work on a plane, and never
lose a player's progress to a network blip. Local-first is also the cheapest
operating posture for a hobby-scale project.

## Technology Constraints

The stack is fixed unless an amendment is ratified:

- **Framework**: React Router v7 in SPA mode (`react-router.config.ts`).
- **Language**: TypeScript (strict). React 19.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`.
- **UI primitives**: `@base-ui/react` + shadcn-generated components.
- **Testing**: Vitest (units/components), Playwright (e2e).
- **Lint/Format**: ESLint (including `eslint-plugin-react-hooks` and
  `eslint-plugin-jsx-a11y`) and Prettier.
- **Package manager**: pnpm.
- **Build/run**: `pnpm dev`, `pnpm build`, `pnpm ci:test`, `pnpm e2e`, `pnpm lint`.

Adding a runtime dependency requires recording the justification in the
feature's plan.md under Complexity Tracking. Replacing any item above requires
a constitution amendment (MINOR or MAJOR depending on scope).

## Development Workflow

- **Specs first**: Non-trivial work flows through `/speckit-specify` →
  `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`. Direct
  implementation is acceptable only for typo/docs/dependency-bump changes.
- **Feature branches**: One branch per feature, created by
  `/speckit-git-feature` (numbered, kebab-case).
- **Constitution Check gate**: Every plan MUST contain a Constitution Check
  section evaluated against these five principles before Phase 0 research and
  re-evaluated after Phase 1 design.
- **CI gates** (all MUST pass before merge): `pnpm lint`, `pnpm typecheck`,
  `pnpm ci:test`, and `pnpm e2e` for user-visible changes.
- **Commits**: Small, focused, conventional-commit-style messages
  (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
- **Reviews**: A self-review or peer review MUST verify constitution
  compliance and surface any complexity additions explicitly.

## Governance

This constitution supersedes ad-hoc conventions. When a guideline elsewhere
(README, code comments, prior commits) conflicts with the constitution, the
constitution wins until the conflicting guideline is updated or this document
is amended.

**Amendment procedure**:

1. Propose the change in a PR that edits `.specify/memory/constitution.md`.
2. Include a Sync Impact Report comment at the top of the file describing
   version change, modified principles, and templates touched.
3. Bump `CONSTITUTION_VERSION` per semantic versioning:
   - **MAJOR**: A principle is removed, redefined incompatibly, or governance
     rules change in a way that invalidates prior plans.
   - **MINOR**: A new principle/section is added, or guidance is materially
     expanded.
   - **PATCH**: Wording, typo, or non-semantic clarifications.
4. Update `LAST_AMENDED_DATE` to the merge date. `RATIFICATION_DATE` never
   changes.

**Compliance review**: Each plan's Constitution Check section is the
enforcement point. Reviewers MUST reject plans that violate a principle
without a recorded, justified entry in the Complexity Tracking table.

**Runtime guidance**: `CLAUDE.md` and per-feature plan.md files provide the
operational details (tech stack specifics, current focus) that complement
this document. When they disagree with the constitution, this document wins.

**Version**: 1.0.0 | **Ratified**: 2026-05-28 | **Last Amended**: 2026-05-28
