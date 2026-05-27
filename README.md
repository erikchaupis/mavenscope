# MavenScope

Production-ready Maven dependency visualization for **VS Code / Cursor**.

MavenScope combines a VS Code extension, a standalone Java analysis engine, and a modern React webview UI to explore declared vs resolved dependencies, conflicts, and mediation results.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1 — VS Code Extension (TypeScript)                    │
│ Commands · sidebar · webview · engine process orchestration │
└───────────────────────────┬─────────────────────────────────┘
                            │ spawn: java -jar dependency-engine.jar analyze <path>
                            │ stdout JSON (AnalysisResult)
┌───────────────────────────▼─────────────────────────────────┐
│ Layer 2 — Java Engine (Java 21 + Maven Resolver)            │
│ pom.xml · effective model · dependency graph · conflicts      │
└───────────────────────────┬─────────────────────────────────┘
                            │ shared JSON contract
┌───────────────────────────▼─────────────────────────────────┐
│ Layer 3 — React UI (Vite + Tailwind + shadcn-style)           │
│ Split panes · dependency trees · search · conflict badges     │
└─────────────────────────────────────────────────────────────┘
```

### Folder layout

| Path | Purpose |
|------|---------|
| `extension/` | VS Code extension host |
| `engine/` | Standalone Maven analysis engine |
| `ui/` | React webview application |
| `shared/` | Typed JSON contracts (`AnalysisResult`) |
| `fixtures/` | Sample Maven projects for testing |

## Features (MVP)

- Parse `pom.xml` and resolve the effective dependency tree via **Apache Maven Resolver / DependencyGraphBuilder**
- Detect version conflicts and annotate mediation (nearest-wins, dependency management)
- Split-pane UI: **Dependency Hierarchy** (full resolved tree) and **Resolved Dependencies** (transitive deps for the selected node)
- Eclipse-style sync between panels — click a dependency in either pane to expand, scroll, and highlight all occurrences in the tree
- Scope badges, JAR artwork for jar artifacts, search/filter, expand/collapse, A–Z / declaration sort
- **Theme follows your editor** — light or dark by default based on the active VS Code / Cursor color theme; toolbar toggle overrides and persists per panel
- Architecture hooks for future CVE scanning, AI explanations, upgrade recommendations, and graph views

## Prerequisites

- **Node.js 20+**
- **Java 21+** (for engine runtime)
- **Maven 3.9+** (to build the engine)
- VS Code / Cursor 1.85+

## Quick start

```bash
# Install JS dependencies
npm install

# Build everything (shared + engine + UI + extension)
bash scripts/build-all.sh
```

### Run the engine standalone

```bash
java -jar engine/target/dependency-engine/dependency-engine.jar analyze fixtures/sample-project
```

### Debug the extension (F5)

```bash
# Terminal 1 — UI hot reload
npm run dev:ui

# Terminal 2 — extension TypeScript watch
npm run watch:extension

# Prepare engine bundle for the extension host
bash scripts/dev.sh
```

1. Open this repo in VS Code/Cursor
2. Press **F5** (Run MavenScope Extension)
3. In Extension Development Host:
   - Open `fixtures/sample-project`
   - Run command palette → **MavenScope: Open Dependency Viewer**
4. Optional: set `"mavenscope.useDevUi": true` for Vite HMR in the webview (theme still follows your editor color theme)


## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `mavenscope.javaPath` | `java` | Java executable |
| `mavenscope.enginePath` | _(bundled)_ | Override engine JAR path |
| `mavenscope.useDevUi` | `false` | Load UI from Vite dev server |
| `mavenscope.devUiPort` | `5173` | Vite port for dev UI |

## JSON contract

See `shared/src/types/analysis.ts` and `shared/samples/analysis-result.sample.json`.

The schema includes path-stable node IDs, `resolutionIndex` (winning node + all occurrences per GA key), and mediation labels used for cross-panel sync.

Communication flow:

1. Extension spawns `java -jar dependency-engine.jar analyze <projectPath>`
2. Engine writes `AnalysisResult` JSON to stdout
3. Extension posts `{ type: 'analysis', payload }` to the webview

## UI layout

```
┌──────────────── Toolbar / Search / Theme / Refresh ──────────┐
│ Dependency Hierarchy   │ Resolved Dependencies              │
│ (full resolved tree)     │ (transitive deps for selection)  │
└──────────────────────────┴──────────────────────────────────┘
```

Built with TailwindCSS, Lucide icons, custom JAR artwork, Radix primitives, and `react-resizable-panels`. React Flow (`@xyflow/react`) is included for future graph visualization.

### Theming

- On first open, MavenScope matches the active **VS Code / Cursor color theme** (light or dark).
- Changing the editor theme updates the webview automatically unless you have used the toolbar theme toggle.
- A manual theme choice is stored in webview state and kept across reloads.

## Commands

- **MavenScope: Open Dependency Viewer**
- **MavenScope: Analyze Workspace Project**
- **MavenScope: Refresh Analysis**

Activity bar container: **MavenScope** (Maven project tree).

## Development scripts

| Script | Description |
|--------|-------------|
| `npm run build:all` | Full monorepo build |
| `npm run build:engine` | Package Java engine |
| `npm run dev:ui` | Vite dev server |
| `npm run watch:extension` | TypeScript watch |
| `bash scripts/build-all.sh` | Production bundle + copy assets |
| `bash scripts/dev.sh` | Prepare engine for F5 debugging |

## Roadmap hooks

The shared schema and UI reserve space for:

- CVE scanning results
- AI-generated conflict explanations
- Upgrade recommendations
- Details panel (coordinates, exclusions, mediation deep-dive)
- React Flow dependency graph view

## License

Apache-2.0

## Publish to VS Code / Cursor Marketplace

The publishable extension manifest lives in `extension/package.json`. Packaging ignores dev files via `extension/.vscodeignore`.

```bash
# Full production build (engine + UI + extension)
bash scripts/build-all.sh

# Create VSIX from extension workspace
cd extension
npm run package
# → mavenscope-0.0.1.vsix

# Publish (requires Marketplace publisher "erikchaupis" + PAT)
npm run publish
```

Install the VSIX locally to smoke-test before publishing:

```bash
code --install-extension extension/mavenscope-0.0.1.vsix
```
