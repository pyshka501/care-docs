---
title: Install & Use
description: Download the care-cli skill, install it for Claude Code or hermes, make `care` resolvable, and verify.
sidebar:
  order: 2
---

The skill is a zip whose top-level folder is `care-cli/`. "Installing" means dropping
that folder into your agent's skills directory. It needs a working `care` command —
the skill *drives* MAESTRO, it doesn't install it.

## 1. Get `care` available (once)

The simplest path is the published wizard, which also installs a global `care` shim:

```bash
uvx care-install        # workspace + .env + a `care` shim in ~/.local/bin
```

Make sure `~/.local/bin` is on your `PATH` afterward. Alternatives: install globally
with `uv tool install --editable <maestro-care checkout>`, or point the skill at a
checkout with `export CARE_HOME=/path/to/maestro-care`. (Zero-install also works —
the launcher falls back to `uvx --from maestro-care care`.) See the
[Quick Start](/care/getting-started/quick-start/) for full setup.

## 2. Install the skill

Download **[`care-cli.skill`](/care-cli.skill)**, then unzip it into the right
directory:

```bash
# Claude Code
unzip care-cli.skill -d ~/.claude/skills/          # -> ~/.claude/skills/care-cli/

# hermes (NousResearch) — agentskills.io standard
unzip care-cli.skill -d ~/.hermes/skills/          # -> ~/.hermes/skills/care-cli/
```

In hermes, `/skills` then lists **care-cli** and you invoke it with `/care-cli` (or
just describe a MAESTRO task — the skill's description is written to trigger). In Claude
Code the skill triggers whenever a task mentions MAESTRO / MAGE / CARL chains / the
`care` command.

## 3. Verify

The bundled launcher reports how it resolved `care`, then run a health check:

```bash
bash ~/.claude/skills/care-cli/scripts/care.sh --where      # global | checkout | pypi
bash ~/.claude/skills/care-cli/scripts/care.sh doctor       # env, config, service probes
```

`doctor` should show your MAGE endpoint and a reachable Memory service. You're ready —
ask the agent to "generate a chain for …", "run chain X", or "show MAESTRO memory".

:::note[File paths]
When `care` resolves to the global shim (or the `uvx` fallback), it runs from your
MAESTRO **workspace**, so relative file arguments resolve there. Pass **absolute paths**
for `--output`, `validate <file>`, `replay <file>`, and `import` globs so behaviour is
identical however `care` was located.
:::

## Updating

Re-download `care-cli.skill` and unzip over the existing folder (overwrite). The skill
and the `care` CLI version independently — update MAESTRO itself with
`uvx care-install update` (or re-run `uv tool install`).
