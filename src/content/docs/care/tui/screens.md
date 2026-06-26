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
| Chat | boot | Natural-language input, mode toggle, slash palette, artifact pill, header Library link, Production toolbar. |
| Chain DAG | Chat → **Read full** | Full box-and-arrow graph of a freshly-generated chain + clickable step list + CARL detail pane (see [The chain DAG](/care/tui/dag/)). |
| Artifacts | `/artifacts` | Current-chat artifacts (chain / stage / tool / dataset / synth output); save, copy, inspect, JSON/DAG toggle (see [below](#the-artifacts-screen)). |
| Library | `/library` · header link | Saved chains — sortable columns, filter, tag pool, recency strip, mean cost, bulk import/export (see [below](#the-library-screen)). |
| Inspection | Library `Enter` | Saved-chain detail + run history + Integration pane. |
| Edit Agent | Library `e` | Manual edit — name / description / tags / task / change summary, save-as-new-version or promote-to-stable (see [below](#the-edit-agent-screen)). |
| Execution | Library `r` | Live CARL run + token streaming. |
| Evolution | `/evolution` · Library `v`/`E` | Run + watch a GA over a chain (see [The Evolution screen](/care/tui/evolution/)). |
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
| Export Chain | Evolution `x` | Export a single chain to disk — pick **Markdown / JSON / Python** with a folder **Browse** picker. |
| Evolution Launch | Library `v` / `E` | Budget / rubric / objectives picker before evolving. |
| Evolution Compare | Dashboard `c` | Side-by-side fitness curves for two runs. |
| Human Input | CARL human-input step | Block execution for a human-supplied answer. |
| Resume | `/resume` | Rehydrate a Production-mode transcript. |
| Run Context | Library / Execution `r` | Re-run form: task + context-file picker + tags. |
| Save Agent | post-generation | Tag + name a freshly-generated chain. |
| Save Report | after save-all | Post-mortem table of save-all outcomes. |
| Tag Editor | Library `T` | Edit tags (bulk) + optional title. |
| Use It Now | post-save | Copy-paste recipe (python / curl / cli) for the saved chain. |

## The Library screen

`/library` — or the **Library** link in the Chat header — lists every saved chain. Click
a column header to sort: **Name**, **Last Run**, and **Runs** (run count) are sortable;
the sort persists between visits, and favourites stay pinned to the top. Each row carries
a **recency strip** (last run + a success-rate/N badge) and a **mean cost** column drawn
from local run history. Press `e` to edit a row inline, `r` to re-run it, `Enter` to
inspect it; `i`/`x` import or export bundles.

## The Edit Agent screen

Library → `e` opens the **manual editing** screen for a saved chain. You can change the
**display name**, **description**, **tags**, **task description**, and a **change
summary**; a Content tab also lets you hand-edit the CARL JSON. Validation runs on every
keystroke. The footer offers **Save** (`Ctrl+S` — writes a **new version**),
**Promote** (advances the chain into the **stable** channel), and **Back** (`Esc`). The
Save button shows how many fields changed, and a structural edit auto-fills a change
summary so the save never blocks silently.

## The Artifacts screen

`/artifacts` is a two-pane browser over everything the current chat session produced
(chains, stage payloads, tool output, datasets, synth answers). The header shows an
**artifacts pill** — `[ N · M unsaved ]` — that stays in sync with the chat surface's
pill: saving a chain (`s`) decrements the unsaved count, dropping one (`d`) shrinks the
total. `v` toggles the detail pane between raw **JSON** and the **DAG** step graph;
`Enter` inspects a chain, `c` copies its payload, `S` saves all unsaved, `D` diffs two
selected rows.

---

The genetic-algorithm view and the full chain DAG each have their own page:

- [The Evolution screen](/care/tui/evolution/) — live fitness chart, Pareto front, versions, and the Stop / Accept-winner controls.
- [The chain DAG](/care/tui/dag/) — the **Read full** box-and-arrow graph with clickable steps and a CARL detail pane.

:::note
Statuses in the source mark a few surfaces as M1/planned (e.g. the uvx Onboarding
wizard). Press `?` in any screen for its live, canonical bindings.
:::
