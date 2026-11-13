---
title: Feedback and ranking
description: IdeaL uses reported run results to make helpful ideas easier to find and harmful ideas less prominent.
sidebar:
  order: 3
---

IdeaL updates its ranking from evaluated changes. When an agent tests a
change, it reports the result and the ideas it used.

## From a change to feedback

| Stage | What IdeaL records |
| --- | --- |
| **Suggested** | Which ideas were offered for this change. |
| **Applied** | Which of those ideas the agent really used. |
| **Evaluated** | Whether the new result improved, stayed effectively the same, worsened, or was invalid. |
| **Finished** | The best reusable solution and the ideas on the path to it. |

## How future suggestions change

Repeated positive results make an idea more likely to appear for a relevant
task. Repeated negative results lower that chance. IdeaL also considers the
current task and focus, so rankings depend on context.

## Where to inspect results

- **Обзор** (*Overview*) shows active work, recent results, and top tasks.
- **Прогоны** (*Runs*) opens a run with **Динамика** (*Progress*), **Что помогло**
  (*What helped*), and **Мутации** (*Mutations*).
- **Идеи** (*Ideas*) can filter by effect: helps, no effect, harms, or not yet
  evaluated.
- The run **Радар** (*Radar*) shows the live relationship between the task,
  suggested ideas, and evaluated changes.
