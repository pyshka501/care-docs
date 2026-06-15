---
title: Screens Reference
description: Every MAESTRO CARE screen and modal — how to reach it and what it does.
sidebar:
  order: 2
---

MAESTRO CARE ships a screen per lifecycle stage. The three you'll use most are the chat
surface, the **Library**, and the **Evolution** screen.

## Primary screens

| Screen | How to reach | Purpose |
| --- | --- | --- |
| Chat | boot | Natural-language input, mode toggle, slash palette, artifact pill, Production toolbar. |
| Artifacts | `/artifacts` | Current-chat artifacts (chain / stage / tool / dataset / synth output); save, copy, inspect. |
| Library | `/library` | Saved chains — sort, filter, tag pool, recency strip, mean cost, bulk import/export. |
| Inspection | Library `Enter` | Saved-chain detail + run history + Integration pane. |
| Edit Agent | Library `e` | Inline edit + save-as-new-version + promote-to-stable. |
| Execution | Library `r` | Live CARL run + token streaming. |
| Evolution | `/evolution` | Run + watch a GA over a chain — tabbed view (Fitness chart · Pareto front · Programs · Versions) with Stop+Archive / Accept-winner controls (see [below](#the-evolution-screen)). |
| Evolution Dashboard | `/evolution` | List of active + recent runs; Enter opens a run, `c` compares two. |
| Replay | Runs `Enter` | Step through a saved `ReasoningResult`. |
| Runs | `/runs` | Local run history; Enter opens the Replay sidecar. |
| Catalog | `Ctrl+K` | Browse installed capabilities (skills / MCP / tools / cards). |
| Cost Dashboard | `/cost` | Token + USD spend rollup by provider / chain / session. |
| Marketplace | `/marketplace` | Search shared `agent_skill` listings on Memory. |
| Logs | `/logs` | Tail the rolling app log; `m` toggles a module filter. |
| Sandbox Trust | `/sandbox` | Audit + revoke trusted AgentSkills (SHA-pinned trust store). |
| Profile | `/profile` | List credential profiles under `~/.config/care/profiles/`. |
| Settings | `/settings` | Edit MAGE / Memory / Platform creds + theme + advanced knobs. |
| Help | `/help` · `?` | Tutorial + every binding (filtered by active screen). |
| Welcome | boot | Boot splash; routes to Chat (returning) or Settings (first-run). |
| Task List | `Ctrl+B` | In-flight workers panel. |

## Modals

| Modal | Triggered from | Purpose |
| --- | --- | --- |
| Command Palette | `Ctrl+P` | Fuzzy palette over commands + saved entities. |
| Confirm | destructive actions | OK / Cancel for bulk delete, accept-winner, … |
| Conflict | save name collision | Resolve a name collision on save. |
| Diff | Library `D` | Side-by-side compare two chains / individual vs parent. |
| Lineage | Library `l` | Walk a chain's ancestry DAG. |
| Import / Export | Library `i` / `x` | Import a chain bundle / export entities to a tarball. |
| Export Chain | Evolution `x` | Export a single chain to disk (JSON / Python). |
| Evolution Launch | Library `v` / `E` | Budget / rubric / objectives picker before evolving. |
| Evolution Compare | Dashboard `c` | Side-by-side fitness curves for two runs. |
| Human Input | CARL human-input step | Block execution for a human-supplied answer. |
| Resume | `/resume` | Rehydrate a Production-mode transcript. |
| Run Context | Library / Execution `r` | Re-run form: task + context-file picker + tags. |
| Save Agent | post-generation | Tag + name a freshly-generated chain. |
| Save Report | after save-all | Post-mortem table of save-all outcomes. |
| Tag Editor | Library `T` | Edit tags (bulk) + optional title. |
| Use It Now | post-save | Copy-paste recipe (python / curl / cli) for the saved chain. |

## The Evolution screen

`/evolution` — or **Library → `v`/`E`** (the Evolution Launch picker) — opens a live
view of a genetic-algorithm run over a chain. It's organised as tabs:

| Tab | Shows |
| --- | --- |
| **Fitness** | A two-axis line chart — **best fitness** and the **current-generation mean** vs. generation — so you can watch progress and spot plateaus. |
| **Pareto Front** | A table of non-dominated individuals; for runs with ≥ 2 objectives, a 2D scatter sits beneath it. |
| **Programs** | Valid vs. invalid program counts. |
| **Versions** | Every generation where best fitness strictly improved — pick one to preview its chain or diff it against the parent. |

Controls along the bottom: **Back**, **Stop + Archive** (`z` — halts the run
server-side and archives it), and **Accept winner** (promotes the best individual into
the **stable** channel). `D` diffs the selected version against its parent; `Esc`
cancels. See [Launching evolution](/care/workflows/production/#evolution--improve-automatically)
for the ways to start a run.

:::note
Statuses in the source mark a few surfaces as M1/planned (e.g. the uvx Onboarding
wizard). Press `?` in any screen for its live, canonical bindings.
:::
