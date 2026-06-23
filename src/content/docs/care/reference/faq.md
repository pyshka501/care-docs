---
title: FAQ & Troubleshooting
description: Common questions and fixes when running MAESTRO.
sidebar:
  order: 1
---

## Production mode keeps falling back to Ad-Hoc

Production requires a Memory connection. Set `CARE_MEMORY__BASE_URL` (and
`CARE_MEMORY__API_KEY` if the deployment enforces auth). Without it, selecting
Production auto-falls back to [Ad-Hoc](/care/getting-started/overview/) with a
warning. Check with [`care doctor`](/care/cli/setup/).

## "Install hint" instead of running a chain

CARL execution is the optional `maestro-care[carl]` extra. If `care run --execute` (or an
in-chat run) reports a missing dependency, install it:

```bash
uv sync --extra carl     # or: pip install 'maestro-care[carl]'
```

MAESTRO imports upstreams lazily, so a minimal install still boots — the hint tells
you exactly which extra to add.

## LLM errors (401 / 403 / 429)

These come from your provider, surfaced through MAGE/CARL:

- **401** — bad/missing API key. Re-run [`care init`](/care/cli/setup/) or fix `CARE_MAGE__API_KEY`.
- **403** — the model/route isn't permitted for your key. Pick another model.
- **429** — rate-limited (common on free tiers). Wait, or switch model/provider.

Set the model with `CARE_MAGE__MODEL` (e.g. `qwen/qwen3-coder`).

## First launch lands on Settings

Expected — with no `~/.config/care/config.toml`, MAESTRO CARE opens the **Settings** screen
so you can enter MAGE/Memory/Platform creds. Returning users go straight to chat.

## My keys are in plaintext TOML

Move them into the OS keychain with
[`care migrate-secrets`](/care/cli/setup/) (`--dry-run` to preview).

## Health check everything

```bash
care doctor          # env + config + dependency report
care doctor --no-probes   # skip network checks (offline / CI)
```

## See also

- [Configuration](/care/configuration/overview/) · [Glossary](/care/reference/glossary/)
