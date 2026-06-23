---
title: Install & Use
description: Install the Maestro agent skill with one command, for Claude Code or hermes; make `care` resolvable; verify.
sidebar:
  order: 2
---

The Maestro skill is a small bundle (`maestro/` — `SKILL.md` + `scripts/` +
`references/`) that teaches Claude Code or hermes to drive Maestro. It needs a working
`care` command, which it does **not** install (see step 2).

## 1. Install the skill — one command

Download **and** unpack it into your agent's skills directory with `uv`:

```bash
uv run https://raw.githubusercontent.com/pyshka501/care-docs/main/public/install.py
```

It auto-detects Claude Code (`~/.claude/skills`) and hermes (`~/.hermes/skills`) and
unpacks the skill into `<dir>/maestro`. Target explicitly with
`--target claude|hermes|both`:

```bash
uv run https://raw.githubusercontent.com/pyshka501/care-docs/main/public/install.py --target both
```

No `uv`? The same script runs under plain Python, or unzip the bundle by hand:

```bash
# curl + python
curl -fsSL https://raw.githubusercontent.com/pyshka501/care-docs/main/public/install.py | python3 - --target claude

# fully manual
curl -fsSLO https://raw.githubusercontent.com/pyshka501/care-docs/main/public/maestro.skill
unzip maestro.skill -d ~/.claude/skills/     # → ~/.claude/skills/maestro/  (or ~/.hermes/skills/)
```

In hermes, `/skills` then lists **maestro**; invoke it with `/maestro` (or just
describe a Maestro task). In Claude Code the skill triggers automatically on Maestro
tasks.

## 2. Make `care` available (once)

The skill drives the `care` command; set it up once with the published wizard (it also
installs a global `care` shim):

```bash
uvx care-install        # workspace + .env + a `care` shim in ~/.local/bin
```

Ensure `~/.local/bin` is on your `PATH`. Alternatives: `uv tool install --editable
<checkout>`, or `export CARE_HOME=/path/to/checkout`. Zero-install also works — the
launcher falls back to `uvx --from maestro-care care`. See the
[Quick Start](/care/getting-started/quick-start/).

## 3. Verify

The bundled launcher reports how it resolved `care`, then run a health check:

```bash
bash ~/.claude/skills/maestro/scripts/care.sh --where    # global | checkout | pypi
bash ~/.claude/skills/maestro/scripts/care.sh doctor     # config + service probes
```

`doctor` should show your model endpoint and a reachable memory service. You're ready —
ask your agent to "generate a chain for …", "run chain X", or "show memory".

:::note[File paths]
When `care` resolves to the global shim (or the `uvx` fallback), it runs from your
Maestro **workspace**, so relative file arguments resolve there. Pass **absolute
paths** for `--output`, `validate <file>`, `replay <file>`, and `import` globs.
:::

## Updating

Re-run the one-command install — it replaces the folder and keeps the previous copy as
`maestro.bak`. The skill and the `care` CLI version independently; update Maestro itself
with `uvx care-install update`.
