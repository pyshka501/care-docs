---
title: Setup Commands
description: Initialise config, run health checks, and secure secrets.
sidebar:
  order: 3
---

## `care init`

One-shot quick-start: write a minimal `.env` with the MAGE credentials a fresh
checkout needs.

```bash
care init                                    # interactive
care init --non-interactive --api-key sk-... --base-url ... --model qwen/qwen3-coder
```

| Flag | Purpose |
| --- | --- |
| `--non-interactive` | Skip prompts; supply values via flags. |
| `--api-key` / `--base-url` / `--model` | MAGE credentials. |
| `--mode ad_hoc\|production` | Default chat mode to write. |
| `--toml` | Write a full `~/.config/care/config.toml` instead of `.env`. |
| `--probe` | Run connectivity checks as it writes. |
| `--force` | Overwrite an existing file. |

## `care doctor`

Environment, config, and dependency health report — the same probes the first-run
wizard runs.

```bash
care doctor              # with network probes
care doctor --no-probes  # offline / CI
```

## `care migrate-secrets`

Move plaintext API keys out of your config TOML into the OS keychain.

```bash
care migrate-secrets --dry-run   # preview without changing anything
```

Run `care <command> --help` for the full flag set.
