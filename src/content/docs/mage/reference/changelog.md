---
title: Changelog
description: MAGE versions — the released 0.1.x line on PyPI, the prepared 0.2.0 with v3 as the default strategy, the unreleased 0.1.4 and 0.2.0 development line that Maestro pins, and the experimental v3 branches.
sidebar:
  order: 1
---

The last tag is `v0.1.3`; the newest version on PyPI is 0.1.3. Version 0.2.0
is prepared and waits for publication; until it is on PyPI, everything after
0.1.3 is unreleased. Dates are commit dates.

## 0.2.0 (prepared, not yet on PyPI)

0.2.0 collects the development line below, the v3 generator as the new
default strategy, the v3 research code (still experimental) and the
`$steps.N.result_data` export fix, and moves MAGE to the released CARL.
Branch `prep/mage-0.2.0` (5a38672), draft PR `Glazkoff/carl-mage#21`.

- **The default strategy is now `v3` (was `legacy`).** `MAGEConfig()`,
  `MAGEConfig.from_env()` and `mage generate` without `--strategy` run v3.
  For a host that relied on the old default: `mode` and the deep-stage
  switches apply to `legacy` only; without `capabilities` v3 sees no tools,
  while legacy discovered tools and skills from memory and the local
  catalogue; v3 rejects tasks with private runtime input; a generation costs
  more calls (plan, author, repairs, dry run). Keep the old behaviour with
  `generation_strategy="legacy"`, `MAGE_GENERATION_STRATEGY=legacy` or
  `mage generate --strategy legacy`. A `benchmark_profile` selects `legacy`
  unless a strategy is given; the bundled `configs/*.toml` presets and
  examples, `mage evolve` and the research arms in `evaluation/` pin it.
- **`mage generate --strategy v3|legacy|semantic`.** Without it the config
  default applies.
- **Requires `mmar-carl>=0.5.2,<0.6`**; the `memory` extra needs
  `gigaevo-client>=0.3.1,<0.4`. Python 3.12 or 3.13.
- **`human_input` has no fallback answer.** CARL 0.5 removed
  `fallback_value`. MAGE no longer emits it, and an unanswered request fails
  the chain. Hosts need an `on_human_input_requested` callback; readiness
  treats a `human_input` step as ready only when the host declares
  `human_input_callback_available=True`.
- **No scoped LLM inputs in released CARL.** CARL 0.5.2 ignores
  `llm_config.input_mapping` / `include_outer_context`, so admission rejects
  LLM steps under a runtime input schema with private fields; semantic-strategy
  chains that need scoped inputs come back `Unsupported`.
- **Saved chains are migrated before editing** (`ReasoningChain.migrate`) when
  they carry an older `format_version` or a legacy `fallback_value`; defaults
  the author never set (such as `fail_fast`) are not added, and
  `MAGEEditResult.migrated` marks the migrated form.
- Five step types that older CARL could not round-trip (`agent_skill`,
  `debate`, `evaluation`, `mcp_resource`, `tool_discovery`) now keep their
  config.
- **v3 strategy.** `generation_strategy="v3"` runs the v3.4
  generator from `mmar_mage/authoring/`: data-flow plan, author, deterministic
  compiler, admission with repair, dry run in real CARL with simulated tools.
  It builds its contract with `build_v3_contract` under the request's egress
  policy, makes every call through the generator's `LLMClient`, treats
  `capabilities` as a closed world and passes `validate_runtime_chain`.
  `v3_*` fields carry the v3.4 defaults. `allowed_step_types` is enforced
  at admission. The MAGEBench arm `plan_author_v3` now runs the same package code. Known limits
  (private runtime input rejects every `llm` step, family guides keyed on
  schema names and others) are listed in
  [v3 generator](/mage/concepts/v3-generator/#known-limits).
- Generation memory, the IdeaL loop, the API and code-tool forges and
  author-written `code` steps stay in `evaluation/` and modules used only
  from there: experimental, not called by `MAGEGenerator`, not part of the
  package API.

Checked offline: ruff, mypy and the offline test suite (2547 passed,
16 skipped) on Python 3.12 and 3.13 against CARL 0.5.2, and a scripted smoke
test of the wheel. No paid API run. Live smoke on 2026-11-13 with a local Codex CLI model (`gpt-6-luna`; smoke, not a measurement): through `MAGEGenerator` and executed in CARL 0.5.2, 3 of 3 host tasks gave correct answers; the benchmark arm on 7 lite tasks generated and admitted 7 of 7, and 3 of 7 passed scoring.

## Experimental: v3 branches (not released)

Research code on development branches of `Glazkoff/carl-mage`. Since 0.2.0
the v3.4 generator itself ships in the package (see above); the extensions
below stay in `evaluation/` and modules used only from there, and are not
part of the package API. See [v3 generator](/mage/concepts/v3-generator/).

**`feat/v3-ideal-loop`** (2 November 2026, acf7091). Merges `feat/v3-memory`, `feat/v3-forge`
and `feat/v3-codestep`, then adds:

- Reuse ladder and generation as an IdeaL run (`mmar_mage/ideal_loop.py`,
  ceaf38b). See [IdeaL loop](/mage/concepts/ideal-loop/).
- Gap-driven code-tool forge with a local or IdeaL tool store
  (`mmar_mage/code_forge.py`, acf7091). See [Tool forges](/mage/concepts/tool-forge/).
- `magebench_families_v1`: 28 task families × 4 variants for the memory study;
  held-out suite of 42 untouched tasks; run configs, seed lake and the
  decision-rule analyzer.
- A test driver that runs the real runner with a local model CLI, for smoke
  tests without a paid API.

**`feat/v3-memory`, `feat/v3-forge`, `feat/v3-codestep`** (9 October 2026):

- Generation memory: task profile and key, skeletons of proven chains, local
  store and IdeaL client, ideas from IdeaL as optional author hints cited in
  the trace.
- API tool forge (`mmar_mage/forge/`): APIs.guru and MCP registry sources,
  selection, OpenAPI `GET` adapter, cassettes, tests, blind judge; remote MCP
  servers admitted as capabilities.
- `code` steps in v3: compute nodes, a code card, static checks, a sandbox
  profile.

**`feat/v3-phase0`** (9 to 25 October 2026, draft PR `Glazkoff/carl-mage#20`):

- Benchmark arms `agent_author`, `single_call_carl`, `plan_author_v2`,
  `plan_author_v3` in the MAGEBench runner, frozen phase-0 suites.
- `plan_author_v3`: data-flow plan, author, deterministic compiler, admission
  with fix advice, dry run in real CARL. v3.4 is the measured version.
- Library fixes that Maestro now pins (see below).

## 0.2.0: development line (not released)

Package version `0.2.0`, not tagged. Maestro pins revisions of this line by
git hash; their version string is `0.2.0+ideal.20261005.1`.

**`maestro/step-field-refs`** (b7a6e27, 2 November 2026): pinned by
Maestro's development branch.

- Export: a field of a step result is `$steps.N.result_data.<field>`.
  CARL resolves `$history[N]` to the step's whole rendered text and drops the
  field, so a URL built from `$history[3].coordinates_query` silently got
  the whole text. The final pass now rewrites it.
- Lint rejects a field of a relative entry (`$history[-1].field`) and a
  format template that repeats the bare `{input}`.
- This fix is not on `feat/v3-ideal-loop`.

**From `feat/v3-phase0`** (c88a7ad and 4aba1ee, October 2026, library part
only):

- Saved input contracts survive edit and repair admission.
- Typed literal bindings preserved.
- Lint accepts `$steps.N.tool_name` (which tool actually answered) on tool
  steps only.
- `allow_estimated_usage`: do not fail when a provider reports no token usage.

**Up to 6140b3b** (5 October 2026, pinned by Maestro 0.5.0 sources):

- Semantic strategy: `generation_strategy="semantic"`, `MAGEGenerator.compile()`
  with `ReadyChain`, `NeedsUserInput`, `Unsupported`; readiness certified
  against host-declared runtime features. Opt-in; the default on this line was `legacy`.
- `allow_selected_retrieved_context`: the host chooses which retrieved items
  the generation model sees. Maestro uses it for IdeaL hints.
- Stricter lint: ambiguous `structured_output` input bindings, positional
  `$history` joins over several dependencies, `$steps.N.result_data` on a
  text-only producer, missing essential config on tool-like steps.
- Chain names are a short task title, the domain goes to tags.
- Optional `web` extra (`ddgs`) for keyless DuckDuckGo search.
- Evaluation: semantic candidate benchmark protocols, stage telemetry.

## 0.1.4 (frozen 12 August 2026, never tagged or published)

Commit 5c48a67. The base of the development line.

- Runtime admission: every chain passes lint and a typed CARL load
  (`validate_runtime_chain`) before it is returned or saved.
- Transactional edit: changes apply to a copy and pass the same admission.
- Typed request: `GenerationRequest` with data, capability and persistence
  policies, input schema, exact output contract, typed tool bindings,
  same-step tool retry.
- Capability lifecycle with trust states and runtime binding; immutable
  `ResolvedCapabilities`.
- Web research providers Tavily, Serper, Exa, SerpAPI, Brave, DuckDuckGo, with
  citation checks and SSRF guards.
- Hard budgets on calls, tokens, time and cost; `MAGEBudgetError`.
- `compose_chains`; MAGEBench and the version benchmark harness.

## 0.1.3 (tag `v0.1.3`, 17 June 2026): released

- Each step is a self-contained contract: `aim` and `stage_action` name the
  deliverable and its format.
- Deterministic guards: tool steps grounded in the advertised catalogue (an
  invented name is repaired once), `$history[N]` reindexed to runtime
  positions, non-executable transforms and spliced references linted.
- Planning prompts steer toward runnable, structured chains.

## 0.1.2 (tag `v0.1.2`, June 2026)

- Chain edit deep-merges nested fields, so a partial edit of `step_config`
  no longer drops sibling keys.
- `mmar-carl` became a required dependency; the `memory` extra moved to
  `gigaevo-client`.
- Evaluation runs chains in the real CARL runtime.

## 0.1.0 to 0.1.1, 0.0.1 (June 2026)

First PyPI packaging (0.0.1) and the early releases of the fast and deep
generator, the CLI and the memory integration. By 0.1.3 the package also had
natural-language edits (`mage edit`) and `mage evolve`.
