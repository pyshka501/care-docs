---
title: Shell Session Step
description: Run a static list of shell commands in one POSIX shell process, with shared cwd and variables.
sidebar:
  order: 16
---

`ShellSessionStepDescription` runs a **static** script in one shell process. Its
behaviour is set by `ShellSessionStepConfig`. The commands share the working
directory, shell variables, functions and filesystem state for the life of the step.
The next step starts a fresh shell and receives only declared artifacts.

Use it when you need shell features (`cd`, pipes, functions, redirection) and the
script is known when the chain is built. For a single program with dynamic arguments,
use a [command step](/carl/steps/command/).

How it runs:

- The commands are joined with newlines and piped to `<shell> -s` on stdin.
- With `stop_on_error=True` (default) the script starts with `set -e`.
- Commands are **not** interpolated from context. Dynamic values reach the script only
  as `CARL_ARG_<NAME>` environment variables or as input artifacts.
- The whole script is covered by the approval fingerprint.
- The shell needs host approval by default, even if it is in `allowed_executables`.

## Minimal example

```python
import asyncio

from mmar_carl import (
    CommandPolicy,
    ReasoningChain,
    ReasoningContext,
    ShellSessionStepConfig,
    ShellSessionStepDescription,
)

chain = ReasoningChain(
    steps=[
        ShellSessionStepDescription(
            number=1,
            title="Prepare and report",
            config=ShellSessionStepConfig(
                shell="/bin/sh",
                commands=[
                    "mkdir work",
                    "cd work",                      # cwd persists to the next line
                    'greet() { printf "hi %s\\n" "$1"; }',
                    'greet "$CARL_ARG_NAME"',       # dynamic value via env only
                    'printf "%s\\n" "${PWD##*/}"',
                ],
                input_mapping={"name": "$outer_context"},
                runtime="local",
                network="host",
            ),
        )
    ]
)

context = ReasoningContext(
    outer_context="Ada",
    api=llm_client,  # unused by this step
    command_policy=CommandPolicy(
        approval_required_executables=frozenset({"/bin/sh"}),
        allowed_runtimes=frozenset({"local"}),
        allowed_networks=frozenset({"host"}),
    ),
    on_command_approval_requested=lambda request: True,  # a real host asks a person
)
result = asyncio.run(chain.execute_async(context))
step = result.step_results[0]
print(step.result)                           # "hi Ada\nwork\n"
print(step.result_data["command_count"])     # 5
print(step.result_data["approval"])          # "approved"
```

`network="host"` is declared because `local` cannot isolate the network. With the
default `network="none"` and strict mode the step fails before launch. See the
[command step caution](/carl/steps/command/#minimal-example).

A two-step example that passes a file between fresh shells through artifacts is in
[`examples/orchestration/shell_session_artifacts_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/shell_session_artifacts_example.py).

## ShellSessionStepConfig

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `commands` | `list[str]` | — (required) | Script lines. At least one; each non-blank and without NUL. |
| `shell` | `str` | `"/bin/sh"` | Shell executable. On `local`/`firejail` the policy needs this exact absolute path. |
| `stop_on_error` | `bool` | `True` | Prefix the script with `set -e`. |

All shared runtime fields apply: `input_mapping`, `env`, `artifact_inputs`,
`artifact_outputs`, `working_dir`, `runtime`, `enforcement_mode`, `network`,
`network_allowlist`, `timeout`, `artifact_io_timeout`, `cpu_limit`, `mem_limit`,
`pids_limit`, `allow_nonzero_exit`, `max_output_bytes`, `output_key`. Defaults and
meaning are in the [command step table](/carl/steps/command/#shared-runtime-fields).
Here `input_mapping` values are exported as `CARL_ARG_<NAME>` only. Nothing is
appended to argv, which is always `[shell, "-s"]`.

The step cannot be cached.

## Policy and approval

The policy is the same `CommandPolicy` as for [command steps](/carl/steps/command/#commandpolicy).
For a shell session the "executable" is the shell.

- With `require_approval_for_interpreters=True` (default) every shell session needs
  approval, whichever list the shell is in. The `CommandApprovalRequest` has
  `invocation_kind="shell_session"`.
- The fingerprint covers the full script (it is the stdin hash), env, runtime, network,
  resources and artifact manifest. Any edit to the script changes it.
- Approving the shell approves **every** command in the script. The executable allowlist
  cannot restrict programs started inside the script. Review the script itself, and run
  untrusted sessions in a real sandbox runtime, not `local`.
- The script size counts against `CommandPolicy.max_stdin_bytes`
  (default `1_000_000`).

If the host sets `require_approval_for_interpreters=False` and lists the shell in
`allowed_executables`, sessions run without a callback. That is a deliberate host
decision.

## Result

`result` is stdout. `result_data` has the same keys as a command step
(`stdout`, `stderr`, `exit_code`, `policy_decision`, `approval`,
`enforcement_report`, `network_*`, `artifacts`, `artifact_manifest`, truncation flags,
`<output_key>`), plus:

| Key | Content |
| --- | --- |
| `shell` | The configured shell |
| `command_count` | Number of entries in `commands` |
| `script_sha256` | SHA-256 of the exact script sent to stdin, including the `set -e` prefix |

There is no `command`, `command_source` or `resolved_argument_count`. The history
entry is `Step N. <title> [SHELL_SESSION exit=<code>]` followed by stdout.

## Failure modes

Failures follow the [command step table](/carl/steps/command/#failure-modes). Specific
to shell sessions:

- With `stop_on_error=True`, the first failing command stops the script and the step
  fails with `runtime process exited with code <N>`. Lines after it do not run.
- With `stop_on_error=False`, the exit code is that of the last command. A failing
  middle line does not fail the step.
- A script over `max_stdin_bytes` fails with
  `failed to build runtime invocation: shell script exceeds the host stdin byte limit`.
- No approval callback, or a refusal: `command was not approved by the application host`.

## Limits

- One process per step. State does not carry over to the next step; use artifacts.
- `set -e` has the usual POSIX exceptions (commands in conditions, in pipelines except
  the last, after `||`/`&&`).
- On `local` the shell runs as the host user with no isolation of network, CPU, memory
  or PIDs. Wall time and output size are enforced.
- The script is static. To vary behaviour, read `CARL_ARG_*` or artifact files inside
  it; do not try to build commands from context.

## See also

- [Command step](/carl/steps/command/) — shared runtime fields, `CommandPolicy`, artifacts, `EnforcementReport`.
- [Command plan step](/carl/steps/command-plan/)
- [Sandboxing](/carl/skills/sandbox/) — runtime backends.
