---
title: The IdeaL panel
description: IdeaL inside the Maestro app — turning it on, signing in once with the IdeaL key, projects, the lake radar and graph, run pages, and seeding and steering ideas through the agent.
sidebar:
  order: 5
---

[IdeaL](/ideal/getting-started/overview/) is the idea lake in GigaEvo Memory.
An **idea** is a concrete, reusable change to a chain ("add a step that checks
units before the final answer"). Evolution receives a slate of ideas before
each mutation, and IdeaL records which ideas helped.

:::note[Development line]
The embedded IdeaL panel, the one-time sign-in, projects and the lake radar
are in builds from the current development line, not in a tagged release.
:::

## Turn it on

In **Settings → MAESTRO → Memory and IdeaL** (*Память и IdeaL*):

1. **Memory address** (*Адрес памяти*): the IdeaL stand's API, ending in
   `/api` (for example `https://…/api`). If you paste the address of an
   IdeaL page instead, Maestro keeps only its `/api` root.
2. **Chain memory** (*Память цепочек*) → **IdeaL (ideas and learning from
   evolutions)**.
3. **IdeaL namespace** (*Пространство IdeaL*): the namespace your key may use
   (Latin letters, digits, `.`, `-`, `_`, `:`; case-sensitive). On a stand
   with projects you may leave it empty and set **IdeaL project** (*Проект
   IdeaL*) instead, or leave both to the automatic choice (below).
4. Save, then fully quit and reopen the app.

The same switches as configuration: `CARE_MEMORY__RETRIEVAL_BACKEND=ideal`,
`CARE_MEMORY__IDEAL_NAMESPACE=<ns>` and, on stands with projects,
`CARE_MEMORY__IDEAL_PROJECT=<slug or id>`.

## Sign in once

The IdeaL key is entered **in one place**: the sign-in page of the IdeaL
panel. There is no key field on the settings page; it only shows whether a
key is saved.

1. Press **IdeaL** in the sidebar. Without a saved key, IdeaL shows its own
   sign-in form.
2. Enter your key. When IdeaL accepts it, Maestro keeps it as its memory
   key: for generation, *My agents* and the next launches. With the default
   file secret store it is written to the app's `.env`
   (`~/Documents/Maestro/.env` for the packaged app, mode `0600`).
3. Next time the panel opens without the sign-in form.

If the key is later revoked or wrong, *My agents* and the panel say so and
point you back to the IdeaL sign-in. Never paste the key into chat; the agent
never asks for it.

## What the panel shows

The panel shows IdeaL's own web interface inside Maestro, as it is, through a
local gateway. The header has:

| Control | What it does |
| --- | --- |
| **Lake** (*Озеро*) | The radar of the whole lake: every idea of the namespace, the most proven ones closest to the centre. On a stand with projects: the project's ideas as a list. |
| **Graph** (*Граф*) | The lake graph: ideas, evolution runs and their links. |
| ↻ | Reload the page. |
| **In browser** (*В браузере*) | Open the same IdeaL page in your browser. There you sign in with the key yourself. |
| **Close** (*Закрыть*) | Close the panel. |

The header also names the namespace, or the project and how many projects
the key has.

If the IdeaL server has no lake radar, the panel opens the latest run's page;
if there are no runs yet, the graph.

### Projects

On IdeaL stands with organisations and projects, Maestro works in one
**active project**. Unless you set *IdeaL project*, it picks the key's only
project, else the project whose lake is your namespace, else the first one.
To switch, set the project's slug or id in **Settings → MAESTRO → IdeaL
project**; the list of projects is in the IdeaL console. A user key of such a
stand reads only its project's lake; generation recall then runs without
IdeaL hints and *My agents* says why.

## A run's page

Every evolution card in chat, every evolution row in
[Activity](/care/app/activity/) and the *Evolutions of this chain* list in
[My agents](/care/app/library/) have **Radar in IdeaL** (*Радар в IdeaL*).
It opens that run's page in the panel: the idea radar, the mutation feed and
idea hints. How to read it: [the radar in detail](/ideal/maestro/radar/).

If the server does not hand out run pages, the panel shows the run in the
IdeaL console instead, or says that the page is unavailable.

## Ideas through the agent

You can ask the agent in chat:

- *"Seed ideas for the receipt-sum task"* (*засей идеи*): it looks at what
  the lake already has, researches techniques, drafts 5–8 concrete ideas in
  English, checks them against existing ones and shows you a table. It saves
  **only after you approve the list**: the lake is shared by everyone in the
  namespace. See [seeding the lake](/ideal/maestro/seeding/).
- *"How is the evolution going, which ideas worked?"*: a summary of the
  run's radar (best score, ideas versus control, applied ideas).
- *"What is in the lake?"*: the most proven ideas with their counts.
- *"Which evolutions did this chain have?"*
- *"Push idea X into the running evolution"* (*подсунь идею*): IdeaL puts
  the idea into every next slate of that run until a mutation applies it.
  Such forced mutations do not count toward the idea's rating. Ask to remove
  the hint to cancel it.

Lake search works in English only. If you describe an idea in another
language, the agent can translate it with one small paid model call (one
confirmation). Saving, archiving an idea and pushing it into a run are free.
There is no delete: an archived idea stops being given to evolution and
keeps its history.

## With IdeaL on

- generation recall comes from the IdeaL catalog of that namespace;
- saved chains are read and written in that namespace;
- evolution runs get the namespace and a stable **task key**, so the platform
  takes idea slates from IdeaL and reports outcomes back. Runs of the same
  task share their experience;
- with **Read only** memory nothing is written: no ideas, and evolution runs
  without IdeaL memory.

## Limits

- The panel needs a memory address with the `/api` suffix: a bare API port
  has no IdeaL interface next to it.
- The panel shows IdeaL's own pages; their controls belong to IdeaL. See the
  [IdeaL documentation](/ideal/getting-started/overview/).
- An IdeaL server without signed run pages cannot open a run's page.

## See also

- IdeaL side: [Connect Maestro to IdeaL](/ideal/maestro/connect/),
  [the radar in detail](/ideal/maestro/radar/),
  [seeding the lake](/ideal/maestro/seeding/).
- [Evolution](/care/workflows/evolution/).
