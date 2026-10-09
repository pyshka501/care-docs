---
title: IdeaL radar
description: The radar of one evolution run in Maestro. Where to find it, how to read it, ideas versus control, and how to force an idea into a running evolution.
sidebar:
  order: 3
---

The **radar** shows one evolution run through the lake: which ideas it
received, which it applied, and what they did to the score. It is the same
picture as IdeaL's live run page, drawn natively in Maestro.

## Where to find it

Press **Радар идей** (hide with **Скрыть радар**) in any of these places:

- the evolution card in the chat, under "Запуск exp_…";
- **Активность**: evolution items, and the list "Эволюции из памяти IdeaL",
  which survives app restarts because it comes from the memory server;
- a saved chain in the Library: its list of evolutions.

**Страница в IdeaL** opens the run's signed page in the browser.

## How to read it

| Part | Meaning |
| --- | --- |
| Header | Task of the run, status (running or finished), mutations, best score, and a sparkline of the best score. |
| **С идеями** / **Контроль** | Mutations that received ideas vs control mutations (deliberately empty slates): count, share of improvements, mean delta. |
| Centre | The task. |
| Points | Ideas and tools. Distance from the centre: how close the idea is to the task (cosine similarity, needs embeddings on the server). Angle: a stable layout of all ideas in the namespace. |
| Colour | Effect in this run: improved, worsened, about zero, or not applied. A red outline means it was only used in invalid children. |
| Lines to the centre | Ideas delivered in this run. |
| Sectors (Темы) | Groups of nearby ideas, named by the lake LLM or by the most common tag. |
| Feed | Mutations in order: arm, delivered and applied ideas, delta. |

Click a point to see the idea: how often it was delivered and applied in
this run and its mean gain, or, for an undelivered one, its closeness to the
task.

## Force an idea

On a running evolution, select an idea and press **Подсунуть в следующие
мутации**. The idea goes into every next slate of this run until some
mutation applies it. **Снять подсказку** stops that.

- Forced mutations are shown in the feed with the arm "подсказанная идея".
- They are excluded from idea ratings and from the ideas-vs-control
  comparison, so forcing does not skew the statistics.
- Forcing changes the course of a paid run. It is written on behalf of the
  open session and goes through its approval.
- The button is hidden for finished runs.
- **Read only** in Settings does not disable forcing: the force is a write to
  the run on the server, and this release does not check the read-only flag
  for it.

## Asking the agent

The Maestro agent can read the same data:

- "Как идёт эволюция?", "какие идеи сработали?": `maestro_ideal_run_radar`
  with the run id (`exp_…`). The agent reports the best score, ideas vs
  control, and which ideas were applied with what effect.
- "Какие эволюции были у этой цепочки?": `maestro_ideal_chain_runs`.
- "Подсунь идею X": `maestro_ideal_run_force` with `active=true`. The agent
  does this only on an explicit request for that run and idea.

## When the radar is unavailable

| Message | Cause |
| --- | --- |
| "версия IdeaL на сервере ещё не отдаёт ссылки на прогоны" | The server is older than `GET /v1/ideal/run/{namespace}/{run_id}/link`. |
| "Этого прогона нет в пространстве идей" | The run never received ideas, or belongs to another namespace. |
| "Радар не загрузился: …" | The signed page data could not be read. |

Distance and nearby undelivered ideas need stored embeddings on the server
(vector search on). Without them the radar shows only the delivered and forced
ideas, spaced evenly around the task, and closeness means nothing.

## How it works

Maestro asks the server for the run's signed links with your memory key, reads
the page data and passes on only bounded, typed fields. The signed links are
capabilities: Maestro does not log them and shows the page link only for you
to open. On a hosted HTTPS store, Maestro upgrades `http://` links on the same
host to HTTPS so the signature never travels in clear text.
