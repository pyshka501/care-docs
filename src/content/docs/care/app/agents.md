---
title: Building an agent
description: How Maestro builds a new agent (chain) from a description — the brief, who writes the chain (the chat agent or MAGE), the test run, what "checked by a run" means, and what it costs.
sidebar:
  order: 3
---

In Maestro an **agent** is a saved chain: a small program of typed steps
(model calls, tools, MCP servers, skills) written in the
[CARL format](/carl/getting-started/overview/). *My agents* in the sidebar
lists them. This page describes how a new one is built in the desktop app.

:::note[Development line]
Agent-first naming, the brief with clarifying questions and the chat agent as
the default chain author are in builds from the current development line,
not in a tagged release.
:::

## 1. Describe the task

Write what the agent should do, in plain words, optionally with files:

```text
Make an agent that takes a city name and gives a short weather summary.
```

```text
Create a reviewer agent for papers. The paper comes as a PDF.
```

Keep concrete inputs ("for Moscow") separate from the task if you can; the
agent treats them as test input, not as part of the chain.

## 2. The brief

Before building, the agent fills a brief:

- **task**: what it does for any input and who uses the result;
- **input**: fields and types, one realistic example, where it comes from;
- **output**: format (free text, JSON with named fields, a report, a score
  or a label), language, length;
- **data and tools**: external sources or APIs, files, web access;
- **quality**: what a good result is; a rubric, examples or a dataset;
- **lifecycle**: one-off or reusable, saved, deployed, evolved later.

It first looks for answers itself (your message, attachments, Memory, the
real response of a named API) and then asks only for what is still missing,
or decides itself, depending on **Clarify before building**. See
[Clarifying questions](/care/app/chat/#clarifying-questions). The brief is
shown in a few lines before building.

## 3. Who writes the chain

**Settings → MAESTRO → Who writes chains** (*Кто пишет цепочки*):

| Option | What happens | Trade-off |
| --- | --- | --- |
| **Agent** (*Агент*), default | The chat agent reads Maestro's authoring guide, fetches one real response from every API the chain will call, writes the chain, validates its references, stages it with a realistic test input and **runs it**. If a step fails or the answer says data is missing, it finds the first wrong step, fixes it and runs again, up to three repairs. | Slower and uses more tokens, but the chain has been run on real data. |
| **MAGE** | The MAGE generator builds the chain in several model calls, normally as a background job. The chain is validated but **not run**. | Faster and cheaper; links between steps are not checked on real data. |

Whatever the setting, you can ask for the other one in chat (*"let MAGE
generate it"*). The agent does not switch authors silently after a failure.

The **Session tab** also has two explicit shortcuts under *Create chain*
(*Создать цепочку*): **Maestro generator** and **Agent**. Each drafts a
request for that author.

## 4. What you get

- A **chain card** with the step graph, step types, whether an input
  contract is declared, and a readiness summary.
- A label **Checked by a run** (*Проверена запуском*) or **Not checked by a
  run** (*Не проверена запуском*). Only a successful run of this exact chain
  in the session sets the first one. Validation alone proves that the
  structure is sound, not that the chain works.
- A **Run** button on the card that drafts a run request.

If three repairs did not help, the agent says which step still fails and
why; it does not call the chain working.

Nothing is saved yet. Ask *"save it"* to write the chain to memory; it then
appears in [My agents](/care/app/library/).

## What it costs and what asks

| Step | Paid | Asks |
| --- | --- | --- |
| Studying the request, Memory search, validation, staging | No model call beyond the chat itself | No Maestro dialog |
| Each test run while the agent writes the chain | Yes: chain steps call the model | One dialog per run, unless Full access |
| MAGE generation | Yes | One dialog, unless Full access |
| Saving to memory | No | No Maestro dialog |

Agent authoring spends the chat model's tokens on every reconnaissance call,
repair and test run. With a ChatGPT subscription model they come out of the
subscription limits. Keep test inputs small. See
[Confirmations](/care/app/confirmations/).

## After building

- **Run** it on your input or files: [Runs, pause and repair](/care/app/runs/).
- **Improve** it on a dataset: [Evolution](/care/workflows/evolution/).
- **Publish** it as an HTTP agent: [Deploying agents](/care/workflows/deploy/).
- **Add a missing tool**: [Tools and skills workshop](/care/workflows/workshop/).

## Limits

- Chat tools (the agent's own file, shell and web tools) do not exist inside
  a chain. A chain's tool step may use only Maestro's runtime tools, such as
  `fetch_url`.
- A chain that passed validation and one test run is still not proven
  correct for every input. Check it on real examples, or build a dataset and
  evaluate it.
