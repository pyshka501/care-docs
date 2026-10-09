---
title: Confirmations
description: When the Maestro app asks before acting — one confirmation for paid work, no dialog for free actions, the Full access preset, and forms that count as consent.
sidebar:
  order: 6
---

The rule is simple: **paid work asks once, free actions do not ask.** The
dialog comes from the app, not from the agent. The agent is told not to ask
"shall I proceed?" in chat before a Maestro action.

## Paid work: one dialog

These actions call a model (or start many model calls) and show one
confirmation dialog with a short description of what will happen:

| Action | Why it is paid |
| --- | --- |
| Generate a chain | Calls the model for generation. |
| Run a chain | Chain steps may call the model and external tools. |
| Propose a repair | One model call; the original chain does not change. |
| Start an evolution | Many model calls within the budget from the plan. |
| Start evolution data generation | Chat-model calls within the budget you set. |
| Draft a tool or a skill | One or two chat-model calls; tool code runs only in the sandbox. |
| Translate an idea into English | One small chat-model call. |
| Run a CLI command with effects through the command bridge | The command may write or call services. |

Work proceeds only if you allow it. Rejecting or closing the dialog stops the
action before anything is sent. A background job asks once too: approving the
job covers the call inside it.

## Free actions: no dialog

These do not call a model provider and run without a Maestro dialog:

- saving a chain to memory (a new version) and renaming a chain;
- staging input for a run;
- saving a checked tool or skill;
- saving, editing, archiving or restoring an idea;
- pushing an idea into a running evolution, or removing that hint;
- cancelling an evolution;
- pause, resume and stop of a running chain;
- pause, resume, stop, retry and extra instructions for a running evolution
  data generation (its budget was approved at start);
- everything read-only: plans, searches, the Library, status, graphs.

Other harness tools (files, shell and so on) follow the harness's own approval
settings, not these rules.

## Full access: never ask

Each session has an access preset. With **Full access** (*Полный доступ*), the
session never asks, and paid Maestro work also runs **without a dialog**.
Choosing this preset is your standing consent to paid work in that session.
Use it when you trust the session's task and budget.

If the app cannot read the session's approval setting, the paid action is
**refused** with `MAESTRO_APPROVAL_UNAVAILABLE`. Nothing starts. This is not
reported as your rejection.

## Maestro forms count as consent

Some work starts from Maestro's own forms, where you see the parameters before
pressing the button:

- **Start generation** in the evolution data form (with the token budget on
  screen);
- **Prepare draft** and **Save** in the tools and skills workshop;
- **Translate to English**, **Save idea**, **Archive** and **Restore** in the
  idea form.

Pressing the button is the consent for that one call. No second dialog
appears.

## What the agent cannot do

- No Maestro tool accepts an "approved" flag from the model. The agent cannot
  approve its own action.
- The chat model cannot skip the dialog by wording its request differently.
- Saving settings on the [MAESTRO settings page](/care/app/settings/) always
  asks for a native confirmation of the exact change.

## Known limit

Form calls are recognised by an identifier that the app's form sets. Whether a
call that did not come from a Maestro form can carry such an identifier (for
example through a custom OpenAI-compatible endpoint you control) has not been
ruled out yet. Until it is, use the app with model endpoints you trust.
