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

1. **Central Configuration**:
   - `src/config/collections.config.mjs` is the **single source of truth** for books, collections, and card module themes.
   - `src/config/features.config.mjs` is the **Feature Registry** controlling build-time plugins and UI toggles (`katex`, `theme`, `fonts`, `crossRef`, `epub`, `editor`, `aiAsk`).
   - ⚠️ `src/config/books.config.mjs` is an obsolete/dead file. Do not edit it.
2. **Routing & Clean Slugs**:
   - Every generated link pointing to a book chapter MUST use `cleanSlug()` from `src/utils/sidebar.mjs`. Never hardcode raw filenames into URL strings.
3. **MDX Syntax Validation**:
   - To validate MDX changes quickly and accurately, run:
     ```bash
     node scripts/scan-mdx.mjs src/content/docs/collections/<collection>/<book>
     ```
4. **Performance & Sidebar Constraints**:
   - Left sidebar renders only the current book to keep HTML size minimal (`SidebarOverride.astro`).
   - Right sidebar outline builds cross-reference index scoped to the current book (`PageSidebarOverride.astro`).
   - KaTeX uses `output: 'html'` to minimize payload size.

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
