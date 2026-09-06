# Antigravity / Agent Workspace Rules for AstroLib (my-astro-site)

## 1. Development & Server Management

When starting the dev server, always use background mode:
```bash
astro dev --background
```

Manage the server using dedicated commands (or via `node node_modules/astro/bin/astro.mjs dev ...` if `astro` is not in PATH):
- `astro dev status` - Check server status and port
- `astro dev logs` - View real-time log outputs
- `astro dev stop` - Safely stop the server using PID lockfile (`.astro/dev.json`)

## 2. Core Architecture Rules & Constraints

### 2.1 Central Architecture Invariants (The 10 Tenets)

1. **Rule 1 — UI is not a domain model**:
   `components/` must NEVER serve as the source of domain data models or type definitions for other systems. Shared models/types belong in dedicated models/types layers.
2. **Rule 2 — Publishing is independent**:
   Publishing and export systems (LaTeX / Typst / EPUB / PDF) must NOT depend on UI components or client controllers. They must remain pure, headless compilers/formatters.
3. **Rule 3 — Source of Truth**:
   Any generated data must NEVER become a Source of Truth. `collections.config.mjs`, `features.config.mjs`, and raw input texts/databases are sources of truth.
4. **Rule 4 — Generated Data**:
   All regenerable data (indices, pre-rendered JSON, topology graphs) must explicitly indicate its generator script and source input.
5. **Rule 5 — Public Directory Hygiene**:
   `public/` is strictly reserved for static assets directly served to the browser.
   Strictly forbidden in `public/`:
   - Test outputs (`test_*.pdf`, `test_*.tex`, `test_*.typ`)
   - Compiler artifacts and intermediate build files (`*.aux`, `*.idx`, `*.mst`)
   - Logs (`*.log`)
   - Temporary files
6. **Rule 6 — Feature Isolation**:
   The primary logic of a business feature (UI, state, client logic, and feature configs) should reside within that feature's cohesive boundary.
7. **Rule 7 — Utils Purity**:
   Do NOT add new modules with explicit business semantics to `utils/`.
   Code belonging to AI, Exercise, Editor, Publishing, Inspector, Relation Graph, or Feedback must go to its corresponding Feature / Service. `utils/` is reserved strictly for pure, stateless, reusable helpers.
8. **Rule 8 — Scripts Boundary**:
   `scripts/` is exclusively responsible for build, import, export, maintenance, and test automation. Business runtime logic must NOT depend on `scripts/`.
9. **Rule 9 — Runtime must not mutate source**:
   Development servers, Vite plugins, and runtime endpoints must NEVER directly mutate Source Data on disk (e.g. overwriting tracked JSONs or executing synchronous shell scripts).
10. **Rule 10 — Small Migrations (No Big Bang Rewrite)**:
    Architectural refactoring must strictly follow:
    > **one boundary → one migration → one verification**
    Big Bang Rewrites are strictly prohibited.

### 2.2 Operational Constraints

- **Single Sources of Truth**: `src/config/collections.config.mjs` (books/collections) and `src/config/features.config.mjs` (Feature Registry). ⚠️ `src/config/books.config.mjs` is obsolete.
- **Routing & Clean Slugs**: Every generated link pointing to a book chapter MUST use `cleanSlug()` from `src/utils/sidebar.mjs`. Never hardcode raw filenames into URL strings.
- **MDX Syntax Validation**: Run `node scripts/scan-mdx.mjs src/content/docs/collections/<collection>/<book>` before committing.
- **Sidebar & Performance**: Left sidebar renders only current book (`SidebarOverride.astro`). KaTeX uses `output: 'html'`.

## 3. Project Skills & Documentation

Refer to workspace skills located in `.agents/skills/` for detailed multi-step guides:
- `astro-project-guide` (`.agents/skills/astro-project-guide/SKILL.md`): Architecture, card components & MDX authoring.
- `import-book` (`.agents/skills/import-book/SKILL.md`): End-to-end MinerU OCR to MDX conversion procedure.
- `academic-content-pipeline` (`.agents/skills/academic-content-pipeline/SKILL.md`): Six-stage multi-agent pipeline for textbook typesetting, worksheet generation, and publishing QA.
Technical design and handover docs are indexed in [docs/README.md](file:///E:/0000work/prep_project/my-astro-site/docs/README.md).

## 4. Git Commit & Distribution Standards

### 4.1 Academic & Restrained Commit Specification (Mandatory)

All Git commits must strictly follow the **Academic Restrained Conventional Specification**:
- **English Only**: Commit summaries and bodies MUST be written in academic, concise English (ASCII only). No Chinese commit messages.
- **No Emojis**: Emojis (e.g. 🚀, ✨, 🔥, 🎉) are strictly forbidden.
- **Restrained & Objective Tone**: Strictly avoid AI hype or marketing buzzwords (`revolutionary`, `super powerful`, `blazing fast`, `seamlessly`, `all-in-one`). Describe *what* was changed and *why* in imperative mood.
- **Format**: `<type>(<scope>): <imperative summary>`
  - Allowed types: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `chore`, `test`, `release`, `ci`, `build`
  - Valid scopes: `(content)`, `(katex)`, `(ui)`, `(ai)`, `(epub)`, `(sidebar)`, `(header)`, `(render)`, `(editor)`, `(ci)`, `(core)`
  - Examples:
    - `feat(content): import linear algebra textbook and chapter exercises`
    - `fix(layout): prevent math formula overflow on mobile viewport`
    - `perf(render): pre-render heading formulas during build time`
    - `refactor(sidebar): decouple book traversal from state manager`
    - `chore(ci): configure automated EPUB release pipeline`

### 4.2 Dual-Repository Distribution Rules

1. **Local & Private Commits Keep Full Comments**:
   - ⚠️ Local working tree and private commits retain all explanatory code comments.
2. **Public Repository Strips Comments Automatically**:
   - To prevent outdated comments from confusing external agents, public distributions (`origin`) must have code annotations stripped.
   - Always push via the sandbox stripping pipeline, never run bare `git push origin`:
     ```bash
     npm run push:clean
     ```
3. **Zero Agent / Skill Leakage**:
   - `.agents/`, `.dsh/`, `.codex/`, `.cmd`, `CLAUDE.md`, and IDE assistant skills are strictly local development assets, ignored by Git, and automatically stripped from public distributions.
4. **Private Repository (Full Annotations Backup)**:
   ```bash
   npm run push:private
   ```
5. **Dual Remote Synchronization (Granular)**:
   ```bash
   npm run push:all
   ```
6. **One-Click Autonomous Sync & Push (Recommended)**:
   ```bash
   npm run push      # or npm run update, or ./update.cmd
   ```

## 5. Academic Publishing & Radical Subtraction Principles (Mandatory)

### 5.1 The North Star: "The Content is the Interface"
AstroLib produces **university-level mathematical and scientific textbooks, academic lecture notes, and formal exercise materials**.
- **Audience**: University students, researchers, and serious learners.
- **Philosophy**: Minimal. Academic. Quiet. Precise. Timeless.
- **Role**: Present pristine mathematical and scientific knowledge. Do NOT evaluate, manage, or infantilize the reader.

### 5.2 Explicit Anti-Patterns & Prohibited Elements
Strictly forbidden across all outputs (MDX authoring, UI components, worksheet generation, EPUB / PDF export):
- **No Learning Management Elements**: No scores, target scores, accuracy rates, time trackers, mastery check-boxes, self-evaluation matrices, motivational slogans, or study tips.
- **No SaaS / App UI Tropes**: No capsule badges, pill tags, gray answer boxes, nested card borders, dashboard widgets, or progress bars.
- **No Decorative Noise**: No unneeded icons, decorative borders, or arbitrary accent colors.

### 5.3 Typographic Rigor & Negative Space
- Sophistication MUST emerge solely from **typography, mathematical typesetting, alignment, hierarchy, proportion, and deliberate negative space**.
- **Negative Space is an Active Element**: A blank area is allowed to remain blank. Never fill whitespace with decorative fluff.
- **Subtractive Heuristic**: *“If removed, does the reader lose necessary academic/mathematical information? If not, remove it.”* When choosing between decoration and whitespace, choose whitespace.

### 5.4 Multi-Agent Pipeline Governance
When undertaking content restructuring, worksheet generation, or publishing redesigns:
1. **Rule Makers vs. Executors**: Agents defining design briefs/systems MUST NOT write implementation code in the same step.
2. **Strict Executor Constraint**: Implementation agents MUST strictly adhere to the established `DESIGN_SYSTEM.md` without inventing new visual abstractions.
3. **Mandatory Minimalism Audit**: Include a dedicated subtractive review step to identify and eliminate superfluous visual weight.
4. **Resolution Precedence**: `Academic Rigor > Minimalism > Readability > Decoration`.


