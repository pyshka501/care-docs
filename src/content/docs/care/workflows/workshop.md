---
title: Tools and skills workshop
description: Creating or reworking a tool or a skill in the Maestro app — draft, checks, save — and what the checks do and do not prove.
sidebar:
  order: 5
---

The workshop creates a new **tool** or **skill**, or reworks one saved in
memory, in three steps: **draft → checks → save**. Open it from
**Library → Tools & skills** (*Инструменты и навыки*) with a session open, or
ask the agent in chat.

| | Tool | Skill |
| --- | --- | --- |
| What it is | A Python function using only the standard library. | A `SKILL.md`: instructions an agent follows. |
| Checks | It parses; defines exactly the declared function; imports only the standard library; avoids process and `eval`-style primitives; **runs on sample inputs in the Docker sandbox**. | Structural only: frontmatter, naming, body, no embedded secrets, only known tools. |
| What checks prove | The code is well-formed and returned results on the samples. | The file is well-formed. **Not** that an agent behaves better with it. |

## Create

1. **Create tool** (*Создать инструмент*) or **Create skill** (*Создать
   навык*).
2. Describe what it should do, for example *"currency rate on a date from a
   public API without a key"* or *"check invoices: recompute line items and
   find the mismatch"*. Optionally give a name, arguments (for a tool) and
   requirements.
3. **Prepare draft** (*Подготовить черновик*). This makes one or two
   chat-model calls (paid). Pressing the button is your consent; no extra
   dialog appears. When the agent drafts from chat, the app asks once instead.
4. Review the draft and its check results. **Make another variant**
   (*Сделать другой вариант*) asks for a new draft.
5. **Save to memory** (*Сохранить в память*). This is free and needs no dialog.

A draft lives only in the app's memory and never touches the memory store
until you save. A draft whose checks failed **cannot be saved**.

## Rework

Pick a saved tool or skill and press **Rework** (*Переработать*). Describe
what to change. For a tool, the checks re-run the previous version's samples
too. Saving writes a **new version** of the same tool or skill
(*Сохранить новой версией*).

## Where saved items go

Saved tools and skills go to the configured memory. The workshop list shows
the ones in that memory with search and filters (all, tools, skills).

## Requirements and limits

- Tool checks need **Docker** running; tool code runs only in the Docker
  sandbox, never in the app process.
- Read-only memory blocks saving.
- Skill checks do not measure behaviour. Test a skill by running a chain that
  uses it.

## See also

- [Capabilities](/care/capabilities/overview/): tools, skills and the sandbox in chains.
- [Confirmations](/care/app/confirmations/).
