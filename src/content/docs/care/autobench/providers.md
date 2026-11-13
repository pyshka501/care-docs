---
title: Providers
description: Which models autobench can use — Codex through the local Codex CLI and your ChatGPT sign-in, or the current chat model — what Maestro looks for on disk, how tokens are counted, and the environment variables that change it.
sidebar:
  order: 6
---

A run uses one provider for everything: the spec, the cases, the blind solve
and the judge. You choose it in the wizard (**Provider**, *Провайдер*) or the
agent passes it. If you do not choose, Maestro takes Codex when it is
available and the chat model otherwise.

| | Codex | Chat model |
| --- | --- | --- |
| What it is | The local Codex CLI, signed in with your ChatGPT account | The current chat model of the session, through the same connection chain generation uses |
| Who pays | Your ChatGPT subscription limits | The chat model's API key |
| Output | Constrained by a JSON schema (`--output-schema`) | Asks for `json_schema`, falls back to `json_object` |
| File inputs (image, PDF, DOCX, XLSX, CSV, audio) | Yes | No |
| Parallel batches | up to 3 | up to 2 |
| Default budget when the agent gives none | 1,000,000 tokens | 200,000 tokens |
| Token counts | Estimates printed by the CLI | Reported by the API |

The wizard's own default budget is 1,000,000 tokens for both.

## Codex

### What Maestro looks for

Codex is **available** when both are true:

1. **A Codex binary is found**, checked in this order:
   - `MAESTRO_CODEX_BIN`, if set (it must point to an existing file);
   - `codex` on `PATH`;
   - `/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex`
   - `/Applications/Codex.app/Contents/Resources/codex`
   - `~/.local/bin/codex`
   - `/opt/homebrew/bin/codex`
   - `/usr/local/bin/codex`
2. **Codex is signed in**: `auth.json` exists in the Codex home
   (`$CODEX_HOME`, default `~/.codex`). If not, run `codex login` once.

When Codex is not available, the wizard shows why: *Codex CLI не найден…*
(no binary) or *Codex не вошёл в аккаунт…* (not signed in).

The model list comes from `models_cache.json` in the Codex home (up to 24
models, review models excluded). The default is `gpt-6-luna` when it is in
the list or the list is empty; otherwise the first listed model.

### How Maestro calls it

One `codex exec` process per model call, with:

- `--ignore-user-config`: your own Codex settings, notify hooks, plugins and
  default model do not apply;
- `--ephemeral`: no session files;
- `--ignore-rules` and `--skip-git-repo-check`;
- a read-only sandbox in an empty temporary folder, or `workspace-write`
  limited to the batch's work folder when it has to create files; the judge
  and blind solver of a file run get read-only access to the run's files;
- `-c model_reasoning_effort=…` when you chose an effort.

At most 3 Codex processes run at the same time across all runs
(`MAESTRO_CODEX_CONCURRENCY`, default 3). Token counts are parsed from the
CLI's "tokens used" line and are estimates; the run screen marks them
*(оценка Codex)*.

## Chat model

The "chat model" is the model chain generation uses: by default the
session's chat model (*модель текущего чата*), or the chain model set in the
MAESTRO settings when chain generation is switched to a custom model
(*модель из настроек: …*). If there is no usable model connection
when a run starts, the run waits in **Needs resume** (*Требует возобновления*)
with the reason *модель недоступна*; resume it once the model works.

With the chat model, one start, resume or extend gets a model lease of at
most 600 calls and 6 hours.

## Environment variables

| Variable | Effect |
| --- | --- |
| `MAESTRO_CODEX_BIN` | Path to the Codex binary. |
| `CODEX_HOME` | Codex home with `auth.json` and `models_cache.json` (default `~/.codex`). |
| `MAESTRO_CODEX_CONCURRENCY` | Maximum parallel Codex processes (default 3). |
| `MAESTRO_GENERATOR_PYTHON` | Python used to run generator programs. Default: the current interpreter, or `/usr/bin/python3` inside the packaged app. |
| `MAESTRO_GENERATOR_SANDBOX` | `0` runs generator programs without `sandbox-exec`. Leave it on. |
| `CARE_BENCHMARK_FACTORY_DB` | Path of the autobench store (see [Agent tools](/care/autobench/tools/#storage)). |
