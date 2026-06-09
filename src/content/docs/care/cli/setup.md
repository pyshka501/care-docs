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
  --mode ad_hoc
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--env-path` | `./.env` | Where to write the `.env`. |
| `--api-key` | prompt | MAGE API key. |
| `--base-url` | prompt (`https://openrouter.ai/api/v1`) | OpenAI-compatible base URL. |
| `--model` | prompt (`anthropic/claude-3.5-sonnet`) | Model id the endpoint understands. |
| `--mode ad_hoc\|production` | prompt (`ad_hoc`) | Chat default mode. |
| `--force` | off | Overwrite the target file if it exists. |
| `--non-interactive` | off | Don't prompt — unset values use defaults (required for CI). |

## `care doctor`

Diagnostic report: which env vars are set, the config path, installed extras, and
network probes against Memory / MAGE / Platform.

```bash
care doctor
care doctor --no-probes              # env / config / extras only (offline / CI)
care doctor --config ./care.toml     # check a specific config file
```

| Flag | Purpose |
| --- | --- |
| `--config PATH` | Override the config path (default `~/.config/care/config.toml`). |
| `--no-probes` | Skip the network probes. |

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
