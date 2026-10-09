---
title: Command Step
description: Run one executable from an explicit argv list through a runtime, under a host-owned CommandPolicy.
sidebar:
  order: 14
---

`CommandStepDescription` runs one operating-system program. Its behaviour is set by
`CommandStepConfig`. The step makes no LLM call.

The design is safe by default:

- `command` is an **argv list**. CARL does not insert a shell, so shell
  metacharacters in resolved values cannot start extra commands.
- Values from `input_mapping` are appended to argv as separate tokens and also exported
  as `CARL_ARG_<NAME>`. They are never interpolated into a string.
- Execution goes through a runtime backend (`local`, `docker`, `e2b`, `firejail`).
- The chain cannot grant itself permission. The application supplies a
  `CommandPolicy` on `ReasoningContext.command_policy`. Without it the step fails.
- The host environment is not inherited. Networking defaults to `none`.

If you need shell features, put an interpreter in `command` on purpose
(`["/bin/sh", "-c", script]`) or use a [shell session step](/carl/steps/shell-session/).
Interpreters require host approval by default.

## Minimal example

```python
import asyncio

from mmar_carl import (
    CommandPolicy,
    CommandStepConfig,
    CommandStepDescription,
    ReasoningChain,
    ReasoningContext,
)

# Owned by the application, never by the chain JSON.
policy = CommandPolicy(
    allowed_executables=frozenset({"/usr/bin/printf"}),
    allowed_runtimes=frozenset({"local"}),
    allowed_networks=frozenset({"host"}),
)

chain = ReasoningChain(
    steps=[
        CommandStepDescription(
            number=1,
            title="Greet",
            config=CommandStepConfig(
                command=["/usr/bin/printf", "hello, %s\n"],
                input_mapping={"who": "$outer_context"},  # appended as argv[2]
                runtime="local",
                network="host",  # local cannot isolate the network; say so
                timeout=5.0,
            ),
        )
    ]
)

context = ReasoningContext(
    outer_context="world",
    api=llm_client,  # any client; CommandStep makes no LLM call
    command_policy=policy,
)
result = asyncio.run(chain.execute_async(context))
step = result.step_results[0]
print(step.result)                       # "hello, world\n"
print(step.result_data["exit_code"])     # 0
print(step.result_data["approval"])      # "not_required"
```

This runs on macOS and Linux as written. The `local` runtime emits a one-time
`UserWarning` that it has no sandbox.

:::caution[The `local` runtime and the default `network="none"`]
`local` cannot isolate networking. With the defaults (`network="none"`,
`enforcement_mode="strict"`) the step fails before launch:
`runtime 'local' cannot strictly enforce requested controls: network`.
On `local` either declare `network="host"` (and allow it in the policy), or use
`enforcement_mode="best_effort"` with `CommandPolicy(allow_best_effort=True)`, which runs
and reports the gap. For real isolation use `docker`, `e2b` or `firejail`.
:::

A complete runnable demo is in
[`examples/orchestration/command_steps_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/command_steps_example.py).

## CommandStepConfig

Command-specific fields:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `command` | `list[str] \| None` | `None` | argv list, e.g. `["/usr/bin/grep", "-n", "TODO"]`. Not a shell string. |
| `plan_source` | `str \| None` | `None` | Reference to a `CommandPlanRecord` (`$steps.*` or `$metadata.*`). See [Command plan step](/carl/steps/command-plan/). |
| `planned_capability_ids` | `list[str]` | `[]` | Capability ids a planned step accepts. Only narrows the host registry. Required with `plan_source`. |
| `stdin_source` | `str \| None` | `None` | Context reference whose value is piped to stdin. Non-string values are sent as JSON. |

Exactly one of `command` and `plan_source` must be set. A planned step cannot use
`input_mapping`.

### Shared runtime fields

`CommandStepConfig` and `ShellSessionStepConfig` share these fields
(`_RuntimeExecutionConfig`):

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `input_mapping` | `dict[str, str]` | `{}` | Name → context reference. Exported as `CARL_ARG_<NAME>`; for `CommandStep` also appended to argv in mapping order. Keys must match `[A-Za-z_][A-Za-z0-9_]*` and stay unique after uppercasing. |
| `env` | `dict[str, str]` | `{}` | Explicit environment variables. Every key must be in `CommandPolicy.allowed_env_keys`. `CARL_ARG_*` and `CARL_ARTIFACT_*` are reserved. |
| `artifact_inputs` | `list[ArtifactInput]` | `[]` | Values staged as files under the runtime `in/` directory. |
| `artifact_outputs` | `list[ArtifactOutput]` | `[]` | Required files collected from the runtime `out/` directory. |
| `working_dir` | `str \| None` | `None` | Runtime-local cwd. Defaults to the runtime's ephemeral `out/` directory. CARL never deletes an explicit cwd. |
| `runtime` | `str` | `"local"` | `local`, `docker`, `e2b`, `firejail`, or a registered backend. |
| `enforcement_mode` | `"strict" \| "best_effort"` | `"strict"` | `strict` fails before launch if a requested control is not enforced. `best_effort` runs (only if the policy allows it) and reports gaps. |
| `network` | `"none" \| "allowlist" \| "host"` | `"none"` | Network policy. |
| `network_allowlist` | `list[str]` | `[]` | Exact hosts. Required with, and only valid with, `network="allowlist"`. |
| `timeout` | `float` | `30.0` | Wall-clock limit for the process, seconds. |
| `artifact_io_timeout` | `float` | `30.0` | Separate limit for staging or collecting each artifact. |
| `cpu_limit` | `float \| None` | `None` | CPU core limit. |
| `mem_limit` | `str \| None` | `None` | Memory limit with an explicit `b`/`k`/`m`/`g` suffix, e.g. `"512m"`. |
| `pids_limit` | `int \| None` | `None` | Maximum process count. |
| `allow_nonzero_exit` | `bool` | `False` | When `False`, a non-zero exit marks the step failed. |
| `max_output_bytes` | `int` | `1_000_000` | Retained bytes of stdout and of stderr, each. |
| `output_key` | `str` | `"result"` | Key for stdout in `result_data`. Must not be a reserved key (below). |

`CommandStepDescription` cannot be cached (`cache=` raises), because a command may
have side effects.

## Environment

The host environment is not inherited. For `runtime="local"` the process receives
only `PATH`, `LANG` and `LC_ALL` (when set on the host), plus `env`, `CARL_ARG_*`
and `CARL_ARTIFACT_*`. Other runtimes get no host variables at all. `HOME` is not
passed.

## CommandPolicy

The policy is a frozen pydantic model on `ReasoningContext.command_policy`. It is
runtime-only and excluded from context serialization. Anything not listed is denied:
unknown executables, runtimes, networks, network hosts, env keys and host working
directories.

| Field | Default | Meaning |
| --- | --- | --- |
| `allowed_executables` | empty | Exact executable strings that may run. |
| `approval_required_executables` | empty | Exact strings that may run only after the approval callback says yes. Must not overlap with `allowed_executables`. |
| `allowed_runtimes` | empty | Runtime names. Empty means nothing can run. |
| `allowed_networks` | `{"none"}` | Allowed `network` values. |
| `allowed_network_hosts` | empty | Hosts permitted for `network="allowlist"`. |
| `allowed_env_keys` | empty | Keys allowed in `env`. |
| `local_working_roots` | `()` | Absolute roots for an explicit `working_dir` on `local`/`firejail`. Empty means no explicit host cwd. |
| `allow_best_effort` | `False` | Permit `enforcement_mode="best_effort"`. |
| `allow_planned_local` | `False` | Permit LLM-planned commands on `local`. |
| `require_approval_for_planned` | `True` | Typed `Literal[True]`. Cannot be turned off. |
| `require_approval_for_interpreters` | `True` | Interpreters need approval even when allowed: by basename `sh`, `bash`, `dash`, `zsh`, `fish`, `node`, `perl`, `ruby`, `pwsh`, and any `python*`. |
| `approval_timeout` | `300.0` | Seconds to wait for an async approval callback. |
| `network_enforcer_timeout` | `30.0` | Limit for managed-network acquire/release. |
| `runtime_cleanup_timeout` | `30.0` | Limit for runtime cleanup. |
| `max_timeout` | `300.0` | Ceiling for `timeout`. |
| `max_artifact_io_timeout` | `30.0` | Ceiling for `artifact_io_timeout`. |
| `max_cpu_limit`, `max_memory_bytes`, `max_pids_limit` | `None` | Resource ceilings. When set, they are also applied if the step requested no limit, so the runtime must enforce them (on `local` strict mode then fails). |
| `max_output_bytes` | `1_000_000` | Ceiling for `max_output_bytes`. |
| `max_argument_count` | `256` | Ceiling for argv length. |
| `max_argv_bytes` | `256_000` | Ceiling for total argv size. |
| `max_environment_keys` / `max_environment_bytes` | `128` / `256_000` | Ceilings for the final environment. |
| `max_stdin_bytes` | `1_000_000` | Ceiling for stdin (and for a shell session script). |
| `max_artifact_bytes` / `max_total_artifact_bytes` / `max_artifact_count` | `1_000_000` / `4_000_000` / `32` | Artifact ceilings. |

Matching rules:

- Rules are **exact strings**, never basenames or globs.
- For `local` and `firejail` (they launch a host binary) both the rule and the
  requested executable must be absolute paths. Paths are normalized, and the
  normalized path is what actually runs. `["echo", "hi"]` is denied even when
  `/bin/echo` is allowed.
- Container runtimes (`docker`, `e2b`) match an image-local token such as `python`.

### Approval

When the decision is `require_approval`, CARL builds a frozen
`CommandApprovalRequest` and calls `ReasoningContext.on_command_approval_requested`.
The callback returns `bool` or an awaitable `bool`. Only `True` approves. A missing
callback denies the command.

```python
from mmar_carl import CommandApprovalRequest, CommandPolicy, ReasoningContext

policy = CommandPolicy(
    approval_required_executables=frozenset({"/bin/sh"}),
    allowed_runtimes=frozenset({"local"}),
    allowed_networks=frozenset({"host"}),
)

def approve(request: CommandApprovalRequest) -> bool:
    # request.argv holds the full argv for the reviewer.
    print(request.authorized_executable, request.argv_preview, request.fingerprint)
    return ask_user(request)  # your UI

context = ReasoningContext(
    outer_context="",
    api=llm_client,
    command_policy=policy,
    on_command_approval_requested=approve,
)
```

What the request carries:

- `fingerprint` — SHA-256 over every execution-affecting value: final argv, runtime,
  cwd, network and hosts, resources, enforcement mode and report, artifact manifest,
  the full env, and a hash of stdin.
- `argv`, `environment`, `stdin` and `artifact_inputs` are visible to the callback but
  **excluded from serialization**. `model_dump()` carries `argv_preview`
  (executable plus `<static-arg-N>` / `<dynamic-arg-N>` placeholders),
  `dynamic_argument_count`, `environment_keys` and `stdin_sha256` instead.
- `source` (`static` or `planned`), `invocation_kind` (`command` or `shell_session`),
  and for planned commands the capability id, revision, fingerprint and
  `arguments_sha256`.

CARL also emits step events `command.approval_requested` (with the serialized request)
and `command.approval_resolved` through `on_step_event`.

The policy is evaluated twice: once before approval, and again after the runtime is
prepared, against the final environment. The config is deep-copied before approval,
so it cannot change after review.

## Result

On completion `result` is stdout (decoded as UTF-8, cut to `max_output_bytes`).
`result_data` contains:

| Key | Content |
| --- | --- |
| `<output_key>` | stdout (default key `result`) |
| `stdout`, `stderr` | Decoded output |
| `stdout_truncated`, `stderr_truncated` | `True` if output exceeded `max_output_bytes` |
| `exit_code` | Process exit code |
| `command_source` | `"static"` or `"planned"` |
| `command` | Static argv prefix from the config (static only) |
| `resolved_argument_count` | Number of dynamic argv tokens appended |
| `capability_id`, `capability_revision`, `capability_fingerprint` | Planned commands only |
| `policy_decision` | `CommandDecision` dump: `outcome`, `reason`, `executable`, `authorized_executable`, `authorized_working_dir`, `matched_rule` |
| `approval` | `"not_required"` or `"approved"` |
| `enforcement_report` | See below |
| `network_policy`, `network_enforced`, `network_enforcement` | Requested policy, backend attestation, managed-network plan or `None` |
| `artifacts` | Collected `ArtifactRecord` dumps by name |
| `artifact_manifest` | Input/output manifest plus `collected_outputs` |

The history entry is `Step N. <title> [COMMAND exit=<code>]` followed by stdout.

The reserved keys cannot be used as `output_key`: `approval`, `artifact_manifest`,
`artifacts`, `command`, `command_source`, `command_count`, `capability_fingerprint`,
`capability_id`, `capability_revision`, `enforcement_report`, `exit_code`,
`network_enforced`, `network_enforcement`, `network_policy`, `policy_decision`,
`resolved_argument_count`, `script_sha256`, `shell`, `stderr`, `stderr_truncated`,
`stdout`, `stdout_truncated`.

### EnforcementReport

`enforcement_report` is `EnforcementReport.as_dict()`:

```python
{
    "runtime": "local",
    "isolation": "none",
    "mode": "best_effort",
    "fully_enforced": False,
    "controls": {
        "wall_time": "enforced",
        "output_limit": "enforced",
        "cpu_limit": "not_requested",
        "memory_limit": "not_requested",
        "pids_limit": "not_requested",
        "network": "unsupported",
        "workspace_files": "not_requested",
        "artifact_output_limit": "not_requested",
    },
    "gaps": ["network"],
}
```

Each control is `enforced`, `advisory`, `unsupported` or `not_requested`. `advisory`
and `unsupported` count as gaps. `advisory` does not mean prevention (E2B output
slicing, for example, happens after the fact). This is the actual output for
`/bin/echo` on `local` with `network="none"` and `best_effort`.

## Portable artifacts

Artifacts carry bytes, not host paths. A serialized chain cannot ask the host to read
an arbitrary file.

- `ArtifactInput(name, source, path, media_type="application/octet-stream", max_bytes=None)` —
  `source` is a context reference or a quoted literal. The value is written to
  `in/<path>`; its runtime path is exported as `CARL_ARTIFACT_IN_<NAME>`. Strings are
  sent as UTF-8, bytes as is, an `ArtifactRecord` (or its dict) is decoded and
  hash-checked, other values become JSON.
- `ArtifactOutput(name, path, media_type="application/octet-stream", max_bytes=None)` —
  the program writes `out/<path>` (path in `CARL_ARTIFACT_OUT_<NAME>`). After a
  successful run CARL reads it, bounded by size, into `result_data["artifacts"][name]`.
  A missing output file fails the step.
- `ArtifactRecord` — `name`, `path`, `media_type`, `size_bytes`, `sha256`,
  `content_base64`. `ArtifactRecord.decode(max_bytes=...)` verifies size and hash.

Paths are relative POSIX paths without `.`/`..` segments. A later step consumes an
output with `source="$steps.1.result_data.artifacts.<name>"`. Outputs are not collected
when the process timed out or exited non-zero (unless `allow_nonzero_exit=True`).

## Network

- `none` — enforced by `docker`, `e2b` and `firejail`. Not by `local`.
- `allowlist` — exact hosts. `e2b` enforces it natively. `docker` and `firejail` need a
  host-owned `NetworkEnforcer` on `ReasoningContext.network_enforcer`
  (`PreconfiguredNetworkEnforcer` binds pre-built networks you attest; it does not
  create any). Without one, strict mode fails.
- `host` — full host networking. The local runtime warns.

The runtime must also attest the result at prepare time. If it does not, strict mode
fails even when the static declaration said `enforced`.

## Failure modes

All failures return `success=False` with `error_message`. Observed messages:

| Situation | `error_message` |
| --- | --- |
| No policy on the context | `command execution requires a host-owned CommandPolicy on ReasoningContext` |
| Denied before launch | `command denied by application policy: <reason>`, e.g. `executable is not present in the exact allowlist`, `network policy 'host' is not allowed`, `best-effort enforcement is not allowed`, `environment keys are not allowed: ['OTHER']`, `explicit host working directories are not allowed`, `requested timeout 301.0 exceeds host maximum 300.0` |
| Approval missing, denied, or callback returned non-`True` | `command was not approved by the application host` |
| Async approval too slow | `command approval timed out` |
| Approval callback raised | `command approval callback failed: <exc>` |
| Strict mode, control not enforced | `runtime 'local' cannot strictly enforce requested controls: network` (or `cpu_limit`, …) |
| Context reference or limit problem | `failed to build runtime invocation: <detail>` |
| Timeout | `command timed out after <timeout>s` |
| Non-zero exit | `runtime process exited with code <N>` (`result_data` is still filled) |
| Runtime error, missing artifact | `sandbox runtime error: <detail>` |
| Artifact I/O too slow | `artifact I/O timed out after <artifact_io_timeout>s` |

A denied command never reaches the runtime: the backend is resolved only after policy
authorization.

## Deprecated fields and the `bash` alias

- `allow_unsafe_local` and `allow_unenforced_network` from old chains are dropped on
  load with a `DeprecationWarning`. They grant nothing. Use `CommandPolicy`.
- `"step_type": "bash"` in old JSON still loads as `command`. Saved chains use
  `"command"`.

## Limits

- `local` is not a sandbox. It enforces wall time, output size and artifact bounds,
  but not network, CPU, memory or PIDs.
- A program you allow can still read anything the host user can read. The policy
  controls *which* program runs, not what it does.
- Approving an interpreter (`sh -c`, `python -c`) approves the whole script it runs.
- `firejail` reports `memory_limit` and `pids_limit` as advisory and `cpu_limit` as
  unsupported. `e2b` reports wall time and output limit as advisory.

## See also

- [Shell session step](/carl/steps/shell-session/) — several static commands in one shell.
- [Command plan step](/carl/steps/command-plan/) — the LLM picks typed arguments for a host capability.
- [Sandboxing](/carl/skills/sandbox/) — runtime backends and how to install them.
- [Code step](/carl/steps/code/) — run generated Python under a host sandbox profile.
