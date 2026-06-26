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

```bash
uvx maestro-install skill
```

`skill` is a positional subcommand of the published `maestro-install` wizard. It
downloads the bundle and unpacks it into the chosen agent's skills directory. It asks
which agent, or pick explicitly with `--agent`:

| `--agent` | Skills directory |
| --- | --- |
| `claude` | `~/.claude/skills/` |
| `codex` | `~/.codex/skills/` |
| `hermes` | `~/.hermes/skills/` |
| `openclaw` | `~/.openclaw/skills/` |
| `all` | every agent above it can find |
| `<path>` | a custom skills directory |

```bash
uvx maestro-install skill --agent all
```

Omit `--agent` and it asks; with `--fast` it auto-detects installed agents and defaults
to Claude Code. The bundle's top folder is `maestro/`; an existing `maestro/` is kept as
`maestro.bak`.

By default the bundle is fetched from
`https://airi-maestro.github.io/care-docs/maestro.skill`. Override it with `--skill-url`
or the `$MAESTRO_SKILL_URL` environment variable (for a mirror or a pinned version):

```bash
uvx maestro-install skill --agent claude \
  --skill-url https://airi-maestro.github.io/care-docs/maestro.skill
```

:::note[Legacy package]
The old `care-install` package is stale and lacks the `skill` feature — always use
`maestro-install`. Force-refresh the installer itself with `uvx --refresh
maestro-install`.
:::

**Manual fallback (no wizard).** Download that same URL and unzip it yourself:

```bash
curl -fsSLO https://airi-maestro.github.io/care-docs/maestro.skill
unzip maestro.skill -d ~/.claude/skills/     # → ~/.claude/skills/maestro/  (or ~/.codex/skills/, ~/.hermes/skills/)
```

In hermes, `/skills` then lists **maestro**; invoke it with `/maestro` (or just
describe a Maestro task). In Claude Code the skill triggers automatically on Maestro
tasks.

## 2. Make `care` available (once)

The skill drives the `care` command; set it up once with the published wizard (it also
installs a global `care` shim):

```bash
uvx maestro-install        # workspace + .env + a `care` shim in ~/.local/bin
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
`maestro.bak`. The skill and the `care` CLI version independently; reconfigure Maestro
itself with `uvx maestro-install reconfigure`.
