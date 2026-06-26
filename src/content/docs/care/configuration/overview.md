---
title: Configuration
description: How MAESTRO reads configuration — the four layers, and TOML ↔ env mapping.
sidebar:
  order: 1
---

MAESTRO reads configuration from four layers, in increasing precedence:

1. Defaults baked into `care.config.CareConfig`.
2. `~/.config/care/config.toml` (user-global).
3. `./care.toml` (per-project overrides).
4. `CARE_*` environment variables (highest).

The fastest way to a working config is [`care init`](/care/cli/setup/), which writes
a starter `.env`; [`care doctor`](/care/cli/setup/) checks it.

## TOML ↔ env mapping

Nested fields use **double underscores** in env-var form, mirroring how the TOML
sections nest. For example:

```toml
[mage]
model = "qwen/qwen3-coder"
```

is the same as:

```bash
CARE_MAGE__MODEL="qwen/qwen3-coder"
```

and `[chat] default_mode = "production"` is `CARE_CHAT__DEFAULT_MODE=production`.

:::note[Lenient `default_mode` parsing]
`chat.default_mode` is parsed leniently: a known legacy alias (`ad_hoc` / `ad-hoc` /
`adhoc` / `prod`) is normalised to its canonical id, and an unrecognised value is
dropped so the field's default (`interactive`) applies — either way a warning is
logged and the rest of the config still loads. A malformed mode never crashes
startup. Other fields are still validated strictly.
:::

## Sections

`CareConfig` nests twelve sections, each with the env prefix `CARE_<SECTION>__`:

| Section | Env prefix | Purpose |
| --- | --- | --- |
| `mage` | `CARE_MAGE__*` | MAGE generator (provider, API key, model, mode). |
| `memory` | `CARE_MEMORY__*` | GigaEvo Memory connection. |
| `platform` | `CARE_PLATFORM__*` | GigaEvo Platform connection (evolution). |
| `hub` | `CARE_HUB__*` | Agent hub for `/deploy`. |
| `upload` | `CARE_UPLOAD__*` | Artifact-upload endpoint (`/upload`). |
| `sandbox` | `CARE_SANDBOX__*` | AgentSkill sandbox backend + limits. |
| `tools` | `CARE_TOOLS__*` | `@carl_tool` registry + bundled builtins + synthesis. |
| `telemetry` | `CARE_TELEMETRY__*` | Opt-in event-stream sink (Langfuse, …). |
| `defaults` | `CARE_DEFAULTS__*` | UI defaults (language, history size). |
| `chat` | `CARE_CHAT__*` | Chat surface (default mode, ad-hoc history, retries). |
| `context` | `CARE_CONTEXT__*` | User-context injection (CARE.md + LTM digest). |
| `artifacts` | `CARE_ARTIFACTS__*` | Saved-artifact store directory. |

See [section reference](/care/configuration/sections/) for the notable keys in each,
or [`.env.example`](https://github.com/Glazkoff/care/blob/main/.env.example) for the
complete surface.

## First boot

Without `~/.config/care/config.toml` on disk, the first launch lands on the
**Settings** screen so you can configure Memory / Platform URLs + MAGE credentials.
Returning users go straight to the chat surface.
