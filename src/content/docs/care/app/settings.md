---
title: Settings and language
description: What the Maestro app settings control — the chat model, the MAESTRO page (memory, IdeaL, research, evolution, app lock), restarts, and the Russian interface.
sidebar:
  order: 7
---

The app has two places for configuration:

- **Settings → Chat model** (harness settings): providers, keys and models for
  chat. In the desktop app this model also does all of Maestro's model work.
- **Settings → MAESTRO**: Maestro's own configuration (memory, IdeaL, web
  research, evolution platform, app lock).

## Chat model

Add a provider, enter its API key and choose the models offered in the model
selector. The model selected in a chat is used for that chat's generation,
execution, repair, evolution data generation, workshop drafts and idea
translation. The key stays inside the harness. Maestro reaches the model
through a private local bridge and never writes the key to its own files.

## The MAESTRO page

The page is in English. Its sections:

| Section | Fields | What it affects in the desktop app |
| --- | --- | --- |
| **Chain generation** | Provider, Generation mode (`fast`/`deep`), Base URL, Model ID, Generation API key | **Generation mode** applies. Provider, Base URL, Model ID and the key are **not used** by the desktop app: generation uses the chat model. They configure the CLI, the TUI and the legacy workbench. |
| **Research and Memory** | Memory base URL, Read only, Memory API key, Chain memory (default or IdeaL), IdeaL namespace, Web search provider and key, Enable web research, Enable memory research | All apply. |
| **Platform, evolution and validation** | Platform base URL and key, mutation base URL/model/key, validation base URL/model/key, upload key | Evolution runs on the platform with these mutation and validation models. The upload key is used by `/upload` in the TUI. |
| **Unlock on launch** | App lock: Off or Touch ID only | Applies on the next launch. |

The page's own header says it configures "the model used to generate MAESTRO
task chains". In the desktop app that is not the case: generation uses the
chat model. This wording is a known inaccuracy.

Notes on some fields:

- **Memory base URL**: for a hosted store include its API prefix, for example
  `https://…/api`. Local default: `http://localhost:8002`.
- **Read only**: Maestro never writes to this memory. No saved chains, tools,
  skills or ideas, and evolution runs without IdeaL memory. Use it for shared
  or hosted stores you only inspect.
- **Chain memory → IdeaL** needs an **IdeaL namespace** (Latin letters,
  digits, `.`, `-`, `_`, `:`; case-sensitive). See
  [Ideas and the IdeaL radar](/care/app/ideas/).
- **Enable memory research**: before generation, recall related saved chains.
  **Enable web research**: let generation search the web with the chosen
  provider. DuckDuckGo needs no key.
- **App lock** can be forced for one launch with the environment variable
  `MAESTRO_APP_LOCK_MODE` (`disabled` or `touch-id`); the page then shows it as
  controlled by the environment. Password fallback is disabled.

### How saving works

1. Edit the fields and press **Review save**. The page shows the list of
   changes.
2. Keys are never typed into the page. **Replace** opens a native macOS
   secure-text dialog; the page only gets a short-lived handle. Keys are stored
   in the macOS Keychain.
3. **Confirm in native dialog** opens a native confirmation of exactly that
   change. Nothing is saved without it.
4. After any save, **fully quit and reopen** the app. The running agent keeps
   the settings it loaded at start.

The values are written to `~/.config/care/config.toml` and the project
`.env`; keys are stored only as `keystore://` references to the Keychain. If
the OS keystore is not available, the save fails instead of writing a key in
plain text. The same settings can be set with `CARE_*` environment
variables; see [Configuration](/care/configuration/overview/).

## Interface language

The interface follows the system language, or the language you choose in the
harness settings. Maestro adds a **Russian** language pack to the harness: the
sidebar, chat, model selection, permissions and approvals, jobs, settings and
other shell screens (about a thousand strings). Rarely used harness screens
fall back to English.

Maestro's own panels (Library, Activity, the Session tab, result cards,
confirmation texts) are in Russian. The **MAESTRO** settings page is in English
only.

The language of chain answers is a separate setting for the CLI and TUI:
`CARE_DEFAULTS__LANGUAGE` (`en` or `ru`).
