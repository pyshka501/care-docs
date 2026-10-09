---
title: Ideas in the Library
description: The Ideas section of the Maestro Library. The IdeaL graph, the memory map, adding and editing ideas with the idea form, translation to English, duplicate checks, archive and restore.
sidebar:
  order: 2
---

The **Library** in the Maestro sidebar has an **Идеи** (Ideas) section. It
is useful when the chain memory is IdeaL and a namespace is set (see
[Connect](/ideal/maestro/connect/)); without a namespace the graph says that
no idea space is selected, and the map shows shared memory without idea
experience.

The section acts on behalf of the open session, so it needs one: with no open
session the panel says so. Writes and paid actions keep that session's
approval path.

The section has two parts: the **IdeaL graph** (Граф связей) and the
**memory map** (Карта памяти).

## The IdeaL graph

The graph shows how ideas were used in evolution, in three lanes:

| Lane | Nodes |
| --- | --- |
| Left | Evolution runs, newest first. Diamond: green is running, yellow stalled, grey finished. |
| Middle | Ideas (circles) and tools (squares). Used ones first. Circle size is how often evolution received the idea; colour is the IdeaL rating, red to green; light circle with grey label means no experience yet. |
| Right | Best chains of runs. |

Hover a node to highlight its links; wheel zooms, drag pans. Use the
namespace selector to view another namespace your key can read. Other
namespaces are view-only ("только просмотр").

Click a node to open its panel:

- **Idea**: description, origin and source, related runs and chains, and the
  buttons **Изменить** (edit), **В архив** (archive) or **Вернуть из архива**
  (restore).
- **Run**: its mutation timeline: which ideas each mutation received and
  cited, control slates, deltas, focus.

When the server publishes `/v1/ideal/graph`, the graph comes from the server.
On older servers Maestro builds a simpler graph itself and says so in the
tooltip.

## The memory map

Below the graph, the memory map summarises the namespace:

- counters: ideas (and how many are active), ideas with experience,
  mutations counted by IdeaL, evolution runs, chains, tools and skills;
- **Идеи против контроля**: success rate and mean delta of mutations with
  ideas and of control mutations. Under about 60 mutations the app warns that
  the difference may be chance;
- **Озеро идей**: ideas as dots grouped by topic, with search. Hollow dot is
  no experience; size is how often the idea was delivered; fill is the share
  of successful uses; an outer ring means it was on a winning path;
- **Граф идей**: ideas ranked by IdeaL rating, linked to the runs that used
  them. Green link: applications mostly improved; red: mostly worsened;
  dashed: delivered but never applied;
- **Эволюция: идеи → запуски → задачи**: ideas on winning paths, the runs and
  the tasks they served.

Select an idea to see its card: delivered, applied, successful, median gain,
path wins, IdeaL rating (gain rate), strength, tasks with experience, and the
IdeaL `efficacy` line once there is enough evidence.

## Add an idea

Press **Добавить идею** above the graph. The button appears only when the
namespace is the configured one, memory is not read-only and the server
accepts new ideas.

The idea form has these fields:

| Field | Rules |
| --- | --- |
| Название (name) | 3–160 characters. |
| Что изменить и как (description) | 10–2000 characters. Must not just repeat the name. |
| Когда применять (when to use) | Up to 600 characters. An observable condition. |
| Тема (topic) | Optional. Lowercase Latin, digits, `-`, `_`, up to 40 characters. Saved as tag `topic:<topic>`. |
| Подпись темы (topic label) | Optional display label, up to 60 characters. |
| Источник (source) | Optional: paper, practice, run. |

Then:

1. **Проверить** (check). Maestro looks for problems, non-English text and
   similar ideas in the namespace. Similar means word overlap with an
   existing idea, or a strong catalog search hit. An idea with the same name
   blocks saving; if that twin is archived, restore it instead.
2. **Перевести на английский** (optional). One small request to your chat
   model returns an English name, description and when-to-use. The fields are
   replaced; the note shows the model and tokens used. Nothing is saved yet.
   Check the text and fix it if needed.
3. **Сохранить идею** (save). If the check found similar ideas, tick
   **Это другая идея — сохранить всё равно** first, and only if it really is
   a different change.

A new idea is saved as active, with `origin: user`, and appears on the graph
as an idea without experience. Whether it works is decided by later runs.

:::note[Write in English]
IdeaL search is English-only. A Russian idea is accepted, but evolution and
generation will rarely find it. The check warns about this; the translate
button fixes it.
:::

## Edit an idea

**Изменить** opens the same form with the current text. Saving creates a
new version of the same idea (**Сохранить новой версией**). The idea keeps its
id and its rating. If someone changed the idea after you opened it, the save
is refused: reopen and repeat the edit. An archived idea stays archived after
an edit.

## Archive and restore

**В архив** sets the idea's status to `archived`: evolution and generation
stop receiving it; history and ratings stay. **Вернуть из архива** makes it
active again. Maestro has no delete for ideas.

## Buttons and approvals

The form buttons (translate, save, archive) do not show an extra approval
dialog: pressing the button is the consent. The same actions requested by the
agent in chat (`maestro_idea_translate`, `maestro_idea_save`,
`maestro_idea_set_status`) go through the normal tool approval.

## Agent tools behind the section

| Tool | Does |
| --- | --- |
| `maestro_ideal_namespaces` | Namespaces the key can read, server capabilities, read-only flag. |
| `maestro_ideal_graph` | The graph of a namespace. Read-only. |
| `maestro_ideal_run_timeline` | One run's mutation timeline. Read-only. |
| `maestro_ideal_chain_runs` | Evolution runs of one saved chain, matched by its task key. Read-only. |
| `maestro_idea_get` | One idea with its `version_id`, for editing. |
| `maestro_idea_check` | Problems, `non_english`, similar ideas, exact duplicate. Read-only. |
| `maestro_idea_translate` | English version via the chat model. One small paid call; saves nothing. |
| `maestro_idea_save` | Create, or save an edit as a new version (`entity_id` + `base_version_id`). |
| `maestro_idea_set_status` | `active` or `archived`. |
| `maestro_memory_rename_chain` | Save a chain as a new version under a readable name. |

Writes go only to the configured namespace and are refused in read-only mode.
