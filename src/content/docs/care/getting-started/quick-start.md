---
title: Quick Start
description: Install Maestro, open the desktop app, set the chat model and build your first chain. CLI and TUI quick start at the end.
sidebar:
  order: 2
---

This page takes you from a fresh machine to a first generated and executed
chain in the Maestro desktop app. The CLI/TUI path is at the end.

## Prerequisites

- **macOS on Apple silicon** for `Maestro.app`. The bundle is arm64 only.
  Running the app from a source checkout uses the platform WebView elsewhere,
  but macOS is the tested target.
- An API key for a model provider you will use in chat (any provider the
  chat-model settings offer, or an OpenAI-compatible endpoint).
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
an installed `Maestro.app`, a built harness checkout in the directory next to
the Maestro repository, then an executable on `PATH`. If none is found, the
launch stops with a message that says what to install. Developer flags:

```bash
uv run maestro app --dsh-source /path/to/harness-checkout   # a built source checkout
uv run maestro app --dsh-executable /path/to/runtime     # a runtime executable
```

A harness version different from the pinned one stops the launch.

The app opens a native window. Nothing is opened in a browser; the harness
listens only on a random `127.0.0.1` port inside that window. Closing the
window stops it.

## 2. Choose a workspace

On the start screen, choose a project folder (**Choose workspace**). Sessions
belong to a workspace. Library actions that open a session also need one.

## 3. Set the chat model

Open **Settings → Chat model**. Add a provider, enter its API key and pick the
models you want in the model selector. The key stays inside the app's harness
and is not written to Maestro's configuration files.

This is the only model you need for the desktop app. Generation, execution,
repair, data generation, tool and skill drafts and idea translation all use the
model selected in the current chat. Do not paste keys into chat.

## 4. Connect memory and evolution (optional)

Open **Settings → MAESTRO**. Here you set:

- **Memory base URL** and **Memory API key**; **Read only** for a shared store;
- **Chain memory**: the default store or **IdeaL** with a namespace;
- **Platform base URL** and the mutation and validation models for evolution;
- web search provider and key, the research switches, and the app lock.

Keys are entered in a native secure-text dialog and stored in the macOS
Keychain. Every save asks for a native confirmation and **requires a full
restart** of the app. The page also has a *Chain generation* block; in the
desktop app its provider, URL, model and key are not used. See
[Settings](/care/app/settings/).

## 5. Build your first chain

Start a new session and describe the task in plain words:

```text
Make a chain that takes a customer review and returns its sentiment
(positive, neutral or negative) with a one-line reason.
```

The agent picks a strategy. For a new chain it uses the Maestro generator by
default. Generation is paid work, so the app shows **one confirmation dialog**.
After approval you get a chain card with the structure graph and a
readiness summary.

Then ask it to run:

```text
Run it on: "Delivery was late, but support fixed everything in ten minutes."
```

Execution asks once more (it calls the model). The result card shows each
step's output preview. While a run is going you can pause, resume or stop it
from the card.

If you have Memory configured, ask *"save this chain"*. Saving is free and
needs no dialog. The chain then appears in the **Library**.

To skip all dialogs for paid work in one session, choose the **Full access**
preset for that session. See [Confirmations](/care/app/confirmations/).

## Next steps

- [The desktop app](/care/app/overview/): sessions, strategies, cards and the progress dock.
- [Library](/care/app/library/): saved chains, ideas, datasets, tools and skills.
- [Evolution data](/care/workflows/data-generation/) and [evolution](/care/workflows/evolution/).

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
