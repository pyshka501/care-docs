---
title: Use a dataset for evolution
description: Handing an autobench dataset version to evolution, which evaluator it gets, how the holdout part is kept and why the final holdout check is manual, how many rows the platform actually scores, and importing your own CSV/XLSX file instead.
sidebar:
  order: 5
---

## From a dataset version

On the **Versions** tab, **Use for evolution** (*Использовать для эволюции*):

1. stages **only the search part** of that version as a session artifact;
2. picks the matching evaluator (see
   [Checks and verification](/care/autobench/checks/#how-a-check-becomes-the-evolution-evaluator));
3. puts a ready request into the chat input. You send it.

The agent then builds the evolution plan with its token estimate and starts
the evolution after one confirmation. The rest is the usual
[evolution workflow](/care/workflows/evolution/).

You can also name a dataset in words, for example *"evolve the receipt chain
on the latest dataset"*. The agent finds it with `maestro_find_artifacts` and
passes a short `dataset:<id>` reference instead of copying long artifact ids.

### When the button is not offered

| Version | Shown instead |
| --- | --- |
| Tasks with tools (`stateful_env`) | *эволюция появится вместе с оценщиком по состоянию среды* |
| Inputs with files | *эволюция на файлах пока недоступна* |
| Fewer than 2 search cases, or a check evolution cannot reproduce | *для эволюции не подходит* |

## Holdout

- The holdout part is chosen **by family**, never by single case, so evolution
  never sees variants of a held-out template. It needs at least 3 families,
  always leaves at least 2 families for search, and takes hard families first
  until the share you set (default 25%) is reached by family weight.
- Holdout families stay holdout when an instruction produces a new spec
  version.
- You can move single cases between parts in **Cases**, or whole families in
  **Proportions** for one version.
- Holdout references and files are never returned by the agent tools and are
  hidden on screen. The rows stay in the local store.

:::caution[Final check is manual]
Nothing in this build scores the evolution winner and the seed chain on the
holdout part. The evolution plan lists this comparison as a manual step, and
the winner is not promoted to memory automatically. Treat a better training
fitness as a hint, not as proof.
:::

## How many rows evolution actually scores

The evolution platform runner sets `CARL__MAX_TRAIN_SAMPLES=2` and
`CARL__MAX_VAL_SAMPLES=1` for chain experiments, and a 15-second chain
timeout. Each evaluation therefore scores **2 training rows and 1 validation
row**, however large the search part is. Maestro's cost estimate for a rubric
evaluator assumes the same 3 rows per evaluation.

This comes from reading the platform code. In an earlier live run
(2026-09-28) the platform validated on 2 of 11 rows. Scores on small samples
are noisy; read them together with the dataset size.

## Import your own file

If you already have examples in a spreadsheet, the agent can import it
instead of generating data. Put the file in the project folder and ask, for
example *"import the examples from @data/cases.xlsx, the answer column is
«Ответ»"*. The agent calls `maestro_dataset_import`.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `path` | — | Relative path inside the project folder. No `..`, no symlinks. |
| `sheet` | first sheet | XLSX sheet name. |
| `columns` | all | Headers to keep, as written in the file. |
| `rename` | — | `{"Header in file": "new_name"}`. |
| `target_column` | `expected` | The reference column, after renaming (Latin name). |
| `header_row` | 1 | Row with the headers. |
| `max_rows` | — | Cap on rows (2–1000). |
| `delimiter` | sniffed | `,` `;` tab or `\|` for CSV/TSV. |

Limits: `.csv`, `.tsv`, `.xlsx`, `.xlsm`; at most 20 MB; 2–1000 rows; up to 64
columns; cells over 8,192 characters are cut. CSV is read as UTF-8 with a
Windows-1251 fallback. Rows with an empty reference are skipped.

What you get:

- The tool makes no model call and asks no confirmation.
- It returns row and column counts, column names and warnings, never cell
  values; the values go straight into a private artifact.
- A `dataset:import-…` reference you can name for evolution.
- No holdout part and no checks: the default evaluator is a continuous
  similarity metric (ROUGE-L), shown in the plan for review. Ask for another
  evaluator if exact answers matter.

Imported datasets are not autobench runs: they do not appear in **Datasets**
and cannot be edited or composed there. The reference is remembered only by
the running session process (the last 16 imports).
