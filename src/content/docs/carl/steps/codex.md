---
title: Codex Step
description: Delegate one chain step to a local Codex agent through the Codex SDK — sandbox, credentials, limits and failure modes.
sidebar:
  order: 21
---

`CodexStepDescription` hands a whole subtask to a local Codex agent. CARL drives
it through the optional `openai-codex` Python SDK, which starts a local Codex
app-server process. The step collects the final response, the thread id and
token usage.

The interface mirrors the [Claude Code step](/carl/steps/claude-code/): the same
`task` + `input_mapping` template, `output_schema`, `output_memory_key` and
session resume. The authority model is stricter: the chain can only pick a
`read-only` or `workspace-write` sandbox, and every approval request is denied.

## Requirements

```bash
pip install 'mmar-carl[codex]'     # openai-codex>=0.147.0, also in mmar-carl[all]
codex login                        # authentication stays in the host's Codex install
```

Check the host before running:

```python
from mmar_carl import check_codex_runtime

status = check_codex_runtime()
print(status.available, status.sdk_version, status.cli_path, status.error)
```

`available` is `True` when the SDK imports. `cli_path` (the `codex` binary on
`PATH`) is informational. Neither check verifies login. `chain.preflight(context)`
runs the same SDK check and reports `openai-codex` in `missing_codex_runtimes`
when it is not installed.

## Example

```python
from mmar_carl import CodexStepConfig, CodexStepDescription

CodexStepDescription(
    number=2,
    title="Draft the fix",
    dependencies=[1],
    config=CodexStepConfig(
        task="Fix the failing test described here:\n{report}",
        input_mapping={"report": "$history[-1]"},
        cwd="/work/repo",
        sandbox="workspace-write",        # opt in to file edits
        reasoning_effort="medium",
        timeout=600,
        output_memory_key="fix_summary",  # → $memory.codex.fix_summary
    ),
)
```

## CodexStepConfig

Unknown fields are rejected (`extra="forbid"`).

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `task` | `str` | required | 1–16 000 chars, non-blank. With a non-empty `input_mapping` it is a `str.format` template. Wire alias: `instruction`. |
| `input_mapping` | `dict[str, str]` | `{}` | Up to 32 entries. Names must be identifiers; sources are non-empty, ≤ 2048 chars. `$…` is a [reference](/carl/chains/dynamic-references/), a quoted string is a literal. |
| `cwd` | `str \| None` | `None` | Working directory for the Codex thread. Must exist. |
| `sandbox` | `"read-only" \| "workspace-write"` | `"read-only"` | Filesystem sandbox. Full access is not supported. |
| `model` | `str \| None` | `None` | Model override. `None` = the local Codex default. |
| `reasoning_effort` | `none`, `minimal`, `low`, `medium`, `high`, `xhigh` or `None` | `None` | Reasoning-effort override. |
| `developer_instructions` | `str \| None` | `None` | Host-authored developer instructions, ≤ 16 000 chars. |
| `resume_session` | `str \| None` | `None` | Thread id to resume; a `$` reference is resolved at run time. Wire alias: `thread_id_source`. |
| `ephemeral` | `bool` | `True` | Keep a newly started thread out of durable Codex history. |
| `timeout` | `float` | `300.0` | Whole-step budget in seconds, including runtime start-up. `0 < timeout ≤ 3600`. Wire alias: `timeout_seconds`. |
| `max_input_bytes` | `int` | `131072` | Limit for the rendered task, UTF-8 bytes (1 KiB–1 MiB). |
| `output_memory_key` | `str \| None` | `None` | Memory key for the final answer (the parsed object when `output_schema` is set). |
| `output_namespace` | `str` | `"codex"` | Namespace for `output_memory_key`. |
| `output_schema` | `dict \| None` | `None` | JSON Schema. The final response must contain a matching JSON payload, or the step fails. |
| `store_session_key` | `str \| None` | `None` | Memory key for the thread id in namespace `codex`. `None` = `step_<number>`. Wire alias: `store_thread_key`. |

## Workspace and authority

- `sandbox="read-only"` is the default; editing files needs an explicit
  `workspace-write`.
- Headless runs use `ApprovalMode.deny_all`: the agent cannot pause the chain to
  ask for more authority.
- Credentials, environment overrides, arbitrary launch arguments and the approval
  policy are **not** part of the serialized config.
- There is no host-side policy yet that limits which `cwd` a chain may choose or
  whether `workspace-write` is allowed. If you run chains you did not write,
  check these two fields.
- `cache` is rejected on this step type.

## Result

On success:

| Where | What |
| --- | --- |
| `result` | The final response. Also added to history with the tag `[CODEX]`. |
| `result_data["session_id"]` / `["thread_id"]` | Thread id (same value). Also written to `$memory.codex.step_<n>` (or `store_session_key`). |
| `result_data["turn_id"]`, `["status"]` | The completed turn. |
| `result_data["sandbox"]`, `["cwd"]`, `["configured_model"]` | What the step asked for. |
| `result_data["resumed"]`, `["ephemeral"]` | Whether the thread was resumed (`ephemeral` is `None` then). |
| `result_data["usage"]` | Raw SDK usage. |
| `result_data["structured_output"]` | Parsed JSON when `output_schema` is set, else `None`. |
| `token_usage` | `{prompt, completion, total}` from the turn's total usage. |
| `model` | The configured override, if any (the SDK does not report the resolved model). |

### Continue one thread across steps

```python
CodexStepConfig(
    task="Now add a regression test for that fix.",
    resume_session="$memory.codex.step_2",
    sandbox="workspace-write",
)
```

## Failure modes

The step returns `success=False` with `error_message` when:

- the SDK is not installed (`Optional dependency 'openai_codex' not found…`);
- `cwd` is not an existing directory;
- a `{placeholder}` has no `input_mapping` entry, or the rendered task exceeds
  `max_input_bytes`;
- `resume_session` is a reference that resolves to an empty value;
- the turn ends with a status other than `completed`, or reports an error;
- `timeout` expires (`Codex turn timed out after …s`);
- `output_schema` is set and the response has no matching JSON payload.

Error text is cut to 500 characters.

## Limits

- No streaming: the SDK returns one completed turn, so `on_llm_chunk` is not fed.
- `estimate_chain_cost` does not model this step. Read `result_data["usage"]`
  after the run.
- Each step starts its own local app-server, which adds start-up latency.

## See also

- [Claude Code step](/carl/steps/claude-code/): the same idea through the `claude` CLI, with streaming.
- [Agent step](/carl/steps/agent/): a bounded loop over your own registered tools.
- [Example](https://github.com/Glazkoff/carl/blob/pre-release/examples/agents/codex_step_example.py) in the repo.
