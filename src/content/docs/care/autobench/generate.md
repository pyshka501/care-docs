---
title: Generate a dataset
description: Starting an autobench run in the Maestro app — entry points, the three-step wizard with its defaults, task types, strategies, file inputs, stop conditions, budget, what costs money, and the controls while it runs.
sidebar:
  order: 2
---

Maestro's own panels are in Russian; labels are given in italics.

## Where to start a run

- **Datasets** (*Наборы данных*) in the [Library](/care/app/library/) panel →
  **New dataset** (*Новый набор*). Needs an open session. The wizard is
  prefilled from the latest chain in that session's chat.
- A saved chain in the Library list, or a chain card in chat →
  **Generate data for evolution** (*Сгенерировать данные для эволюции*). The
  wizard opens in place with that chain attached.
- A chain's page in the Library → **Data for evolution** (*Данные для
  эволюции*). This opens a new session with a drafted request for the agent;
  you send it.
- Ask the agent, for example *"build evolution data for the receipt-sum
  chain, 40 cases"*. See [Agent tools](/care/autobench/tools/).

Runs started from any of these also appear in [Activity](/care/app/activity/),
which opens them in **Datasets**.

## The wizard

Three steps: **Task** (*Задача*), **Format and check** (*Формат и проверка*),
**Model and size** (*Модель и объём*).

### 1. Task

| Field | Default | Meaning |
| --- | --- | --- |
| Agent task (*Задача агента*) | from the chain | What the agent does and gets as input. Required. |
| How to create cases (*Как создавать примеры*) | Model writes cases | **Model writes cases** (*Модель пишет примеры*): batches with structured output, each reference answer confirmed by a blind solve and a judge. **Model writes a generator** (*Модель пишет генератор*): for data that can be computed (equations, dates, calculations); see [Generator program](#generator-program). |
| Task type (*Вход агента*) | Text answer | **Text answer** (*Ответ текстом*): the agent gets an input and answers. **Tasks with tools** (*Задачи с инструментами*): the agent acts in an environment with data; the final state is checked. See [Tasks with tools](#tasks-with-tools). |
| Input modality (*Модальность входа*) | Text | Text, Image, PDF, Word document, Excel table, CSV, Audio. Shown only for text answers written by the model. Any file modality switches the provider to Codex. See [File inputs](#file-inputs). |

When a chain is attached, its input fields (`input.<name>` references in the
chain) become the case fields; without a chain the single field is `text`.

### 2. Format and check

| Field | Default | Meaning |
| --- | --- | --- |
| Input format (*Формат входа*) | empty | Optional. What an input looks like, e.g. "receipt text with items, discounts and a total; sometimes without the total". |
| Answer format (*Формат ответа*) | empty | Optional. E.g. "only a number with two decimals, no currency". The reference answers follow it. |
| Requirements (*Особенности*) | empty | Optional. E.g. "more ambiguous wording, 20% of tasks in English". |
| Check method (*Метод проверки*) | Auto | How an answer is judged correct. See [Checks and verification](/care/autobench/checks/). |
| Pattern / JSON field / Tolerance / Labels | — | Extra field for **Regex** (required), **JSON field**, **Number** (tolerance, default 0) and **Label from a list** (comma-separated; empty lets the model choose). |
| Description of a correct answer (*Описание правильного ответа*) | empty | Your own words for what counts as correct. With **Judge model** this field is the **Criterion for the judge** (*Критерий для судьи*): the judge reads it while checking cases, and the evolution evaluator gets it too. |

### 3. Model and size

| Field | Default | Meaning |
| --- | --- | --- |
| Provider (*Провайдер*) | Codex if available, else the chat model | **Codex**: your ChatGPT sign-in, structured output, can create files. **Chat model** (*Модель чата*): the current chat model; no files. See [Providers](/care/autobench/providers/). |
| Codex model (*Модель Codex*) | `gpt-6-luna` if your Codex CLI lists it, else the first listed | Only for Codex. |
| Reasoning effort (*Усилие рассуждения*) | medium | low (faster), medium, high (more accurate). Only for Codex. |
| When to stop (*Когда остановиться*) | Reach the number | See [Stopping and budget](#stopping-and-budget). |
| Cases (*Примеров*) | 24 | 4–500. In the two other stop modes this is the first round's size. |
| Model call limit (*Лимит вызовов модели*) | 60 | 1–5000. Only for the "while calls remain" mode. |
| Difficulty (*Сложность*) | balanced | easier, balanced, harder: the share of easy/medium/hard cases is 50/40/10, 20/50/30 or 5/35/60 %. |
| Holdout, % (*Закрытая часть, %*) | 25 | 0–50. Whole families are held out, never single cases. |
| Cases per call (*Примеров за вызов*) | 10 | 1–25. Batch size. Only when the model writes cases. |
| Budget, tokens (*Бюджет, токенов*) | 1,000,000 | From 5,000; the server accepts up to 5,000,000. |

**Start generation** (*Запустить генерацию*) starts the run. The button is
disabled when Codex is selected but not available, or when a file modality is
chosen without Codex; the reason is shown under the form.

The server also refuses some combinations: files without Codex, files with
tool tasks, a generator program with tool tasks or files, and the calls mode
without a limit.

## Stopping and budget

| Mode | Stops when |
| --- | --- |
| **Reach the number** (*Набрать нужное число*) | Accepted cases reach **Cases**. Rejected cases are topped up in up to 3 extra rounds. |
| **Until the budget runs out** (*Пока не кончится бюджет*) | The token budget is spent. Each round adds one batch per family that still produces accepted cases. |
| **While calls remain** (*Пока есть запросы*) | **Model call limit** is used up. Useful with subscription limits. |

In every mode a run also ends when three top-up rounds in a row add no
accepted case, and a family that produced a full batch with nothing accepted is
not retried.

Facts from the code that matter for spending:

- Batches run in parallel: up to 3 at once with Codex, 2 with the chat model.
- The budget is checked **between** batches. Batches already running finish, so
  the final count can go somewhat past the budget.
- Top-up rounds are planned against a per-batch estimate of 30,000 tokens for
  Codex and 8,000 for the chat model.
- Codex token counts are what the Codex CLI prints: estimates, marked
  *(оценка Codex)* on the screen. Codex spends your ChatGPT subscription
  limits; the chat model spends the chat model's key.
- With the chat model, one start (or resume, or extend) gets a model lease of
  at most 600 calls and 6 hours.

Every finished or stopped run saves a dataset version from what was accepted,
whatever the stop reason. If nothing was accepted, no version is created.

## What costs money and what asks first

| Action | Model calls | Confirmation |
| --- | --- | --- |
| **Start generation** in the wizard | yes, within the budget | none: pressing the button is your consent |
| The agent starts a run | yes | one app dialog |
| Pause, Stop and save, Retry failed | no new work | none |
| Resume | continues paid work within the approved budget | none |
| Instruction while running | one spec call within the budget | none |
| Edit, accept, exclude, move, add a case; preview or save proportions | none | none |
| Generate missing cases from the **Proportions** tab | yes, paid (free for a generator program) | none from the screen; a dialog when the agent asks |
| Generator tab: preview, save code, generate more | none (runs locally) | none from the screen |
| Generator tab: ask the model to change it | one call | none from the screen |

A session with the **never ask** approval preset approves agent calls
without dialogs. See [Confirmations](/care/app/confirmations/).

## While it runs

The run opens in **Datasets** with tabs **Overview** (*Обзор*), **Cases**
(*Примеры*), **Proportions** (*Пропорции*), **Generator** (*Генератор*, only
for generator programs), **Versions** (*Версии*) and **Log** (*Журнал*).

**Overview** shows the stages (**Specification**, **Generator**,
**Generation**, **Verification**, **Saving**), a progress bar toward the stop
condition, and counters: created, accepted, rejected, unverified
(*Без проверки*), excluded, stale, tokens, model calls, time.

Controls:

- **Pause** (*Пауза*): no new batches; the running ones finish. **Resume**
  (*Продолжить*) continues from the saved point and reuses finished work.
- **Retry failed** (*Повторить неудачные*): requeues failed batches.
- **Stop and save** (*Остановить и сохранить*): ends the run for good; verified
  cases are saved as a version.
- **Instruction** (*Инструкция по ходу*) → **Send** (*Отправить*), e.g. *"add
  more cases with ambiguous names"*. It is applied at the next safe point and
  produces a new spec version. Cases that no longer fit become **stale**. An
  unclear instruction puts the run into *awaiting input* (*Ждёт уточнения*).

The collapsible **Specification v N** block shows the goal, the success
criterion and the families with their difficulty and part (search or holdout).

Runs are durable. If the app restarts during a run, the run shows **Needs
resume** (*Требует возобновления*) and continues from its saved state when you
press **Resume**. The model credential of a run is kept only in memory, so
resuming needs a working model connection in the current session.

## Generator program

With **Model writes a generator** the model writes one Python module with
`generate(rng, family, difficulty)` that returns the input, the reference and
a short rationale. Then:

1. The program runs on 12 trial cases; at least 8 must be valid, otherwise the
   model gets the errors and tries again (3 attempts).
2. The program generates the cases. Its references are exact by construction.
3. An audit: a sample of up to 8 accepted cases is solved blind by the model.
   If at least 4 were checked and fewer than half agree, the run pauses with
   *generator audit failed* (*аудит генератора не пройден*). Check the code.

The program uses only the Python standard library, must run on Python 3.9, and
runs locally under the macOS `sandbox-exec`: no network, writes only to its own
temporary folder, no reads of credential folders (`~/.codex`, `~/.ssh`,
`~/.aws`, `~/.config`, Keychains, Documents, Desktop, Downloads), 60 seconds
per run, at most 2,000 cases per run. Generating more cases with an existing
program makes no model calls.

Generator programs work only for text answers with text input.

## File inputs

With a file modality Codex first writes the data and the reference answer,
then creates the file strictly from them in a work folder. A file is accepted
only if it is inside that folder, has the right extension and file signature
(PNG/JPG/WebP; PDF; DOCX; XLSX; CSV in UTF-8; WAV/AIFF/M4A/MP3) and is at most
20 MB. A batch with no usable file counts as a failed attempt and is retried.
The case input gets a `file` field with the path.

Accepted files are kept next to the store in `assets/<run_id>/`. The **Cases**
tab previews images, audio and PDF; holdout files are never shown.

Datasets with files can be reviewed, edited and exported, but **not used for
evolution**: chains take text input only.

## Tasks with tools

With **Tasks with tools** the model first designs a declarative environment:
tables with records and tools (find, update, insert, delete) with
preconditions. If the chain has tool steps, their interfaces are reused under
the same names. Each case has one input field, `instruction` (the user's
request); the hidden reference holds the expected tool calls and checks on the
final state.

A task is accepted when the reference calls pass in a clean environment,
deliberately wrong behaviour fails, and an independent blind solve passes the
same check. These datasets cannot be used for evolution yet: the evolution
evaluator checks answer text only.
