---
title: Evolution data
description: Generating a verified dataset for chain evolution in the Maestro app — the form, budget, pause and instructions, dataset versions, holdout, and limits.
sidebar:
  order: 3
---

Evolution needs a dataset: task cases with expected answers that score each
candidate chain. Maestro's **evolution data generator** (the benchmark
factory) creates such cases for a chain, verifies them programmatically and
stores them as dataset versions.

## Start a generation

Three ways, all in the desktop app:

- **Library → Datasets** (*Наборы данных*) → **Generate data for evolution**
  (*Сгенерировать данные для эволюции*). Needs an open session.
- A chain card in the Library → **Data for evolution** (*Данные для
  эволюции*). This drafts a request for the agent; you send it.
- Ask the agent in chat, for example *"generate evolution data for the
  receipt-sum chain"*.

The form asks for:

| Field | Default | Meaning |
| --- | --- | --- |
| Task | from the chain | What the chain should do. |
| Task type | Text answer | **Text answer**: the agent gets an input and answers; the answer is compared with the reference. **Tasks with tools**: the agent acts through tools in a clean environment; the final state and the answer are checked. |
| Cases | 24 | How many cases to aim for. |
| Difficulty | balanced | simpler, balanced or harder. |
| Holdout, % | 25 | Share of cases kept hidden (0–50). |
| Budget, tokens | 200,000 | Hard cap for this generation. |
| Requirements | — | Optional, for example "more cases with ambiguous wording". |

**Start generation** (*Запустить генерацию*) starts the run. Pressing the
button is your consent; no extra dialog appears. When the agent starts a
generation from chat, the app shows one confirmation dialog instead. The run
uses the **chat model** of the session and stops before it would exceed the
budget.

## While it runs

The run card shows the stages and the cases as they are verified. You can:

- **Pause** and **Resume**;
- **Retry failed** units;
- **Stop and save**: the run ends for good; verified cases are kept;
- send an **instruction**, for example *"add more cases with ambiguous names"*.
  Changes made by instructions are listed separately.

These controls are free; the budget was approved at start.

Cases are grouped as accepted, rejected, outdated and unverified. Holdout
cases are shown without their reference answers.

## Dataset versions

A finished run stores a dataset version with an id like `bf_<16 hex>.v<N>`.
Each version lists its search cases, holdout cases, rejected cases, spec
version and evaluator.

**Use for evolution** (*Использовать для эволюции*) puts a request into the
input field to evolve the chain on this version. Only the **search part** is
handed to evolution. The holdout part stays in the local store and is never
returned to the conversation.

A version can be used for evolution only if:

- it has at least two verified search cases;
- its evaluator is supported (text comparison by equality or by a pattern);
- it is not a *tasks with tools* dataset.

You can also refer to a dataset in words (*"the latest dataset for the receipt
chain"*); the agent resolves it to `dataset:<id>`.

## Storage

Runs and datasets are stored in a local SQLite file:

```bash
# default
~/.local/state/care/benchmark-factory/factory.sqlite3
# override
export CARE_BENCHMARK_FACTORY_DB=/path/to/factory.sqlite3
```

The model credential of a run is kept only in memory. A run interrupted by an
app restart needs an explicit resume from the same session.

## Limits

- **Tasks with tools** datasets can be generated, reviewed and exported, but not
  used for evolution yet: the evolution evaluator compares answer text only.
- The holdout part is not yet used to compare evolution results; that phase
  is not available.
- These datasets are separate from the TUI/CLI datasets (`maestro dataset …`,
  `/dataset …`), which are stored as memory cards.

## See also

- [Evolution](/care/workflows/evolution/)
- [Library](/care/app/library/) · [Confirmations](/care/app/confirmations/)
