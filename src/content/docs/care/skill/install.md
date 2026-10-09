---
title: Install & Use
description: Install the portable Maestro agent skill with one command for Claude Code, Codex, hermes or OpenClaw; make the CLI resolvable; verify.
sidebar:
  order: 2
---

The portable Maestro skill is a small bundle (`maestro/` with `SKILL.md`, `scripts/`
and `references/`) that teaches an external agent to drive Maestro. It needs a working
Maestro CLI, which it does **not** install (see step 2). The skill used by the agent
inside the desktop app ships with the app and needs no installation.

## 1. Install the skill

```bash
uvx maestro-install skill
```

`skill` is an action of the published `maestro-install` wizard. It downloads the
bundle and unpacks it into the chosen agent's skills directory. It asks which agent,
or pick one with `--agent`:

| `--agent` | Skills directory |
| --- | --- |
| `claude` | `~/.claude/skills/` |
| `codex` | `~/.codex/skills/` |
| `hermes` | `~/.hermes/skills/` |
| `openclaw` | `~/.openclaw/skills/` |
| `all` | all four directories above |
| `<path>` | a custom skills directory |

```bash
uvx maestro-install skill --agent all
```

With `--fast` (or `--non-interactive`) it does not ask: it installs into every agent
whose home directory exists, or into Claude Code when none does. The bundle's top
folder is `maestro/`; an existing `maestro/` is kept as `maestro.bak`.

By default the bundle is fetched from
`https://airi-maestro.github.io/care-docs/maestro.skill`. Override it with
`--skill-url` or `$MAESTRO_SKILL_URL` (a mirror, a fork or a local build):

```bash
uvx maestro-install skill --agent claude \
  --skill-url https://airi-maestro.github.io/care-docs/maestro.skill
```

:::note[Legacy package]
The old `care-install` package lacks the `skill` action; use `maestro-install`.
Refresh the installer itself with `uvx --refresh maestro-install`.
:::

**Manual fallback.** Download the same URL and unzip it yourself:

```bash
curl -fsSLO https://airi-maestro.github.io/care-docs/maestro.skill
unzip maestro.skill -d ~/.claude/skills/     # → ~/.claude/skills/maestro/
```

In hermes, `/skills` then lists **maestro**; invoke it with `/maestro` or just
describe a Maestro task. In Claude Code the skill triggers on Maestro tasks.

:::caution[Name collisions]
Skills are identified by the `name` in their frontmatter, not by the folder. A copy
in `maestro.bak/` also declares `name: maestro`; if your agent loads every folder in
the skills directory, delete or move the backup after checking the new version.
:::

## 2. Make the CLI available (once)

The skill drives the `maestro` command. Set Maestro up once with the wizard; it also
installs a global `maestro` shim:

```bash
uvx maestro-install        # workspace + .env + a `maestro` shim in ~/.local/bin
```

Make sure `~/.local/bin` is on your `PATH`. Alternatives: `uv tool install --editable
<checkout>`, or `export CARE_HOME=/path/to/checkout`. Zero-install also works: the
launcher falls back to `uvx --from maestro-care maestro`. See the
[Quick Start](/care/getting-started/quick-start/).

## 3. Verify

The bundled launcher reports how it resolved the CLI; then run a health check:

```bash
bash ~/.claude/skills/maestro/scripts/care.sh --where    # global | checkout | pypi
bash ~/.claude/skills/maestro/scripts/care.sh doctor     # config + service probes
```

`doctor` should show your model endpoint and a reachable Memory. Then ask your agent
to "generate a chain for …", "run chain X" or "show memory".

:::note[File paths]
When the CLI resolves to the global shim or the `uvx` fallback, it runs from your
Maestro **workspace**, so relative file arguments resolve there. Pass **absolute
paths** for `--output`, `--export`, `run --file`, `validate`, `replay`, `import`
globs and `dataset export`.
:::

## Updating

Re-run `uvx maestro-install skill`; it replaces the folder and keeps the previous copy
as `maestro.bak`. The skill and the CLI are versioned separately; the bundle for
release 0.5.0 says `Skill revision: cli/0.5.0` near the top of `SKILL.md`. Update
Maestro itself with `uvx maestro-install update` and reconfigure it with
`uvx maestro-install reconfigure`.
