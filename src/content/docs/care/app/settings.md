---
title: Settings and language
description: What the Maestro app settings control — the chat model and ChatGPT sign-in, the MAESTRO page (who writes chains, clarifications, chain model, memory and IdeaL, evolution, app lock), where keys are stored, restarts and the Russian interface.
sidebar:
  order: 9
---

Open settings with the gear icon. The sections Maestro users need:

| Section | What it holds |
| --- | --- |
| **Chat model** (*Модель чата*) | Providers, keys and models for chat. By default this model also does Maestro's chain work. |
| **Permissions** (*Права*) | The default access preset for new sessions. See [Confirmations](/care/app/confirmations/). |
| **MAESTRO** | Who writes chains, clarifications, the chain model, memory and IdeaL, the evolution platform, the app lock. |
| **Codex** | *Development line.* Sign in with a ChatGPT subscription. |

## Chat model

Add a provider, enter its API key and choose the models offered in the model
selector under the input field. The default provider is **OpenRouter**; on
first launch the app asks for its key. With **Chain model → As in chat**
(the default), the model selected in a chat is used for that chat's chain
writing, generation, execution, repair, dataset work, workshop drafts and
idea translation. Maestro reaches it through a private local bridge and never
copies the key into its own files.

## Codex: a ChatGPT subscription

*Development line.* The **Codex** section (*Codex: подписка ChatGPT*) lets you
use OpenAI models through your ChatGPT Plus or Pro subscription.

1. Press **Sign in with ChatGPT** (*Войти через ChatGPT*). The system browser
   opens the ChatGPT sign-in page.
2. Finish the sign-in there. If the page does not return to Maestro, paste
   the address from the browser bar or the code into the field and press
   **Send** (*Отправить*).
3. The models appear in the model selector in the group `openai-codex`
   (if the section says so, first add the `openai-codex` provider in
   **Chat model**).

This sign-in is separate from the Codex CLI and does not sign it out. The
credential stays in the harness's own store. Chain work on such a model comes
out of your subscription limits. **Sign out** (*Выйти*) removes it. If the
section says sign-in is not available in this build, the bundled runtime does
not support it.

## The MAESTRO page

*Development line.* The page is in Russian and is titled *Chains, memory and
evolution* (*Цепочки, память и эволюция*). Rarely used options are under
**Advanced** (*Расширенные*), collapsed by default.

### Chain generation (*Генерация цепочек*)

| Field | Choices | What it does |
| --- | --- | --- |
| **Who writes chains** (*Кто пишет цепочки*) | **Agent** (default), **MAGE** | Agent: the chat agent writes, test-runs and fixes the chain. MAGE: the generator builds it without running it. See [Building an agent](/care/app/agents/). |
| **Clarify before building** (*Уточнения перед сборкой*) | **Manual: ask for what is missing** (default), **Automatic: decide yourself** | Whether the agent asks question cards or states its assumptions. See [Clarifying questions](/care/app/chat/#clarifying-questions). |
| **Chain model** (*Модель для цепочек*) | **As in chat** (default), **Custom model** (*Своя модель*) | As in chat: chain generation, execution and repair run on the chat's model, no separate key needed. Custom: they run on the model below, whatever the chat uses; the page then shows **Provider**, **Address**, **Model** and **Key**. |
| **Generation mode** (*Режим генерации*) | **Fast**, **Deep** | For MAGE. Deep takes longer and costs more but checks the chain structure more carefully. |

### Memory and IdeaL (*Память и IdeaL*)

| Field | What it does |
| --- | --- |
| **Memory address** (*Адрес памяти*) | The memory API. For a hosted stand include `/api`, for example `https://…/api`; a pasted IdeaL page address is cut to its `/api` root. Local default: `http://localhost:8002`. |
| **IdeaL key** (*Ключ IdeaL*) | Shows only whether a key is saved. The key is entered once, on the sign-in page of the [IdeaL panel](/care/app/ideas/#sign-in-once). |
| **Chain memory** (*Память цепочек*) | **Library search** (*Поиск по библиотеке*) or **IdeaL (ideas and learning from evolutions)**. Chat facts stay in local memory either way. |
| **IdeaL namespace** (*Пространство IdeaL*) | Shown with IdeaL. Latin letters, digits, `.`, `-`, `_`, `:`; case-sensitive. Required unless a project is set. |
| **IdeaL project** (*Проект IdeaL*) | On stands with projects: a project slug or id. Empty means automatic: the key's only project, else the one with the namespace above, else the first. |

### Advanced (*Расширенные*)

| Group | Fields |
| --- | --- |
| **Memory** | **Read only**: never write to this memory (for shared and hosted stands). No saved chains, tools, skills or ideas; evolution runs without IdeaL memory. |
| **Research during generation** (*Исследование при генерации*) | **Web search** provider and **Search key**; **Search the web during generation**, **Search memory during generation**. DuckDuckGo needs no key. |
| **Evolution platform** (*Платформа эволюции*) | **Platform address** and **Platform key**; the **mutation model** (address, model, key) and the **validation model** (address, model, key). The platform calls these models itself. |
| **Fallback model for evolution** (*Запасная модель для эволюции*) | Shown when Chain model is *As in chat*: Provider, Address, Model, Key. The platform uses it if the mutation and validation models are not set. It does not affect chain work in the app. |
| **Lock at launch** (*Блокировка при запуске*) | **App lock**: **Off** (*Выключена*) or **Touch ID only** (*Только Touch ID*). Applies from the next launch; password fallback is disabled. `MAESTRO_APP_LOCK_MODE` (`disabled` or `touch-id`) forces it for one launch, and the page then shows it as set by the environment. |

### How saving works

1. Edit the fields and press **Save…** (*Сохранить…*). The page lists
   **What will change** (*Что изменится*).
2. Keys are never typed into the page. **Set** (*Задать*) or **Replace**
   (*Заменить*) opens a native secure-text dialog; the page only gets a
   short-lived handle. **Delete saved key** (*Удалить сохранённый ключ*)
   clears one.
3. **Confirm** (*Подтвердить*) opens a native confirmation of exactly that
   change. Nothing is saved without it.
4. After any save, **fully quit and reopen** the app. The running agent keeps
   the settings it loaded at start.

Changing an endpoint or a search provider while keeping its old key is
refused: replace or clear the key in the same save, so a key cannot silently
move to another provider.

You can also ask the agent to read or change these settings in chat (not
keys and not the app lock). See [Settings from chat](/care/app/chat/#settings-from-chat).

## Where keys are stored

*Development line.* `CARE_SECRET_STORE` selects one store for the whole app:

| Value | Where keys live |
| --- | --- |
| `file` (default) | No Keychain. Maestro settings write key values into the app's `.env` (`~/Documents/Maestro/.env` for the packaged app) and `~/.config/care/config.toml`, both owner-only (`0600`). Chat-model keys stay in the harness's own owner-only credentials file. No system prompts, but any process running as your macOS user can read these files. |
| `keychain` | The earlier behaviour: the files hold `keystore://` references and the values live in the macOS Keychain. A save fails rather than write a key in plain text. |

Set it in the shell or in the app's `.env`, for example
`CARE_SECRET_STORE=keychain`. On the first launch with `file`, the app
replaces every `keystore://` reference in those two files with its value,
reading each item once without a dialog; Keychain items are not deleted. A
reference that cannot be read is cleared with a warning; enter that key again
in Settings → MAESTRO. Chat-model keys kept by the optional Keychain provider
are not copied: enter them once in **Chat model**.

The settings page shows where a saved key is: *Set (in MAESTRO files)* or
*Set (in keychain)*.

The same settings can be set with `CARE_*` environment variables; see
[Configuration](/care/configuration/overview/).

## Interface language

The interface follows the system language, or the language you choose in the
harness settings. Maestro adds a **Russian** language pack to the harness: the
sidebar, chat, model selection, permissions and approvals, jobs, questions,
settings and other shell screens (about a thousand strings). Rarely used
harness screens fall back to English.

Maestro's own panels (My agents, IdeaL, Activity, the Session tab, result
cards, confirmation texts) and the **MAESTRO** settings page are in Russian.

The language of chain answers is a separate setting for the CLI and TUI:
`CARE_DEFAULTS__LANGUAGE` (`en` or `ru`).
