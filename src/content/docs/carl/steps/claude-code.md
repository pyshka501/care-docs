---
title: Claude Code Step
description: Delegate one chain step to a headless Claude Code CLI agent — config, workspace, credentials, limits and failure modes.
sidebar:
  order: 20
---

`ClaudeCodeStepDescription` hands a whole subtask to a headless
[Claude Code](https://docs.claude.com/en/docs/claude-code) agent. CARL runs the
`claude` CLI in print mode as a subprocess and collects the final answer,
session id, token usage and cost.

How it differs from the other agent-like steps:

- [`llm`](/carl/steps/llm/) makes one completion.
- [`agent`](/carl/steps/agent/) is a CARL-managed loop over tools **you registered**, with CARL budgets on every call.
- `claude_code` gives the task to an autonomous coding agent with **its own** tools (files, shell, web, MCP). CARL sees only the final result.

## Requirements

- The Claude Code CLI on `PATH`, or an absolute path in `cli_path`
  (`npm install -g @anthropic-ai/claude-code`).
- The CLI must already be signed in. Authentication is host-owned: CARL never
  stores credentials in the chain or the context.
- No extra Python package is needed.

Check the host before running:

```python
from mmar_carl import check_claude_code_cli

status = check_claude_code_cli()          # resolves the CLI and runs `claude --version`
print(status.available, status.version, status.error)
```

`chain.preflight(context)` does a cheaper check: it lists every `cli_path` the
chain uses in `required_claude_code_clis` and the ones that don't resolve in
`missing_claude_code_clis`. It does not check sign-in.

## Example

```python
from mmar_carl import ClaudeCodeStepConfig, ClaudeCodeStepDescription

ClaudeCodeStepDescription(
    number=2,
    title="Review the change",
    dependencies=[1],
    config=ClaudeCodeStepConfig(
        task="Review the diff in {path} and list risky changes.",
        input_mapping={"path": "$memory.input.repo_path"},
        cwd="/work/repo",
        allowed_tools=["Read", "Grep", "Bash(git diff:*)"],
        permission_mode="plan",
        max_turns=8,
        timeout=300,
        output_memory_key="review",          # → $memory.claude_code.review
    ),
)
```

For this config CARL runs:

```bash
claude -p "<rendered task>" --output-format json --max-turns 8 \
  --allowedTools Read,Grep,Bash(git diff:*) --permission-mode plan
```

## ClaudeCodeStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `task` | `str` | required | Prompt for the agent. With a non-empty `input_mapping` it is a `str.format` template; every `{placeholder}` needs an entry. With an empty mapping it is passed verbatim. |
| `input_mapping` | `dict[str, str]` | `{}` | Placeholder → source. `$…` is a [reference](/carl/chains/dynamic-references/), a quoted string is a literal, anything else is passed as is. Non-string values are JSON-encoded; a reference that resolves to `None` becomes an empty string. |
| `cli_path` | `str` | `"claude"` | CLI executable (name on `PATH` or a path). |
| `cwd` | `str \| None` | `None` | Working directory, i.e. the agent's project root. `None` = the host process cwd. |
| `model` | `str \| None` | `None` | `--model` (e.g. `sonnet`, `opus`). |
| `max_turns` | `int \| None` | `None` | `--max-turns`, ≥ 1. |
| `allowed_tools` | `list[str]` | `[]` | `--allowedTools`, e.g. `["Read", "Grep", "Bash(git log:*)"]`. |
| `disallowed_tools` | `list[str]` | `[]` | `--disallowedTools`. |
| `permission_mode` | `str \| None` | `None` | `--permission-mode`: `default`, `acceptEdits`, `bypassPermissions` or `plan`. Not validated by CARL. |
| `system_prompt` | `str \| None` | `None` | `--system-prompt` (replaces the CLI's default). |
| `append_system_prompt` | `str \| None` | `None` | `--append-system-prompt`. |
| `add_dirs` | `list[str]` | `[]` | Extra directories (`--add-dir`, one flag each). |
| `resume_session` | `str \| None` | `None` | Session to continue (`--resume`). A `$` reference is resolved at run time. |
| `stream` | `bool` | `False` | Use `--output-format stream-json --verbose` and forward each assistant text block to `context.on_llm_chunk`. |
| `extra_cli_args` | `list[str]` | `[]` | Raw argv appended last. |
| `env` | `dict[str, str]` | `{}` | Extra environment variables for the CLI process. |
| `timeout` | `float` | `600.0` | Wall-clock budget in seconds (> 0). The process is killed on expiry. |
| `max_output_chars` | `int` | `20000` | Truncation limit for the answer in the step result and history. |
| `store_session_key` | `str \| None` | `None` | Memory key for the session id in namespace `claude_code`. `None` = `step_<number>`. |
| `output_memory_key` | `str \| None` | `None` | Memory key for the final answer (the parsed object when `output_schema` is set). |
| `output_namespace` | `str` | `"claude_code"` | Namespace for `output_memory_key`. |
| `output_schema` | `dict \| None` | `None` | JSON Schema. The final answer must contain a matching JSON payload, or the step fails. |

## Workspace and authority

- The agent works in `cwd` with whatever tools and permissions the CLI flags
  allow. CARL adds no sandbox of its own.
- The CLI process **inherits the host environment** (`os.environ`) plus `env`.
  Any secret in the host environment is visible to the agent.
- The flags that grant authority (`permission_mode`, `allowed_tools`,
  `extra_cli_args`, `env`, `add_dirs`) are **part of the serialized chain**.
  A chain can ask for `bypassPermissions`. Unlike `command` and `code` steps,
  there is no host-side policy object that caps them. Review chains with
  `claude_code` steps before you run them, and run untrusted ones in a
  disposable checkout or container.
- `cache` is rejected on this step type: the agent may read or change workspace
  state, so a memoized result would be wrong.

## Result

On success:

| Where | What |
| --- | --- |
| `result` | The agent's final answer (truncated to `max_output_chars`). Also added to history with the tag `[CLAUDE CODE]`. |
| `result_data["session_id"]` | Session id. Also written to `$memory.claude_code.step_<n>` (or `store_session_key`). |
| `result_data["num_turns"]`, `["total_cost_usd"]`, `["duration_ms"]`, `["usage"]` | As reported by the CLI. |
| `result_data["structured_output"]` | Parsed JSON when `output_schema` is set, else `None`. |
| `result_data["payload"]` | The raw CLI result object, including the full answer text. |
| `token_usage` | `{prompt, completion, total}`; `prompt` includes cache creation and cache read tokens. |

### Continue one session across steps

```python
ClaudeCodeStepDescription(
    number=3,
    title="Fix what the review found",
    dependencies=[2],
    config=ClaudeCodeStepConfig(
        task="Fix the risky changes you listed.",
        cwd="/work/repo",
        permission_mode="acceptEdits",
        resume_session="$memory.claude_code.step_2",
    ),
)
```

## Failure modes

The step returns `success=False` with `error_message` when:

- the CLI is not found (`Claude Code CLI not found at 'claude'…`);
- the CLI exits non-zero, or prints no parseable JSON;
- the CLI reports `is_error` (the message includes its `subtype`, e.g. a turn
  limit);
- `timeout` expires (the process is killed);
- a `{placeholder}` in `task` has no `input_mapping` entry;
- `resume_session` is a reference that resolves to an empty value;
- `output_schema` is set and the answer has no matching JSON payload.

Error details are cut to 500 characters.

## Cost

`estimate_chain_cost` does not model this step: spend is external and decided by
the agent. Read `result_data["total_cost_usd"]` after the run.

## See also

- [Codex step](/carl/steps/codex/): the same idea through the Codex SDK, with a read-only default sandbox.
- [Agent step](/carl/steps/agent/): a bounded loop over your own registered tools.
- [Example](https://github.com/Glazkoff/carl/blob/pre-release/examples/agents/claude_code_step_example.py) in the repo.
