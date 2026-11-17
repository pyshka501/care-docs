---
title: Setup Commands
description: Write a starter .env, check the environment and service probes, and move secrets into the keychain.
sidebar:
  order: 3
---

## `maestro init`

Quick start: write a minimal `.env` with model credentials so a fresh checkout or
workspace can run straight away. It prompts for every value you don't pass;
`--non-interactive` uses the defaults instead.

```bash
maestro init                                         # interactive prompts
maestro init --non-interactive \
  --api-key "$OPENROUTER_API_KEY" \
  --base-url https://openrouter.ai/api/v1 \
  --model qwen/qwen3-coder \
  --mode interactive
maestro init --non-interactive --api-key "$KEY" --mode production --force
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--env-path PATH` | `./.env` | Where to write the file. |
| `--api-key KEY` | prompt | Model API key for chain generation. |
| `--base-url URL` | `https://openrouter.ai/api/v1` | OpenAI-compatible base URL. |
| `--model ID` | `anthropic/claude-3.5-sonnet` | Model id the endpoint understands. |
| `--mode interactive\|production\|ad_hoc` | `interactive` | Default chat mode. |
| `--force` | off | Overwrite the target file if it exists. |
| `--non-interactive` | off | Never prompt; unset values use the defaults (needed for CI). |

The model default is a plain fallback, not a recommendation. Pick a model your
endpoint serves; on OpenRouter `qwen/qwen3-coder` is a common choice.

### Modes

- **`interactive`** — chat generates a chain and, by default, asks before running
  it. Nothing is saved unless you save it. Works without Memory.
- **`production`** — every request produces a reproducible chain saved to Memory
  under a stable `chain_id`, with a baseline run, and starts evolution when the
  Platform is configured. Needs `CARE_MEMORY__BASE_URL`; without it the app falls
  back to interactive with a warning.

`ad_hoc` (and `ad-hoc`, `adhoc`) is the old name of `interactive` and is written as
`interactive`. Any other value exits `1`. See [Modes](/care/workflows/modes/).

## `maestro doctor`

Diagnostic report: config path, which `CARE_*` variables are set, config, cache and
state directories, installed extras, and network probes against Memory, the chain
generator's model endpoint and the Platform. When STARM solver servers are
configured, it also asks each one for `GET /info`.

```bash
maestro doctor
maestro doctor --no-probes              # env / config / extras only (offline, CI)
maestro doctor --config ./care.toml     # check a specific config file
```

| Flag | Purpose |
| --- | --- |
| `--config PATH` | Override the config path (default `~/.config/care/config.toml`). |
| `--no-probes` | Skip all network probes, including STARM. |

The model probe is an authenticated `/models` round-trip, so an expired key shows as a
failure instead of a false green. `doctor` exits `1` when the **Memory** or **model**
probe fails; the Platform probe is optional. After the probes it also flags config
fields that look misfilled, for example an API key pasted into a `*_base_url` field.

### STARM solver probes

With `tools.starm_ports` set, `doctor` prints one line per solver server. The
hosts and the `<arch>` / `<N>` values below are placeholders:

```text
== STARM solvers ==
  ✓ solve_sudoku  http://gpu-01:8080  ok: <arch>, up to <N> recursion steps
  ⚠ solve_maze  http://gpu-01:8081  misrouted: serves 'sudoku'
  ✗ solve_arc_agi_1  http://gpu-01:8082  unreachable: ConnectError
```

- `ok` — the server answers and serves the expected task; the line shows the model
  architecture and the recursion step limit from `/info`.
- `misrouted` — the server serves another task. Usually the port map is swapped;
  every prompt would be rejected.
- `unreachable` — no answer on that port.

The solver section is informational: it never changes the exit code. Setup and
details: [STARM solvers](/care/solvers/starm/).

## `maestro migrate-secrets`

Move literal `*_api_key` values in `~/.config/care/config.toml` into the system
keystore and rewrite the TOML with `keystore://…` URLs.

```bash
maestro migrate-secrets --dry-run       # preview, change nothing
maestro migrate-secrets
```

| Flag | Purpose |
| --- | --- |
| `--config PATH` | Override the config path. |
| `--dry-run` | Print what would migrate without touching the keystore or the TOML. |
