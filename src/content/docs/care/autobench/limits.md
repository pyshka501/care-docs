---
title: Limits and status
description: What in autobench has been run live, what is covered only by tests, what has not been checked, and the known gaps to plan around.
sidebar:
  order: 8
---

Autobench is on a development branch and not in a released build. Each item
below is marked:

- **live**: run against a real model;
- **tests**: covered by automated tests with a scripted model or fake binary;
- **unverified**: neither, or only read in the code.

## Status

| Area | Status | Source |
| --- | --- | --- |
| Free-form answers checked by the judge | **live**: 6 of 7 accepted (Codex `gpt-6-luna`) | branch commit message, 2026-11-02 |
| Numeric answers (receipt sums) with top-up | **live**: 14 accepted at a target of 8 | same |
| Generator program | **live**: 10 of 10 accepted, audit 7 of 8 | same |
| Image inputs (receipt images) | **live**: 5 of 6 accepted | same |
| Pause, resume, instructions, stop, restart recovery, versions, **Use for evolution** | **live** on an earlier build of the same engine (chat model, 2026-09-28); one evolution ran on a generated version | development journal |
| Holdout not passed to evolution, holdout references not returned | **tests** and the version manifest | development journal |
| Stop by budget or by calls, top-up planning, stopping without progress | **tests** | unit tests |
| Editing, composing proportions, saving versions | **tests** | unit tests |
| Generator sandbox: no network, no writes to the home folder | **tests** | unit tests |
| File checks by signature and containment | **tests** | unit tests |
| Codex call shape (`--output-schema`, last message) | **tests** with a fake binary | unit tests |
| Approval rules for each tool | **tests** | policy tests |
| Tasks with tools | **live** QA found unconfirmed tasks when one solve call failed; the fix (parallel chunks with one retry) is covered by **tests** | branch commit message |
| Import from CSV/TSV/XLSX | **tests** | unit tests |
| The packaged app built from this branch | **unverified** | — |
| Generator programs inside the packaged app (system `/usr/bin/python3`) | **unverified** | — |
| PDF, DOCX, XLSX, CSV and audio inputs | **unverified** (only images ran live) | — |
| Extending a run with Codex | **unverified** | — |
| Evolution on a judge-rubric dataset, end to end | **unverified** | — |

## Known gaps

**Verification**

- The blind solver and the judge are the same provider and model as the
  generator. Errors they share pass unnoticed.
- The spec is not shown for approval: generation starts right after it is
  written. Steer with instructions, or edit cases afterwards.
- Instructions are not applied in generator-program runs (by code); change
  the program on the **Generator** tab instead.
- Versions saved by older builds may hold cases accepted at level
  `executable` (no confirmed reference) and are still offered for evolution.
  Check the level counts on the version.

**Evolution**

- Only the search part is used. No tool scores the winner against the seed on
  the holdout part, and nothing is promoted automatically.
- The evolution platform scores 2 training rows and 1 validation row per
  evaluation (by code). See
  [How many rows evolution actually scores](/care/autobench/evolution/#how-many-rows-evolution-actually-scores).
- Datasets with files or with tool tasks cannot be used for evolution.
- Number checks with tolerance 0 become text equality on the platform.
  Regex checks with a marker can score every candidate 0 (by code). See
  [How a check becomes the evolution evaluator](/care/autobench/checks/#how-a-check-becomes-the-evolution-evaluator).
- Judge-rubric datasets need an evolution platform build with the LLM judge.

**Spending**

- The budget is checked between batches, so batches already running can take
  the total past it.
- Codex token counts are estimates from the CLI.
- In live runs about half of the image batches came back without a usable
  file. Such batches are retried, and the retries cost tokens.
- **Generate missing N (paid)** on the screen does not raise the budget; a run
  that already spent it ends again at once.

**Other**

- Generator programs are sandboxed with macOS `sandbox-exec`. Where it is
  missing, they run without it (isolated Python, minimal environment).
- Imported spreadsheet datasets are remembered only by the running session
  process (last 16) and are not shown in **Datasets**.
- File inputs are created only by Codex.
