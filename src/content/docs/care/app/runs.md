---
title: Runs, pause and repair
description: Running a chain in the Maestro app — input, pause, resume and stop, repair after a failure, and background jobs.
sidebar:
  order: 6
---

## Running a chain

Ask the agent to run a chain: one just built, one staged in this session,
or a saved one from [My agents](/care/app/library/). You can paste the input
or attach files; the agent reads attached documents first (see
[Attaching files](/care/app/chat/#attaching-files)). Maestro runs **exactly** that chain artifact
(pinned by its SHA-256) with the input you gave. Execution calls the model
for every model step (the chat model, or the custom chain model from
Settings), so it asks for one confirmation (unless the session uses
the **Full access** preset).

**Input.** If the chain declares an input contract, your input is checked
against it before the run. When the shape does not match, the agent can show
an adaptation preview: fields are moved only by explicit paths. There is no
type coercion, no defaults and no silently dropped fields. A mismatch that
cannot be resolved stops before any paid call.

**Result.** The run card shows each step's status and a bounded preview of its
output or error (up to 4,000 characters of output and 1,000 of error per step,
12,000 per chain). These are previews, not full outputs.

**Stop on first failure.** *Development line:* in the app a run stops at the
first failed step by default, so later steps do not spend model calls on an
empty result. The saved chain is not changed; this applies to the run only.
A chain that sets `fail_fast` itself, or asks for a replan policy, keeps its
own choice. Running steps finish and are not rolled back.

**Failed run card.** A failed run is shown as failed even if some final
output exists. The card says in plain words what went wrong at the failed
step (for example, which parameter did not get a value), colours the progress
red and marks later steps as **Skipped** (*Пропущен*). **More** (*Подробнее*)
shows the error code, the redacted error text, the request id and the call
log.

**Checked by a run.** A chain card says *Checked by a run* (*Проверена
запуском*) only after a successful run of that exact chain in the session.

## Pause, resume, stop

A running execution has **Pause** (*Ⅱ Пауза*), **Resume** (*▶ Продолжить*)
and **Stop** (*Остановить*) on its card.

- Pause works **between steps**. A model call already in progress is not
  interrupted. *Pause requested* means running steps are finishing; *paused*
  means no step is active.
- Resume continues the same run. Nothing is replayed or re-admitted.
- Idle paused time does not count toward the chain timeout; active step time
  does.
- Only the session that started the run can control it.
- Pause is held in the app process. It does not survive an app restart and
  stays within the 15-minute limit of the original tool call.
- A stopped run keeps a snapshot of the steps it observed and is not reported
  as a success.

These controls are free and need no dialog.

## Repair after a failure

When a run fails at a precise step, the agent **proposes one repair right
away**, without waiting to be asked (*development line*). The run card also
has **Repair chain** (*Исправить цепочку*), which drafts the same request.
Repair:

- takes the failed run's receipt from the same session;
- proposes a corrected chain (paid: one model call, one confirmation);
- **never runs** the proposal and **never changes** the original chain.

The proposal is marked as unverified. The agent shows what changed and offers
to run the new version; that run is a separate execution with its own
confirmation. Keep the original chain and the failed result for comparison.

The agent does not repair provider, network or cancellation errors, and does
not repair a run that succeeded but gave an unsatisfying answer. Describe
what to change instead.

## Background jobs

Long work can be moved to the harness job list. Ask the agent to run
generation, execution, repair or evolution *in the background*. The job then
appears in the standard jobs panel, in [Activity](/care/app/activity/) and in
the progress dock.

- A background job still asks for confirmation once (the same rule as a direct
  call; the app does not ask twice).
- Killing a job stops generation, execution or repair. For evolution it waits
  until the platform has assigned the run id and then cancels the evolution.
- A repair job's result is a proposal; it is never executed automatically.
- Jobs live in the app process and are lost on restart.
- The chat hides the bookkeeping of Maestro jobs (status polls, completion
  notices); the operation's own card shows the result. The progress dock has
  **Stop** (*Остановить*) for a running background job.

## Timeouts and duplicates

- Each Maestro tool call has a 15-minute limit, also inside background jobs.
  On expiry the call is cancelled. This is not a cost budget.
- A repeated generation request with the same idempotency key, up to 15
  minutes after the first one completed, returns the earlier result instead
  of paying again. This ledger lives in the app
  process; a restart or a new key can start new paid work.
- A timeout or a cancellation does not prove the provider billed nothing.
  Check the existing job or result before starting the same work again.

## Saving

Ask the agent to save a chain. Saving writes a **new version** to memory and is
free (no dialog). The chain then appears in [My agents](/care/app/library/).
With read-only memory, saving is refused.

## Known limits

- Pause, background jobs and run ownership do not survive an app restart.
