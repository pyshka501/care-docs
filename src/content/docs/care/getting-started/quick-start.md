---
title: Quick Start
description: Install Maestro, open the desktop app, set the chat model and build your first agent. CLI and TUI quick start at the end.
sidebar:
  order: 2
---

This page takes you from a fresh machine to a first built and executed
agent (chain) in the Maestro desktop app. The CLI/TUI path is at the end.

## Prerequisites

- **macOS on Apple silicon** for `Maestro.app`. The bundle is arm64 only.
  Running the app from a source checkout uses the platform WebView elsewhere,
  but macOS is the tested target.
- An API key for a model provider you will use in chat. The default is
  **OpenRouter**; other providers the chat-model settings offer, an
  OpenAI-compatible endpoint, or (*development line*) a ChatGPT Plus/Pro
  subscription also work.
- Optional: a running **GigaEvo Memory** (to save chains; local default
  `http://localhost:8002`), a **GigaEvo Platform** (to evolve chains; local
  default `http://localhost:8000`), and **Docker** (the default sandbox for
  skills and for checking tools in the workshop).

## 1. Install and open the app

### Option A: `Maestro.app`

Open `Maestro.app`. An ordinary launch needs no Python, Node.js or other
checkout: the bundle carries its own runtime. The build is ad-hoc signed and not
notarised, so macOS may ask you to confirm the first launch of a downloaded copy.

To build the bundle yourself, follow `packaging/macos/README.md` in the
Maestro repository. It needs a macOS framework Python (py2app does not work
with uv's standalone Python). From the repository root:

```bash
uv venv --python /opt/homebrew/bin/python3.12 .venv-py2app
uv pip install --python .venv-py2app/bin/python -e '.[macos-app,dev]'
.venv-py2app/bin/python packaging/macos/setup.py py2app
.venv-py2app/bin/python packaging/macos/verify_bundle.py
codesign --verify --deep --strict --verbose=2 dist/Maestro.app
```

The build also needs the prepared harness runtime files and the CARL
source; the packaging README lists them and how to produce them.

### Option B: from a source checkout

Requires Python 3.12 or 3.13 and [`uv`](https://docs.astral.sh/uv/).

```bash
uv sync --extra desktop
uv run maestro            # same as: uv run maestro app
```

Plain `uv sync` does not install the `desktop` extra; run the command above
once. A source launch also needs the pinned harness runtime. Maestro looks for
it in this order: an explicit flag or environment variable, the runtime inside
an installed `Maestro.app`, a built runtime checkout next to the Maestro
repository, then an executable on `PATH`. If none is found, the launch stops
with a message that says what to install. The developer flags that point at
a runtime are listed in `maestro app --help`; the packaging README says where
to get the runtime source.

A runtime version different from the pinned one stops the launch.

The app opens a native window. Nothing is opened in a browser; the harness
listens only on a random `127.0.0.1` port inside that window. Closing the
window stops it.

## 2. Choose a project folder

On the start screen, choose a project folder (*Выберите папку проекта*).
Sessions belong to a project folder, and files you attach in chat are saved
into it. Actions in *My agents* that open a session also need one.

The packaged app keeps its own settings file `.env` in `~/Documents/Maestro`
unless you start it from a terminal in another folder.

## 3. Set the chat model

On first launch the app asks for an **OpenRouter** key. To use another
provider, open **Settings → Chat model** (*Модель чата*), add it, enter its
API key and pick the models you want in the model selector. To use a ChatGPT
subscription instead of a key, sign in in **Settings → Codex**. The key stays
inside the app's harness and is not written to Maestro's configuration files.

This is the only model you need for the desktop app. Writing and running
chains, generation, repair, dataset work, tool and skill drafts and idea
translation all use the model selected in the current chat, unless you set a
custom chain model in Settings → MAESTRO. Do not paste keys into chat.

## 4. Connect memory and evolution (optional)

Open **Settings → MAESTRO**. Here you set:

- **Memory address**; **Chain memory**: library search or **IdeaL** with a
  namespace or project. The IdeaL key is entered once, on the sign-in page of
  the IdeaL panel in the sidebar;
- under **Advanced**: **Read only** for a shared store, the evolution
  platform address and its mutation and validation models, web research, and
  the app lock;
- at the top: who writes chains, how the agent clarifies the task, and
  which model does chain work.

Other keys are entered in a native secure-text dialog. By default they are
stored in Maestro's own owner-only files, not in the Keychain
(`CARE_SECRET_STORE`). Every save asks for a native confirmation and
**requires a full restart** of the app. See [Settings](/care/app/settings/).

## 5. Build your first agent

Press **New agent** (*Новый агент*) and describe the task in plain words, or
pick a starter card under the input field:

```text
Make an agent that takes a customer review and returns its sentiment
(positive, neutral or negative) with a one-line reason.
```

The agent studies the request and asks for what is missing in a question
card (input, output format, quality criterion). Pick an option or type your
own answer. Then it shows a short brief and builds the chain.

By default the chat agent writes the chain itself and **test-runs** it on a
realistic input. A test run calls the model, so the app shows **one
confirmation dialog** for it. You get a chain card with the step graph and the
label *Checked by a run* once the test succeeded. (With **Who writes chains →
MAGE**, the generator builds the chain instead, one dialog for the
generation, and the chain is *Not checked by a run*.)

Then ask it to run on your input:

```text
Run it on: "Delivery was late, but support fixed everything in ten minutes."
```

Execution asks once more. The result card shows each step's output preview.
While a run is going you can pause, resume or stop it from the card.

If you have Memory configured, ask *"save this agent"*. Saving is free and
needs no dialog. It then appears in **My agents**.

To skip all dialogs for paid work in one session, choose the **Full access**
preset for that session. See [Confirmations](/care/app/confirmations/).

## Next steps

- [The desktop app](/care/app/overview/): sessions, strategies, cards and the progress dock.
- [Chat](/care/app/chat/) and [Building an agent](/care/app/agents/).
- [My agents](/care/app/library/): saved chains, datasets, tools and skills.
- [Datasets](/care/autobench/overview/) and [evolution](/care/workflows/evolution/).

---

## Quick start: CLI and TUI

The CLI and the Textual TUI do **not** use the desktop chat model. They use the
generator settings `CARE_MAGE__*` (provider URL, model, key).

```bash
uv sync
uv run maestro init         # writes ./.env with CARE_MAGE__* settings
uv run maestro doctor       # what is configured, live probes
uv run maestro tui          # Textual TUI
```

`maestro init` writes the API key **in plain text** to `.env`. Non-interactive
form:

```bash
uv run maestro init --non-interactive \
  --api-key "$OPENROUTER_API_KEY" \
  --base-url https://openrouter.ai/api/v1 \
  --model qwen/qwen3-coder
```

Keys in `~/.config/care/config.toml` can be moved to the OS keystore with
`uv run maestro migrate-secrets`.

In the TUI, type a task and press <kbd>Enter</kbd>. In the default
**Interactive** mode Maestro generates a chain, asks before running it and
shows the answer. `/tour` gives a short walkthrough. Modes are described in
[Interactive and Production](/care/workflows/modes/).

One-shot from the shell:

```bash
uv run maestro generate "Classify review sentiment" --save sentiment
uv run maestro run <chain_id> --execute --task "Delivery was late, support was great"
```

See the [CLI reference](/care/cli/overview/).
