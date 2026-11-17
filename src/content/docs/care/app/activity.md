---
title: Activity
description: The Activity panel — Maestro work from all sessions, failure reasons, evolution progress, dataset generation runs and evolution runs kept by IdeaL.
sidebar:
  order: 7
---

The **Activity** button (*Активность*) in the sidebar lists Maestro work from
**all sessions**:

- chain generation;
- chain execution;
- chain repair;
- evolution;
- dataset generation (*development line*: listed in its own *Datasets*
  (*Наборы данных*) group with **Open dataset** (*Открыть набор*)).

Both background jobs and direct calls from chat are listed. The button shows a
counter: running tasks, or new failures since you last opened the panel.

## What a row shows

- the operation and its state: running, done, failed, stopped;
- the session and when it started; **Open session** jumps to it;
- for evolution: generation *N* of *M*, the best score and the baseline score;
  **Radar in IdeaL** (*Радар в IdeaL*) opens the run's page in the
  [IdeaL panel](/care/app/ideas/);
- for a failure: a short reason in plain words or a typed error code
  (`MAESTRO_*`, `CARL_*`, `MAGE_*`). Raw provider text is never shown. For the
  full answer, open the session.

Examples of reasons: the chain ran but its steps returned an error; the wait
timed out and the provider's result is unknown (check before running again);
the evolution platform did not confirm the start; the confirmation settings
could not be read, so nothing started.

The open panel refreshes every 5 seconds and reads the status of up to five
running direct evolutions.

## Evolutions kept by IdeaL

When IdeaL is the chain memory, the top of the panel also lists recent
evolution runs of the configured namespace from IdeaL itself: newest first,
with status, best score, mutation count and **Radar in IdeaL**. These are
stored on the memory server and **survive an app restart**. Runs already shown
from this app process are not repeated. See [The IdeaL panel](/care/app/ideas/).

## Limits

The main list is kept in the app process: it holds up to 100 entries, shows
the newest 50, and **starts empty after a restart**. Dataset generation runs
are the exception: they are kept on disk and come back after a restart. Use
the session itself, or the IdeaL list for evolutions, to find older work.
