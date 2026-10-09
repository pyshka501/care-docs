---
title: Seeding the lake
description: Fill an IdeaL namespace with good ideas for a task. With the Maestro agent, with the IdeaL web UI, or with the portable ideal-seed skill from any coding agent.
sidebar:
  order: 5
---

A new namespace is empty, and evolution can only deliver what is in the
lake. Seeding means drafting a handful of sharp ideas for a task, removing
duplicates, and saving the approved ones. Five good ideas are worth more than
thirty generic ones.

There are three ways to seed. All of them write normal active ideas.

## 1. Ask the Maestro agent

In a Maestro session, say what the chain must do, for example
"засей идеи для задачи: отвечать на числовые вопросы по финансовым отчётам".
The agent follows its built-in lake instructions:

1. Asks only for what is missing: input, output, metric. It writes to the
   configured namespace and never picks another one.
2. Looks at the lake first (`maestro_ideal_graph`, `maestro_memory_search`).
   If a saved chain solves this task, it grounds ideas in that chain's steps.
3. Searches for techniques: its own knowledge, plus web search when it is
   available. Keeps a short source per idea.
4. Drafts 5–8 ideas, each one concrete change, spread across stages (input,
   retrieval, reasoning, verification, output). In English;
   `maestro_idea_translate` if you wrote in Russian.
5. Runs `maestro_idea_check` on every draft, fixes problems, drops exact
   duplicates and makes similar ones clearly distinct.
6. Shows you a table: name, one-line description, nearest existing idea,
   keep / rewrite / drop, and the exact texts. **Nothing is written until you
   approve the list**, unless you asked to seed without review.
7. Saves the approved ideas with `maestro_idea_save` and reports what was
   saved and skipped.

New ideas have no experience. The agent does not claim they work; later runs
decide.

Missing deterministic capabilities (arithmetic, date normalisation, exact
lookup) are tools, not ideas. The agent creates real tools in the tools
workshop, which writes and tests code. Without an implementation it phrases
the need as an idea.

## 2. The IdeaL web UI

Open the IdeaL tab, choose the namespace and press **Graph**. The graph
view can:

- add an idea or a tool by hand;
- generate candidates with the lake's own LLM
  (`POST /v1/ideal/seed/propose`). Each candidate gets a `keep`, `rewrite` or
  `drop` verdict with a reason and up to three nearby existing entities.
  Nothing is written until you add the selected candidates;
- copy a ready prompt for an external agent instead, when no lake LLM is
  configured.

Generation needs `IDEAL_LLM_API_URL`, `IDEAL_LLM_API_KEY` and a model on
the server (`GET /v1/ideal/seed/status` says whether it is configured).
Ideas added this way get `origin: skill` or are marked as added by hand.

## 3. The ideal-seed skill (any coding agent)

The repository ships a portable skill, `skills/ideal-seed`: `SKILL.md` and a
standard-library helper `scripts/lake.py`. The running server also serves
both files:

```text
GET {api}/v1/ideal/skill/SKILL.md
GET {api}/v1/ideal/skill/scripts/lake.py
```

Install it into a coding agent that supports skills, then set:

```bash
export IDEAL_API_URL=http://localhost:8000/api
export IDEAL_API_KEY=<key>
```

The workflow is the same as the agent's: look at the lake
(`lake.py context --namespace NS --task "..."`), draft candidates into a JSON
file, check them against the lake, show the list for approval, then write.

Do not use the skill from inside Maestro: the Maestro agent uses its own
tools and never handles the lake key.

## 4. At deploy time

`IDEAL_SEED_NAMESPACE` in the server `.env` puts 40 built-in ideas and one
starting chain (a T2-RAGBench chain) into that namespace on every start of
`memory-migrate`. Ideas already present (same description hash) are
skipped. The example `.env` uses `demo`. Leave it empty to skip.

## What makes a good seed

- One change per idea, naming the step it touches, in 1–3 sentences.
- `when_to_use` is an observable condition, never "always".
- No generic advice ("improve the prompt", "use a stronger model").
- No test-set answers.
- No paraphrases of ideas already in the lake.
- English text, so search can find it.
