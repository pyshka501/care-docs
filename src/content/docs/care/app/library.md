---
title: My agents
description: The My agents panel (the library) — saved chains and the chain card, memory cards, datasets, tools and skills, and actions that draft a request.
sidebar:
  order: 4
---

The **My agents** button (*Мои агенты*) in the sidebar opens everything saved
in Maestro's memory: agents (chains) and the rest. It opens without a session
and without a model call. Earlier builds called this panel the *Library*
(*Библиотека*); the agent-first name is *development line*.

Maestro's own panels are in Russian; labels are given in italics below.

## Memory status line

The top of the panel says which memory this window reads:

- this computer or a server, and the host;
- the IdeaL namespace or project and its idea count, when IdeaL is the chain
  memory;
- what is wrong when memory does not answer, in plain words: the server does
  not answer the check, answers but is not Maestro memory, the IdeaL key was
  revoked (sign in to IdeaL again) or has no access to the namespace (choose
  a project in Settings).

The list is limited by the memory key. An anonymous key or a key that can
read everything may show more than one user's data; the panel does not claim
personal isolation.

## Sections

| Section | What it shows | Needs an open session |
| --- | --- | --- |
| **Chains** (*Цепочки*) | Saved chains, with search by name and description. | No |
| **Memory cards** (*Карточки памяти*) | Saved memory cards (notes, run digests). | No |
| **Ideas** (*Идеи*) | A pointer to IdeaL: **Open IdeaL** (*Открыть IdeaL*) opens the [IdeaL panel](/care/app/ideas/), where ideas, tools and evolution runs live. | No |
| **Datasets** (*Наборы данных*) | Evaluation datasets for evolution: generation, checking, editing, proportions and versions. See [the dataset studio](/care/autobench/overview/). | Yes |
| **Tools & skills** (*Инструменты и навыки*) | The workshop: create or rework a tool or a skill. See [Tools and skills workshop](/care/workflows/workshop/). | Yes |

Chains and memory cards are read through a read-only channel with no agent
behind it. Datasets, tools and skills are read and changed *as the open
session*, because their writes and paid actions use that session's
confirmation path. With no open session these sections say so.

Lists show 20 items per page. A search shows at most the first 100 ranked
results; refine the query to see the rest.

## The chain card

Click a chain to open its card:

- name, task description, number of steps and version;
- the **structure graph**: step titles, types and dependencies. Click a step
  to see its aim, what it does, its reasoning questions, its tool, what it
  depends on and whether it gives the final answer;
- **Rename** (*Переименовать*): saves the chain under a readable name as a
  **new version** of the same chain. Description and steps do not change. It
  needs an open session and is refused when memory is read-only;
- **Evolutions of this chain** (*Эволюции этой цепочки*): the chain's
  evolution runs kept by IdeaL, newest first, with status, best score, number
  of mutations and **Radar in IdeaL** (*Радар в IdeaL*), which opens that
  run in the IdeaL panel. Runs started before tasks had stable keys are not
  matched; the empty state says so.

## Actions draft a request, they do not run

The card has three buttons:

- **Run** (*Запустить*)
- **Evolve** (*Эволюционировать*)
- **Data for evolution** (*Данные для эволюции*)

None of them runs anything from the panel. Each opens a new session (or fills
the open empty one) with a **short request in the input field**; the exact
references the agent needs travel separately, so you never see ids. You read
the request, edit it if needed and send it yourself. Paid steps are then
confirmed by the app dialog as usual.

For example, *Evolve* drafts a request to find suitable datasets for this
chain, ask you if there are several, make a plan and start the evolution.

If no project folder is chosen yet, the panel asks you to choose one first.

## Limits

- Lists are only as fresh as the last refresh; use the ↻ button.
- Memory-card search returns at most 100 ranked results.
- Nothing in this panel deletes data.
