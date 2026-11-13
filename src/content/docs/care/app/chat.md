---
title: Chat
description: Working in the Maestro chat — starting points, clarifying question cards, attaching files and how the agent reads them, diagrams, a running turn, and changing settings from chat.
sidebar:
  order: 2
---

The chat is where you work with Maestro. The agent answers ordinary
questions, reads your files and does chain work through Maestro tools. Most
features on this page are *development line*: they exist in builds from the
current development line, not in a tagged release.

## Starting a conversation

Press **New agent** (*Новый агент*) in the sidebar. A blank session shows
what MAESTRO does in four steps and starter cards below the input field (see
[the start screen](/care/app/overview/#the-start-screen)). A card only fills
the input field; you edit and send it.

Ask *"What can you do?"* (*Что ты умеешь?*) for a short overview by topic,
with one example request each: building agents from a description, running
on your data and files, My agents, datasets, evolution, tools, Maestro
commands (deploy as an HTTP agent, compare versions, check the environment,
export), ordinary work with files and web pages, and settings. The agent
mentions what is switched off in this session.

## Clarifying questions

Before it builds a new chain, an agent, an evaluator or a dataset, the agent
studies what it can find on its own: your request, the whole conversation,
attached files, similar saved chains in Memory, and the real shape of an API
or page you named. It never asks for something it can find out, and never
asks for ids or hashes.

What happens next depends on **Settings → MAESTRO → Clarify before building**
(*Уточнения перед сборкой*):

| Mode | Behaviour |
| --- | --- |
| **Manual: ask for what is missing** (*Ручной: спрашивать недостающее*), default | The agent shows one **question card** with up to four questions (input, output format, sources, quality criterion), each with 2–4 concrete options. Its recommendation comes first and is marked. You can pick an option, type your own answer or skip a question. At most two rounds; after that it builds with the remaining assumptions stated. If nothing material is missing, it does not ask. |
| **Automatic: decide yourself** (*Автоматический: решать самому*) | The agent fills the gaps with sensible defaults and lists them under *Assumptions* before building, so you can correct them. It asks only when it cannot proceed at all, for example when a private file is out of reach. |

Your words override the setting for the current task: *"do it yourself"*
(*делай сам*) works like automatic, *"ask me"* (*спроси меня*) like manual.

After this the agent shows a short brief (input → output, sources, quality
criterion) and goes on building. The brief is not a confirmation: paid steps
are still confirmed by the app dialog. See [Building an agent](/care/app/agents/).

## Attaching files

Attach files with the paperclip in the input field (**Attach file**,
*Прикрепить файл*), by drag and drop, or by pasting.

- **Images** (PNG, JPEG, WebP, GIF) go to the chat model directly, as with
  any image. The model must accept images.
- **Every other file** is saved into the session's project folder under
  `.maestro/attachments/`, and its relative path is added to your message
  under *Attached files (in the project folder)*. A file is never
  overwritten; a name clash gets a new name.
- One file can be up to **20 MB**.

The agent reads such files with Maestro's document reader before answering
about them:

| Format | How it is read |
| --- | --- |
| PDF | Text page by page. A PDF without a text layer (a scan) is reported as such; there is no OCR. Pages without text are counted. |
| Word `.docx`, Excel `.xlsx`/`.xlsm`, PowerPoint `.pptx`, OpenDocument `.odt`/`.ods`/`.odp`, RTF | Plain text. |
| Text formats (`.txt`, `.md`, `.csv`, `.json`, `.yaml`, `.html`, code files and similar) | As UTF-8 text. |
| Old `.doc`, `.xls`, `.ppt` | Not read: re-save as `.docx`, `.xlsx`, `.pptx`. |

Long documents are read in windows (40,000 characters by default), and the
agent continues where it stopped. A file that is damaged or password
protected is reported as unreadable. The agent may quote only what it
actually read.

A spreadsheet of evaluation examples (CSV, TSV, XLSX) can become an
evolution dataset directly: ask the agent to import it. See
[Evolution](/care/workflows/evolution/#a-dataset-from-your-own-file).

## Diagrams

The chat draws fenced `mermaid` code blocks as diagrams: flowcharts,
sequence and state diagrams, Gantt charts, pie charts. The agent uses them
when a picture explains faster than prose, for example a chain's steps and
the data passed between them. **Code** (*Код*) under a diagram shows its
source. If a diagram cannot be drawn, the source code stays with a short
note.

A diagram is an illustration, not proof that anything ran. When the agent
cannot show a chain as a card (for example staging is blocked), it draws the
chain as a flowchart instead and says why.

## While the agent works

- A running turn folds into **Agent is thinking** (*Агент думает*) with only
  its latest action visible. Maestro operation cards (generation, runs,
  evolution, dataset import) stay visible.
- You can type while the agent works. The harness setting *Enter while the
  agent is working* decides whether Enter queues your message (*В очередь*)
  or steers the current turn right away (*Направить сразу*); Cmd/Ctrl+Enter
  does the opposite.
- The agent can open web pages by address. A web search tool is not
  included out of the box.
- Model failures are explained in plain Russian rather than as raw provider
  text.

## The chat column

The chat column follows the window width (between 680 and 1240 px); a width
you set with the drag handle wins. Chain graphs use larger nodes when there
is room and scroll sideways otherwise, with a shadow at the edge where steps
are hidden. New messages and cards fade in, and a running graph step pulses.
All motion is off when the system asks for reduced motion
(macOS: *Reduce motion*).

## Settings from chat

You can ask about and change Maestro settings in words: *"what are my
settings"*, *"which model do chains run on"*, *"switch clarifications to
automatic"*, *"let MAGE write chains"*, *"turn on IdeaL with namespace
team"*.

- Reading settings is free and needs no dialog. The agent sees which keys
  are set, never their values.
- A change shows the app's confirmation dialog; that is the confirmation, the
  agent does not also ask in chat. It changes only what you asked for.
- New values take effect after a **full restart** of Maestro.
- Not through chat: API keys (typed only in the app's own windows), the app
  lock and the chat model itself. The agent tells you where to change them.

## See also

- [Building an agent](/care/app/agents/)
- [Confirmations](/care/app/confirmations/)
- [Settings and language](/care/app/settings/)
