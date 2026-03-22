# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

- A2UI is protocol-first. Agents generate streaming JSON/JSONL messages, transports carry them, and client renderers map catalog-backed component definitions to native UI.
- The source of truth for protocol and schema work is `specification/v0_*/`. `docs/specification/*` is a docs-site copy generated during the docs build; the docs workflow copies `specification/*` into `docs/specification/` and flattens some JSON files for docs hosting. Edit `specification/*` first.
- `renderers/web_core` is the shared web runtime: protocol handling, state models, data binding, catalog execution, and schema validation. Lit, Angular, and React build on top of it instead of reimplementing the protocol.
- `renderers/web_core` build pulls schema JSON from `specification/v0_8/json` and `specification/v0_9/json` into the package during `npm run build`. If you change protocol JSON/schema files, rebuild `renderers/web_core` before testing dependent web renderers.
- Version support is split across packages:
  - `renderers/react` is currently centered on `v0_8`.
  - `renderers/web_core`, `renderers/lit`, and `renderers/angular` contain `v0_8` plus `v0_9` support.
  - `specification/v0_10` is draft/in-progress protocol work.
- `agent_sdks/python` is the server-side SDK for schema management, validation, catalog handling, A2A helpers, and ADK integration. The ADK samples in `samples/agent/adk` use a uv workspace and reference this SDK as an editable local dependency.
- `samples/` are the integration layer, not just throwaway demos:
  - `samples/client/lit` and `samples/client/angular` wire renderers to runnable shells and agent demos.
  - `samples/client/react/shell` is the lightweight React shell.
  - `samples/personalized_learning` is the most complete end-to-end sample: browser -> Node API server -> Vertex/ADK agent -> A2UI response.
- `tools/build_catalog` assembles freestanding catalog JSON. `tools/editor` and `tools/inspector` are local Vite tools built on Lit + `web_core`. `tools/composer` is a separate Next.js/CopilotKit widget-builder app.
- Searches can be noisy because this repo contains checked-in dependency folders in some areas (for example `samples/client/lit/node_modules`, `renderers/react/node_modules`, and `samples/agent/adk/.venv`). Exclude those when grepping or globbing.

## Read these first for big-picture context

- `README.md`
- `docs/concepts/overview.md`
- `docs/concepts/data-flow.md`
- `docs/concepts/catalogs.md`
- `renderers/web_core/README.md`
- `agent_sdks/python/README.md`
- `samples/personalized_learning/README.md`
- `specification/v0_10/docs/a2ui_protocol.md` when working on protocol details

## Working conventions that matter here

- There is no single repo-root JS workspace or task runner. Run `npm` commands from the package you are changing.
- Many JS packages use local `file:` dependencies. If you change `renderers/web_core` or schema JSON under `specification/`, rebuild `web_core` before testing Lit/Angular/React packages that consume it.
- The web packages often run tests against compiled `dist/` output, so `npm run build` is required before direct single-test invocations.
- Catalogs are a core contract in this repo. For product-like changes, prefer editing schema/catalog definitions rather than adding renderer-only behavior. Use `tools/build_catalog/assemble_catalog.py` to bundle freestanding catalogs.
- If you are unsure what the authoritative build/test flow is for an area, check the matching workflow in `.github/workflows/` first.

## Common commands

### Documentation and specification

```bash
pip install -r requirements-docs.txt
pytest docs/scripts/test_convert_docs.py
mkdocs build
```

```bash
cd specification/v0_9/test && pnpm install
python3 specification/v0_9/test/run_tests.py
```

### Web core

```bash
cd renderers/web_core && npm install
cd renderers/web_core && npm run build
cd renderers/web_core && npm test
cd renderers/web_core && npm run test:coverage
```

Example single test (runs against built output):

```bash
cd renderers/web_core && npm run build && node --test "dist/src/v0_9/state/surface-model.test.js"
```

### Lit renderer

```bash
cd renderers/lit && npm install
cd renderers/lit && npm run build
cd renderers/lit && npm test
```

Example single test:

```bash
cd renderers/lit && npm run build && node --test --enable-source-maps --test-reporter spec "dist/src/0.8/model.test.js"
```

### Markdown renderer

```bash
cd renderers/markdown/markdown-it && npm install
cd renderers/markdown/markdown-it && npm run build
cd renderers/markdown/markdown-it && npm test
```

### React renderer

`renderers/react` depends on a built `renderers/web_core`:

```bash
cd renderers/web_core && npm install && npm run build
cd renderers/react && npm install
cd renderers/react && npm run build
cd renderers/react && npm test
cd renderers/react && npm run lint
cd renderers/react && npm run typecheck
```

Example single test:

```bash
cd renderers/react && npx vitest run "tests/v0_8/unit/components/Button.test.tsx"
```

### Angular renderer and Angular samples

Renderer package:

```bash
cd renderers/angular && npm install
cd renderers/angular && npm run build
cd renderers/angular && npm run test:ci
```

Sample workspace (this is what CI uses for integrated Angular builds):

```bash
cd samples/client/angular && npm install
cd samples/client/angular && npm run build:renderer
cd samples/client/angular && npm run build contact
cd samples/client/angular && npm run build restaurant
cd samples/client/angular && npm run build rizzcharts
cd samples/client/angular && npm run build orchestrator
cd samples/client/angular && npm run demo:restaurant
```

### Lit sample shells

```bash
cd samples/client/lit && npm install
cd samples/client/lit && npm run build:renderer
cd samples/client/lit && npm run demo:restaurant
cd samples/client/lit && npm run demo:contact
cd samples/client/lit && npm run demo:orchestrator
```

Shell package directly:

```bash
cd samples/client/lit/shell && npm install
cd samples/client/lit/shell && npm run dev
cd samples/client/lit/shell && npm test
```

### React shell sample

```bash
cd samples/client/react/shell && npm install
cd samples/client/react/shell && npm run dev
cd samples/client/react/shell && npm run build
```

### Python SDK

```bash
cd agent_sdks/python && uv run pyink --check .
cd agent_sdks/python && uv run pyink .
cd agent_sdks/python && uv run pytest
cd agent_sdks/python && uv build .
```

Example single test:

```bash
cd agent_sdks/python && uv run --with pytest pytest "tests/core/schema/test_validator.py"
```

### Python ADK samples

```bash
cd samples/agent/adk/restaurant_finder && uv run .
cd samples/agent/adk/contact_lookup && uv run .
cd samples/agent/adk/orchestrator && uv run .
```

### Catalog tooling

```bash
uv run tools/build_catalog/assemble_catalog.py [INPUTS ...] --output-name <OUTPUT_NAME>
```

### Local tools

```bash
cd tools/editor && npm install && npm run dev
cd tools/inspector && npm install && npm run dev
cd tools/composer && npm install && npm run dev
```

## CI workflows worth checking

- `.github/workflows/docs.yml`
- `.github/workflows/web_build_and_test.yml`
- `.github/workflows/react_renderer.yml`
- `.github/workflows/ng_build_and_test.yml`
- `.github/workflows/python_agent_sdk_build_and_test.yml`
- `.github/workflows/validate_specifications.yml`
