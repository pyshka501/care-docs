---
title: Evolution
description: Evolving a chain from the Maestro app — what you need, datasets from files, how candidates are scored (exact metrics or an LLM judge), several objectives and the Pareto front, the plan and its token estimate, the live evolution card, cancelling and taking the result.
sidebar:
  order: 4
---

Evolution improves a chain automatically. The evolution platform (GigaEvo
Platform) mutates the chain, scores each candidate on a dataset and keeps the
best. In the desktop app you start it from chat and watch it on a live card.

:::note[Development line]
Datasets from files, the LLM judge, objectives with the Pareto front and the
live evolution card are in builds from the current development line, not in
a tagged release. The judge and declared objectives also need an evolution
platform build that supports them.
:::

## What you need

- The **evolution platform** in **Settings → MAESTRO → Advanced → Evolution
  platform** (*Платформа эволюции*): its address (and key, if it needs one),
  plus the mutation and validation models the platform should use. If those
  two are empty, the platform uses the **fallback model** from the same
  section. The platform calls these models itself; they are not the chat
  model.
- A **seed chain**: a saved one from [My agents](/care/app/library/) or one
  from this session.
- A **dataset** of at least two rows of input and expected answer.

## Where the dataset comes from

| Source | How |
| --- | --- |
| A file of yours | A CSV, TSV or XLSX file in the project folder, or attached in chat. Ask *"evolve the receipt chain on examples.xlsx"*. See below. |
| Examples in chat | Give real examples; the agent stages them as a dataset. It asks for real examples rather than inventing labels. |
| The dataset studio | Generate and check a dataset for the chain, then press **Use for evolution** (*Использовать для эволюции*) on a dataset version. See [Datasets](/care/autobench/overview/). |

### A dataset from your own file

*Development line.* The agent imports the file directly instead of pasting
rows into chat (models routinely corrupt copied values). The import is free
and needs no dialog; the card shows the column names and the row count, while
cell values stay in the app.

- Formats: `.csv`, `.tsv`, `.xlsx`, `.xlsm`; up to 20 MB.
- The file must be inside the project folder (attachments are saved there).
- You say which column is the expected answer; columns with non-Latin
  headers can be picked and renamed.
- The rows must pass the same admission as any evolution dataset: 2–1000
  rows, 2–64 scalar columns, non-empty input and target in each row, cells up
  to 8,192 characters.

## How candidates are scored

The agent picks the evaluator from your task and asks if it is unclear.

| Evaluator | When | Options |
| --- | --- | --- |
| **Exact match** | Short answers: a label, a number, a fixed format. | Whole answer equal, substring, or a regular expression whose group is compared. |
| **Continuous metric** | Text close to a reference. | ROUGE-L (default), BERTScore, BLEU. |
| **LLM judge** (*LLM judge (0..1)*) | Free-text answers where exact match or ROUGE make no sense: summaries, reviews, explanations. | A grading rubric in your words, up to 8,000 characters. The platform's judge model scores each sampled row from 0 to 1. |

Ask for the judge in words, for example *"evolve the review chain, grade
answers with a judge: the verdict must match the paper's main weakness"*.

The judge costs extra: one judge call per sampled row of every evaluated
candidate (3 rows per evaluation, at most 8,192 tokens per call). The plan's
token estimate includes these calls. A platform without the judge refuses the
start with *Платформа эволюции не поддерживает LLM-судью — обновите стенд*
(the platform does not support the LLM judge).

## Several objectives and the Pareto front

By default evolution selects on quality alone. A platform that also measures
cost (tokens and model calls per example) reports a front, and the evolution
card then shows the **trade-off versions** (*Версии-компромиссы*): versions
where none is both better and cheaper than another. This is reporting only.
If one version is best on everything, the card says there are no
trade-offs.

You can ask to evolve on other objectives instead, for example *"evolve on
quality and token cost"*. Up to four objectives:

- built-in: `fitness` (quality), `val_fitness` (quality on validation),
  `avg_tokens_per_sample`, `avg_llm_calls_per_sample`, `mae`, `mse`, `rmse`;
- custom: a name, whether higher is better, and Python code defining
  `metric(rows) -> float`. Each row has the prediction, the reference, the
  output, the input, success, time, tokens and model calls. The code runs on
  the platform, not in the app.

One objective means the run evolves on that metric. Several mean **Pareto
selection**: the platform keeps versions that are not worse on every
objective at once. The card says which case it is.

The Pareto chart on the card plots the first two objectives, better up and
to the left; further objectives are in the list below it. The list shows up
to 16 versions with their values and generation, and marks the best on each
plotted objective. After the run completes, **Take this version** (*Взять
эту версию*) drafts a request to stage that version instead of the
highest-quality one.

Objectives are passed to the start of the run; the plan's token estimate does
not depend on them. Declared objectives need a platform that supports them.

## Start

Ask in chat, for example:

```text
Evolve the receipt chain on the latest dataset, budget 1,000,000 tokens.
```

or press **Evolve** (*Эволюционировать*) on a chain card in My agents and
send the drafted request.

The agent then:

1. finds the chain and suitable datasets by name and asks you if several fit;
2. prepares both as exact artifacts (pinned by digest);
3. makes an **evolution plan**: the seed chain, the evaluator, promotion
   thresholds and a **token estimate**;
4. starts the evolution as a background job. This is paid work and asks for
   one confirmation (unless Full access).

A total budget you name ("1,000,000 tokens") becomes the plan's total token
limit. It is checked **before** the start against the plan's estimate. During
the run the platform enforces per-call token caps (by default 16,000 for a
mutation and 4,000 for a validation call), not a campaign-wide cutoff, so
treat the total as a planning limit. If the plan warns that the mutation cap
is too low for a reasoning model, the agent tells you before starting.

## Watch

The **evolution card** in chat updates live (*development line*). One status
read per run every 5 seconds feeds the card and the progress dock; it pauses
while the window is hidden and stops when the run ends.

The card shows:

- generation *N* of *M* and the best score;
- the fitness curve over evaluated versions (0 is the seed);
- the trade-off versions (see above);
- buttons: **Save best version** (*Сохранить лучшую версию*) after the run
  completes, **Request cancel** (*Запросить отмену*) while it runs,
  **Radar in IdeaL** (*Радар в IdeaL*) and **Open log** (*Открыть журнал*).

Later status reads of the same run fold into one line instead of new cards.
[Activity](/care/app/activity/) lists the run with the same progress.

`status: prepared` means the experiment exists but the platform has not yet
confirmed it as queued or running. Read its status before treating it as
started.

## Steer with ideas

With IdeaL as chain memory, each mutation gets a slate of ideas from your
namespace, and IdeaL records whether they helped. While a run is going you can
ask the agent to push a specific idea into its next mutations. Seed ideas
first if the lake is empty. See [The IdeaL panel](/care/app/ideas/).

## Cancel

Press **Request cancel**, press **Stop** in the progress dock, or ask the
agent to stop the evolution. Cancelling is free. An evolution run can be
**cancelled but not paused**.

## Take the result

When the run finishes, press **Save best version** or ask for the result. The
best chain (or the trade-off version you took) is **staged in the session**
as an artifact. It is not written to memory automatically. Run it on your
input to check it, then ask the agent to save it; it becomes a new version in
My agents, named after what it now does.

## Limits

- No pause or resume for evolution runs.
- `population_size` is not accepted by the modern platform runner.
- Datasets of *tasks with tools* and datasets whose cases carry files cannot
  be used for evolution yet.
- No automatic comparison on the holdout part and no automatic promotion of
  the winner into memory.
- If the answer to a start request is lost, the outcome is uncertain. Within
  the same app process a repeated start with the same key returns the first
  outcome; after a restart, check the existing run before starting again.

## From the TUI and CLI

The TUI has an evolution dashboard and a launch picker; the CLI has
`maestro evolve <chain_id> [--wait] [--accept]`. See
[Production mode](/care/workflows/production/) and the
[CLI reference](/care/cli/capabilities/).
