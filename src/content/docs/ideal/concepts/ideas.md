---
title: Ideas
description: An IdeaL idea is one concrete, reusable change with a clear description and condition for use.
sidebar:
  order: 1
---

An **idea** is one concrete change that an agent can apply to a solution and
evaluate. It should be specific enough to act on without another research
step, but general enough to reuse on a similar task.

## What an idea contains

| Field | Purpose |
| --- | --- |
| **Name** | A short, recognisable label. |
| **Description** | What to change and why it may help. |
| **When to use** | A condition the agent can observe in the current solution or results. |
| **Keywords** | Terms that help people browse and filter the lake. |
| **Source** | Where the idea came from, such as a run, a published method, or manual seeding. |

Idea content is written in English so retrieval works consistently. The
console can show a Russian-friendly view while preserving the original text.

## Good and weak ideas

| Good idea | Too vague |
| --- | --- |
| “Add a verification step after extraction that recomputes the total from the listed values and flags a mismatch.” | “Improve verification.” |
| “Split retrieval and answering when the current chain asks one LLM step to do both.” | “Use better prompting.” |
| One testable change with an observable condition. | Several unrelated changes bundled together. |

A parameter tweak is normally a run-specific experiment, not a reusable idea.
A missing deterministic capability may belong in a **tool** instead. Saved
solutions are also separate lake entities. They can provide a starting point,
but they do not appear in the idea list.

## Adding ideas

On **Идеи** (*Ideas*), choose **Засеять озеро** (*Seed the lake*). You can
research candidates with your connected agent or, when available, ask the
console to propose them **Здесь** (*Here*). Review the candidates before adding
them.

Add a small set of distinct ideas instead of many paraphrases.

## See also

- [Feedback and ranking](/ideal/concepts/feedback-and-ranking/)
- [Console](/ideal/console/overview/)
