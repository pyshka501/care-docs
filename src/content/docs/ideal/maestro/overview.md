---
title: IdeaL with MAESTRO
description: Connect MAESTRO to an IdeaL project so generation can reuse lake knowledge and evolution can report outcomes.
sidebar:
  order: 1
---

MAESTRO runs [CARL chains](/carl/chains/overview/), while IdeaL supplies
relevant ideas and earlier solutions. After MAESTRO evaluates changes, IdeaL
receives the run results.

Your MAESTRO deployment must be connected to the same IdeaL project you intend
to use. The project administrator or deployment owner supplies that connection.
In the IdeaL console, confirm the project under **Мои проекты** and check the
connected client under **Подключить агента**.

## During generation

Before planning a new chain, MAESTRO can check the project catalog. The result
may include:

- ideas relevant to the task;
- deterministic tools the chain can call;
- a saved solution from an earlier run on the same or a similar task.

If an earlier solution fits, MAESTRO can use it as a starting point rather
than beginning from an empty chain.

## During evolution

For each evaluated change, the evolution loop:

1. asks IdeaL for suggestions focused on the current weakness;
2. applies only the suggestions that fit the candidate;
3. evaluates the candidate with the run’s metric;
4. reports the result to IdeaL.

At the end of the run, the best complete solution is saved to the lake. A
future generation or evolution run can then reuse it.

## What you see

| IdeaL view | Use during MAESTRO work |
| --- | --- |
| **Прогоны** (*Runs*) | Follow status, score progress, helpful ideas, and mutations. |
| **Радар** (*Radar*) | Watch the live run and see how suggestions relate to the task. |
| **Идеи** (*Ideas*) | Browse the project’s reusable changes and their observed effects. |
| **Обзор** (*Overview*) | See active runs, recent results, and recurring tasks. |

## See also

- [What is MAESTRO?](/care/getting-started/overview/)
- [Feedback and ranking](/ideal/concepts/feedback-and-ranking/)
- [Console](/ideal/console/overview/)
