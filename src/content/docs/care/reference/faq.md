---
title: FAQ & Troubleshooting
description: Common questions and fixes for the Maestro desktop app, the TUI and the CLI.
sidebar:
  order: 1
---

## Desktop app

### The app does not start from a source checkout

A source launch needs the pinned harness runtime. The error message names
what is missing. Use `Maestro.app`, or point the launch at a built runtime with
the developer flags in `maestro app --help`. A harness version different from
the pinned one also stops the launch.

### "The current chat model is unavailable for this chain operation"

Generation, execution and repair use the chat model of the session through a
private bridge. Check **Settings → Chat model**: the provider has a key and a
model is selected in this chat. Maestro never falls back to a separate key.

### I set a model in Settings → MAESTRO, but generation uses another one

Expected. In the desktop app, generation uses the **chat model**. The
provider, URL, model and key in the *Chain generation* block of the MAESTRO
page configure only the CLI, the TUI and the legacy workbench. The page's
header wording is misleading here. See [Settings](/care/app/settings/).

### I saved settings but nothing changed

Every save on the MAESTRO page needs a **full quit and reopen** of the app.

### Library says memory is not responding

The status line at the top of the Library tells you whether the key is missing
or the server does not answer. Check **Memory base URL** (a hosted store needs
its API prefix, for example `https://…/api`) and **Memory API key**. Then press
↻.

### Ideas, Datasets or Tools & skills say "open a session"

These sections act as the open session. Open any session in the sidebar and
return to the Library.

### Activity is empty after a restart

The in-process list starts empty after each launch. With IdeaL on, evolution
runs kept by IdeaL are still listed at the top of the panel.

### Paid work runs without asking

The session uses the **Full access** preset, which never asks. Choose another
preset to get the dialog back. See [Confirmations](/care/app/confirmations/).

### "MAESTRO_APPROVAL_UNAVAILABLE"

The app could not read the session's approval setting, so it refused the paid
action. Nothing was started. Retry; if it persists, restart the app.

### Evolution cannot be paused

Correct: modern evolution runs can only be cancelled.

### My dataset cannot be used for evolution

A dataset needs at least two verified search cases and a supported evaluator.
*Tasks with tools* datasets cannot be used for evolution yet. See
[Evolution data](/care/workflows/data-generation/).

## TUI and CLI

### Production keeps falling back to Interactive

Production needs Memory. Set `CARE_MEMORY__BASE_URL` (and
`CARE_MEMORY__API_KEY` if the server needs one). Check with
[`maestro doctor`](/care/cli/setup/).

### "Install hint" instead of running a chain

CARL is an optional extra for the CLI and TUI. Install it:

```bash
uv sync --extra carl     # or: pip install 'maestro-care[carl]'
```

Maestro imports its upstream modules lazily, so a minimal install still starts
and the hint names the missing extra.

### Model errors (401 / 403 / 429)

They come from your provider:

- **401**: missing or wrong key. In the CLI/TUI fix `CARE_MAGE__API_KEY` or
  re-run [`maestro init`](/care/cli/setup/); in the app, fix the key in
  **Settings → Chat model**.
- **403**: the model or route is not allowed for your key. Pick another model.
- **429**: rate limit. Wait, or switch the model or provider.

### First TUI launch opens Settings

Expected when there is no `~/.config/care/config.toml`.

### My keys are in plain text

`maestro init` writes the key to `.env` in plain text. Move keys from
`~/.config/care/config.toml` into the OS keystore with
[`maestro migrate-secrets`](/care/cli/setup/).

### Health check

```bash
maestro doctor              # env, config, extras, live probes
maestro doctor --no-probes  # skip network checks (offline / CI)
```

## See also

- [Configuration](/care/configuration/overview/) · [Glossary](/care/reference/glossary/)
- [Release 0.5.0: known limits](/care/reference/release-0-5-0/)
