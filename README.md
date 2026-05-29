# Blanko

A fill-in-the-blank game for reinforcing foreign-language spelling and recall — paste a
passage in your target language, pick a difficulty, fill in the missing words, and get a
score plus a review of every word you missed alongside its correct spelling.

But the game is really the excuse. **This repo is a field test of two things at once:**
building an entire codebase with AI (no hand-written code), and learning
[GitHub's Spec Kit](https://github.com/github/spec-kit) as the workflow for doing it.

If you're a designer or developer curious about spec-driven development with AI, the notes
below are the actual point — what the process felt like, where it held up, and where it
didn't.

**▶ Try it live: [blanko-game.netlify.app](https://blanko-game.netlify.app/)**

## The experiment

I set three goals and deliberately kept the surface area small:

1. **Learn Spec Kit, and _only_ Spec Kit.** No other new tools, frameworks, or techniques —
   so that anything that felt awkward could be attributed to the workflow rather than to
   five unfamiliar things at once.
2. **Let AI build the whole thing.** No hand-coding. If the code was wrong, the fix had to
   come from steering the AI, not from me opening the file.
3. **Ship something genuinely useful** — a language-practice tool I'd actually open.

The honest risk going in: the idea might be _too small_ to learn anything meaningful about
the workflow. (Verdict: it was small, but not too small — see below.)

## What Blanko does

Foreign-language learners need lots of different ways to drill the same material. Blanko
targets spelling and recall specifically:

- **Bring your own text.** Paste any passage in any language. Nothing is pre-baked.
- **Pick a difficulty.** Easy / Medium / Hard. Higher difficulty blanks out more words and
  biases toward longer, less-predictable ones; blanks are spread across the whole passage,
  not bunched at the top.
- **Fill in the blanks.** The full passage stays on screen as context, with input fields
  where the words used to be.
- **Get scored and learn from it.** Scoring is case-insensitive but accent-sensitive
  (`paris` ✅, `ecole` ❌ for `école`). The results screen pairs every wrong answer with the
  correct spelling so you can compare letter by letter.
- **Come back later.** Sessions persist in `localStorage` — resume an in-progress round or
  reopen a finished one. No login.
- **Works offline and stays private.** After first load, nothing leaves the device — no
  passage text, no answers, no telemetry. A service worker keeps it playable with the
  network off.

## The Spec Kit process

Spec Kit structures the work as a sequence of stages, each producing a durable artifact
before any code gets written:

```
constitution  →  spec  →  clarify  →  plan  →  implement
```

- **Constitution** — the project's non-negotiable principles (test-first, strict types,
  shadcn-first UI, simplicity/YAGNI, local-first data). See
  [`.specify/memory/constitution.md`](./.specify/memory/constitution.md).
- **Spec** — the feature in plain language: user stories, acceptance scenarios, success
  criteria. No implementation detail. See
  [`specs/001-fill-blank-game/spec.md`](./specs/001-fill-blank-game/spec.md).
- **Clarify** — a structured Q&A pass that hunts for ambiguity in the spec and writes the
  answers back into it (how a "word" is defined, the session cap, the accessibility
  baseline, the privacy stance).
- **Plan** — the technical design: stack, project structure, and a constitution check that
  has to pass before any implementation. See
  [`specs/001-fill-blank-game/plan.md`](./specs/001-fill-blank-game/plan.md).
- **Implement** — turn the plan into code.

All of the design artifacts live under [`specs/001-fill-blank-game/`](./specs/001-fill-blank-game/)
if you want to read what the AI produced at each stage.

## What I learned

**Get spec → clarify → plan done in a single PR.** Spec Kit's branch-naming conventions
assume one feature branch carries you through that whole arc, so splitting those stages
across branches fights the tooling. The constitution is the exception — it's project-wide
rather than feature-scoped, and is best handled in its own separate PR.

**Two CLIs pulled their weight.** The [GitHub CLI](https://cli.github.com/) and the
[Playwright CLI](https://playwright.dev/docs/test-cli) were the right call — giving the AI
direct command-line access to PRs and to a real browser made the loop much tighter.

**The planning stages were the strong part.** Forcing ambiguity to the surface _before_
code (the clarify step especially) is where spec-driven development earned its keep. The
spec and plan are genuinely good documents.

**Implementation is where it got rough.** Spec Kit's own examples and intro video lean
toward "one-shotting" a whole app from a single spec, and I'm not convinced that's the right
approach for anything non-trivial. The first pass:

- Invented its own visual design for the app — I had to explicitly force it onto shadcn
  components.
- Shipped text inputs that didn't actually work.
- Left the Playwright tests broken (likely my fault — I don't think e2e was wired up
  correctly before implementation even started).
- Needed Prettier run manually across everything at the end.

The takeaway: the spec/plan phases are worth adopting wholesale. For implementation, I
suspect the tool is better used by breaking the work into _multiple, smaller specs_ rather
than one big one — which also seems closer to how developers in the field are actually using
it. That's the basis for a planned follow-up experiment: take the same kind of project but
decompose it into several specs and see whether the implementation phase holds up better.

## Tech stack

The plan settled on a single, fully-offline SPA with no backend:

- **[React Router v7](https://reactrouter.com/)** (SPA mode), **React 19**, **TypeScript**
  in `strict` mode
- **[Tailwind CSS v4](https://tailwindcss.com/)** + **[shadcn](https://ui.shadcn.com/)**
  components ([Base UI](https://base-ui.com/) under the hood)
- A pure, framework-free **game engine** (`app/engine/`) for tokenization
  (`Intl.Segmenter`), blank selection, scoring, and difficulty math — no React or DOM
  coupling, so it's directly unit-testable
- **`localStorage`** behind a versioned schema (`app/storage/`); **`vite-plugin-pwa`** for
  offline-after-first-load
- **[Vitest](https://vitest.dev/)** for unit/component tests, **[Playwright](https://playwright.dev/)**
  for keyboard-only e2e flows (including Cyrillic and CJK passages)

## Running it locally

This project uses **pnpm**.

```bash
pnpm install
pnpm dev          # dev server at http://localhost:5173
```

Other useful scripts:

```bash
pnpm test         # Vitest in watch mode
pnpm ci:test      # Vitest once (CI mode)
pnpm e2e          # Playwright end-to-end tests
pnpm typecheck    # React Router typegen + tsc
pnpm lint         # ESLint
pnpm build        # production build
```

## Project layout

```text
app/
├── routes/        # Start, Exercise, Results, Sessions screens
├── engine/        # Pure game logic: tokenize, select-blanks, score, difficulty, label
├── storage/       # Versioned localStorage adapter + eviction
└── components/     # shadcn primitives + the one bespoke component (PassageView)
specs/
└── 001-fill-blank-game/   # Spec Kit artifacts: spec, clarifications, plan, contracts
.specify/
└── memory/constitution.md # Project principles enforced at every stage
tests/
├── unit/ component/ e2e/  # Vitest + Playwright
```

---

_In keeping with the experiment, this README was written by Claude from my rough notes on
the process — not hand-edited by me._
