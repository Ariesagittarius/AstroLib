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
5. **Dual Remote Synchronization (Recommended)**:
   ```bash
   npm run push:all
   ```


