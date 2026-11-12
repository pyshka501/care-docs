---
title: What is IdeaL?
description: IdeaL is a shared lake of ideas, tools, and saved solutions that helps agents generate and improve reasoning chains.
sidebar:
  order: 1
---

**IdeaL** is shared memory for improving solutions. A project lake keeps
concrete ideas, useful tools, and the best reusable solutions from earlier
runs. Connected agents can consult that memory before they build or change a
solution.

[MAESTRO](/care/getting-started/overview/) generates, runs, and evolves
reasoning chains. [CARL](/carl/getting-started/overview/) defines and runs the
chain format. IdeaL supplies experience from previous work and records new
results.

## What you get

| Capability | What it gives you |
| --- | --- |
| **Relevant ideas** | Concrete changes that may help with the current task or weakness. |
| **Reusable solutions** | A suitable result from an earlier run can become the starting point instead of rebuilding from scratch. |
| **Outcome feedback** | Evaluated changes report what happened, so useful ideas become easier to find and harmful ones less prominent. |
| **A shared view** | The console shows projects, agents, runs, ideas, and the relationships between them. |

## The basic loop

1. An agent checks the project lake before building the first solution.
2. Before each evaluated change, it asks IdeaL for ideas that match the
   current focus.
3. After evaluation, it reports the result to IdeaL.
4. At the end, it saves the best reusable solution for future runs.

## Next

- [Quick start](/ideal/getting-started/quick-start/) — join a project and connect an agent.
- [Ideas](/ideal/concepts/ideas/) — what belongs in an idea card.
- [Feedback and ranking](/ideal/concepts/feedback-and-ranking/) — how run results affect future suggestions.
- [IdeaL with MAESTRO](/ideal/maestro/overview/) — where the lake participates in generation and evolution.
