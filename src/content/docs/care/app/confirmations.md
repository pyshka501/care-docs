---
title: Confirmations
description: When the Maestro app asks before acting — one confirmation for paid work and settings changes, no Maestro dialog for free actions, the Full access preset, and forms that count as consent.
sidebar:
  order: 8
---

The rule is simple: **paid work asks once, free actions do not ask.** The
dialog comes from the app, not from the agent. The agent is told not to ask
"shall I proceed?" in chat before a Maestro action, and a brief or a
clarifying question in chat is never a confirmation.

The dialog shows a short description of what will happen and two buttons:
**Allow once** (*Разрешить один раз*) and **Reject** (*Отклонить*).

## Paid work: one dialog

These actions call a model (or start many model calls):

| Action | Why it is paid |
| --- | --- |
| Generate a chain with MAGE | Calls the model for generation. |
| Run a chain, including each **test run** while the agent writes a chain | Chain steps may call the model and external tools. |
| Propose a repair | One model call; the original chain does not change. |
| Start an evolution | Many model calls within the budget from the plan. |
| Start dataset generation, run or rewrite a generator program, top up a dataset from chat | Model calls within the budget you set. See [the dataset studio](/care/autobench/overview/). |
| Draft a tool or a skill | One or two model calls; tool code runs only in the sandbox. |
| Translate an idea into English | One small model call. |
| Run a CLI command with effects through the command bridge | The command may write or call services. |

Work proceeds only if you allow it. Rejecting or closing the dialog stops the
action before anything is sent. A background job asks once too: approving the
job covers the call inside it.

## Settings changes from chat

*Development line.* When you ask the agent to change a Maestro setting, the
app shows its dialog for that change even though nothing is paid. That
dialog is the confirmation. See [Settings from chat](/care/app/chat/#settings-from-chat).

## Free actions: no Maestro dialog

These do not call a model provider. Maestro adds no dialog for them:

- staging input for a run;
- importing a CSV/TSV/XLSX file from the project folder as an evaluation
  dataset (*development line*);
- editing dataset cases and composing a dataset version (*development line*);
- saving a chain to memory (a new version) and renaming a chain;
- saving a checked tool or skill;
- saving or archiving an idea;
- pushing an idea into a running evolution, or removing that hint;
- cancelling an evolution;
- pause, resume and stop of a running chain;
- pause, stop and extra instructions for a running dataset generation (its
  budget was approved at start);
- everything read-only: plans, searches, validation, reading attached
  documents, reading settings, *My agents*, status, graphs.

Other harness tools (files, shell, web pages and so on) follow the session's
access preset, not these rules.

## Full access: never ask

Each session has an access preset. With **Full access** (*Полный доступ*),
the session never asks, and paid Maestro work also runs **without a
dialog**. Choosing this preset is your standing consent to paid work in that
session. Use it when you trust the session's task and budget. Turning it on
asks you to confirm that you understand the risk.

*Development line.* In earlier builds this preset could block Maestro tools
outright, including free staging, so the agent could not stage or test-run a
chain. Now a Maestro tool under Full access runs without a dialog; a call the
harness denies is still denied.

If the app cannot read the session's approval setting, the paid action is
**refused** with `MAESTRO_APPROVAL_UNAVAILABLE`. Nothing starts. This is not
reported as your rejection.

## Maestro forms count as consent

Some work starts from Maestro's own forms, where you see the parameters before
pressing the button:

- **Start generation** (*Запустить генерацию*) and generator actions in the
  dataset studio, with the budget on screen; topping up a dataset from its own
  screen (from chat it asks);
- **Prepare draft** (*Подготовить черновик*) and **Save to memory**
  (*Сохранить в память*) in the tools and skills workshop.

Pressing the button is the consent for that one call. No second dialog
appears.

## What the agent cannot do

- No Maestro tool accepts an "approved" flag from the model. The agent cannot
  approve its own action.
- The chat model cannot skip the dialog by wording its request differently.
- The agent cannot change API keys, the app lock or the chat model. Keys are
  typed only in the app's own windows.
- Saving on the [MAESTRO settings page](/care/app/settings/) always asks for a
  native confirmation of the exact change.

## Known limit

Form calls are recognised by an identifier that the app's form sets. Whether a
call that did not come from a Maestro form can carry such an identifier (for
example through a custom OpenAI-compatible endpoint you control) has not been
ruled out yet. Until it is, use the app with model endpoints you trust.
