---
title: Setup Commands
description: Initialise config, run health checks, and secure secrets.
sidebar:
  order: 3
---

## `care init`

Quick-start: write a minimal `.env` with MAGE credentials so a fresh checkout can
run `care` straight away. Prompts interactively for any value you don't pass;
`--non-interactive` falls back to documented defaults for unattended runs.

```bash
care init                                            # interactive prompts
care init --non-interactive \
  --api-key sk-or-v1-... \
  --base-url https://openrouter.ai/api/v1 \
  --model qwen/qwen3-coder \
  --mode interactive
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--env-path` | `./.env` | Where to write the `.env`. |
| `--api-key` | prompt | MAGE API key. |
| `--base-url` | prompt (`https://openrouter.ai/api/v1`) | OpenAI-compatible base URL. |
| `--model` | prompt (`qwen/qwen3-coder`) | Model id the endpoint understands — `qwen/qwen3-coder` is the recommended OpenRouter convention. |
| `--mode interactive\|production\|ad_hoc` | prompt (`interactive`) | Chat default mode. |
| `--force` | off | Overwrite the target file if it exists. |
| `--non-interactive` | off | Don't prompt — unset values use defaults (required for CI). |

:::note[`ad_hoc` is normalised to `interactive`]
`--mode` accepts the legacy spellings `ad_hoc` / `ad-hoc` / `adhoc`, but they are
all normalised to `interactive` before anything is written to the `.env`. Any other
value exits `1`.
:::

## `care doctor`

Diagnostic report: which env vars are set, the config path, installed extras, and
deep network probes against Memory / MAGE / Platform.

```bash
care doctor
care doctor --no-probes              # env / config / extras only (offline / CI)
care doctor --config ./care.toml     # check a specific config file
```

| Flag | Purpose |
| --- | --- |
| `--config PATH` | Override the config path (default `~/.config/care/config.toml`). |
| `--no-probes` | Skip the network probes. |

:::note[Deep probes, shared with the TUI]
`care doctor` runs the same deep probes as the MAESTRO CARE `/status` surface
(one `run_all_probes(deep=True)`) — the MAGE probe is an authenticated `/models`
round-trip, so an expired key shows red instead of a false green. It exits `1` if
the **Memory** or **MAGE** probe fails (Platform is optional). Use `--no-probes`
in CI where the services aren't reachable.
:::

## `care migrate-secrets`

Move literal `*_api_key` values in `~/.config/care/config.toml` into the system
keystore and rewrite the TOML with `keystore://…` URLs.

```bash
care migrate-secrets --dry-run       # preview without changing anything
care migrate-secrets
```

| Flag | Purpose |
| --- | --- |
| `--config PATH` | Override the config path. |
| `--dry-run` | Print what would migrate without touching the keystore or TOML. |
