---
title: Ideas and the IdeaL radar
description: Working with IdeaL ideas in the Maestro app — the ideas graph, adding and archiving ideas, the per-run radar and steering a running evolution.
sidebar:
  order: 3
---

[IdeaL](/ideal/getting-started/overview/) is the idea lake in GigaEvo Memory.
An **idea** is a concrete, reusable change to a chain ("add a step that checks
units before the final answer"). Evolution receives a slate of ideas before
each mutation, and IdeaL records which ideas helped. Maestro shows this in the
app and lets you add ideas and steer a running evolution.

## Turn it on

In **Settings → MAESTRO**:

1. **Chain memory** → **IdeaL**.
2. **IdeaL namespace**: the namespace your key is allowed to use (Latin
   letters, digits, `.`, `-`, `_`, `:`; case-sensitive).
3. Save and fully restart the app.

The same switches exist as configuration:
`CARE_MEMORY__RETRIEVAL_BACKEND=ideal` and `CARE_MEMORY__IDEAL_NAMESPACE=<ns>`.

With IdeaL on:

- generation recall comes from the IdeaL catalog of that namespace;
- saved chains are read and written in that namespace;
- evolution runs get the namespace and a stable **task key**, so the platform
  takes idea slates from IdeaL and reports outcomes back. The task key comes
  from the task description (else the seed chain), so runs of the same task
  share their experience;
- when memory is **read-only**, nothing is written: no ideas, and evolution
  runs without IdeaL memory.

## The Ideas section

Open **Library → Ideas** with a session open. You see:

- the **ideas graph**: evolution runs on the left (newest first), ideas and
  tools in the middle (used ones first), best chains on the right. Circle size
  is how often an idea was given to evolution; colour is its IdeaL rating;
  hover a node to highlight its links;
- a **search** over ideas;
- the **memory map** of the namespace.

You can view another namespace, but ideas change only in the configured one.

## Add, edit, archive

**Add idea** (*Добавить идею*) opens a form with name, description, when to use it and an
optional topic.

1. **Check** (*Проверить*) looks for similar ideas in the namespace and points out obvious
   problems, such as a description that repeats the name.
2. IdeaL search works in English only. If the text is not English,
   **Translate to English** (*Перевести на английский*) asks the chat model for an English version (one
   small paid request). You see the result and decide what to save.
3. **Save idea** (*Сохранить идею*). The new idea appears on the graph as an idea without
   experience.

An **edit** saves a new version and only succeeds if nobody changed the idea
since you opened it. **Archive** (*В архив*) stops giving the idea to evolution; its
history stays. **Restore** (*Вернуть из архива*) brings it back. There is no delete.

Pressing a button in this form counts as your consent for that call; there is
no extra dialog. See [Confirmations](/care/app/confirmations/).

## The run radar

The **radar** shows one evolution run as IdeaL sees it:

- ideas around the task: the closer to the centre, the closer the idea is to
  the task; nearby ideas form **topic** sectors; colour is the idea's effect
  in this run;
- the best-score curve;
- **ideas versus control**: mutations with ideas compared to mutations
  without them. With few mutations the panel warns that the difference may be
  random;
- the latest mutations.

Open it from:

- a run node in the ideas graph;
- an evolution card in chat or the progress dock;
- an evolution row in [Activity](/care/app/activity/);
- the *Evolutions of this chain* list on a chain card in the
  [Library](/care/app/library/).

While the run is going, the radar refreshes every 5 seconds. A run that has
not updated for a long time is shown as interrupted, with its summary only.

## Steer a running evolution

In the radar's idea details, **Push into next mutations** (*Подсунуть в следующие мутации*; only for a running
run) tells IdeaL to put this idea into every next slate until some mutation
applies it. Such forced mutations do not count toward the idea's rating.
**Remove hint** (*Снять подсказку*) cancels it. This is free and needs no dialog.

You can also ask the agent in chat to show a run's radar, list a chain's
evolutions, or push an idea into a running evolution.

## Limits

- An IdeaL server without the signed run-link endpoint shows
  *radar unavailable on this server version*.
- The ideas graph is trimmed when it has too many nodes for one screen.

## See also

- IdeaL side: [Connect Maestro to IdeaL](/ideal/maestro/connect/),
  [the radar in detail](/ideal/maestro/radar/),
  [seeding the lake](/ideal/maestro/seeding/).
- [Evolution](/care/workflows/evolution/).
