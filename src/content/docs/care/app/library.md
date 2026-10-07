---
title: Library
description: The Maestro Library — saved chains and the chain card, memory cards, ideas, evolution datasets, tools and skills, and draft requests.
sidebar:
  order: 2
---

The **Library** button (*Библиотека*) in the sidebar opens everything saved in
Maestro's memory. It opens without a session and without a model call.

Maestro's own panels are in Russian; labels are given in italics below.

## Memory status line

The top of the panel says which memory this window reads:

- local or cloud, and the host;
- the IdeaL namespace and its idea count, when IdeaL is the chain memory;
- what to fix if memory does not answer: a missing key
  (*Settings → MAESTRO → Memory API key*) or an unreachable server.

The list is limited by the memory key from the settings. An anonymous key or a
key that can read everything may show more than one user's data; the panel
does not claim personal isolation.

## Sections

| Section | What it shows | Needs an open session |
| --- | --- | --- |
| **Chains** (*Цепочки*) | Saved chains, with search by name and description. | No |
| **Memory cards** (*Карточки памяти*) | Saved memory cards (notes, run digests). | No |
| **Ideas** (*Идеи*) | IdeaL ideas, the ideas graph, the run radar. See [Ideas and the IdeaL radar](/care/app/ideas/). | Yes |
| **Datasets** (*Наборы данных*) | Evolution data generation runs and dataset versions. See [Evolution data](/care/workflows/data-generation/). | Yes |
| **Tools & skills** (*Инструменты и навыки*) | The workshop: create or rework a tool or a skill. See [Tools and skills workshop](/care/workflows/workshop/). | Yes |

Chains and memory cards are read through a read-only channel with no agent
behind it. Ideas, datasets, tools and skills are read and changed *as the open
session*, because their writes and paid actions use that session's
confirmation path. With no open session these sections say so.

Lists show 20 items per page. A search shows at most the first 100 ranked
results; refine the query to see the rest.

## The chain card

Click a chain to open its card:

- name, task description, number of steps and version;
- the **structure graph**: step titles, types and dependencies. Prompts and
  step configurations are not shown;
- **Rename** (*Переименовать*): saves the chain under a readable name as a **new version** of
  the same chain. Description and steps do not change. It needs an open
  session (the version is written as that session) and is refused when memory
  is read-only;
- **Evolutions of this chain** (*Эволюции этой цепочки*): the chain's evolution runs from IdeaL, newest
  first, with status, best score, number of mutations and a radar toggle.
  Runs started before tasks had stable keys are not matched; the empty state
  says so.

## Actions open a draft, not a run

The card has three buttons:

- **Run** (*Запустить*)
- **Evolve** (*Эволюционировать*)
- **Data for evolution** (*Данные для эволюции*)

None of them runs anything from the panel. Each opens a new session (or fills
the open empty one) with a **ready request in the input field**. You read it,
edit it if needed and send it yourself. Paid steps are then confirmed by the
app dialog as usual.

For example, *Evolve* drafts a request to find suitable datasets for this
chain, ask you if there are several, prepare the artifacts, make a plan and
start the evolution.

If no workspace is chosen yet, the panel asks you to choose one first.

## Limits

- Library lists are only as fresh as the last refresh; use the ↻ button.
- Memory-card search returns at most 100 ranked results.
- Nothing in the Library deletes data. Ideas are archived, not deleted.
