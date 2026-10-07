---
title: Code Step
description: Run Python source generated earlier in the run, with typed JSON input and output, inside a host-approved strict sandbox.
sidebar:
  order: 13
---

`CodeStepDescription` executes one Python program that an earlier step produced, for
example code written by an LLM step and stored in memory. Its behaviour is set by
`CodeStepConfig`. The step makes no LLM call.

The contract is narrow on purpose:

- The program comes from a **context reference**, never from the chain itself.
- The program defines exactly one function, `def run(inputs)`. CARL calls it with one
  JSON object and expects one JSON value back.
- Input and output are checked against **required** schemas.
- The code runs only in a **strict isolated runtime** that the host application
  approved. There is no local or best-effort mode.

`CodeStep` is not a shell step. It never takes an executable, argv or a shell script
from the chain. For running programs, see the [command step](/carl/steps/command/).

## Program contract

```python
def run(inputs):
    return {"answer": inputs["value"] * 2}
```

CARL parses the source before running it and rejects it (status `invalid_source`)
unless:

- it parses as Python;
- it has exactly one top-level function named `run`;
- `run` is a plain `def` (not `async def`) with no decorators;
- the signature is exactly `run(inputs)`: one parameter named `inputs`, no defaults,
  no `*args`, `**kwargs` or keyword-only parameters.

CARL executes the resolved string **as is**. It does not strip Markdown fences,
extract a code block, fix syntax or ask a model to retry. If your generator wraps code
in a fenced block, clean it up in an earlier step.

The returned value must be finite JSON: no `NaN`, no infinity, no cycles, string keys
only, nesting depth up to 64.

## Minimal example

This example runs for real. It needs Docker and a Python image that is already
present locally and pinned by digest. CARL runs Docker with `--pull=never`, so it never
downloads the image.

```python
import asyncio
import os

from mmar_carl import (
    CodeExecutionPolicy,
    CodeRuntimeProfile,
    CodeStepConfig,
    CodeStepDescription,
    ReasoningChain,
    ReasoningContext,
)

IMAGE = os.environ["CARL_CODE_IMAGE"]  # python@sha256:<64 hex>, already pulled

SOURCE = """def run(inputs):
    values = inputs["values"]
    return {"sum": sum(values), "count": len(values)}
"""

chain = ReasoningChain(steps=[
    CodeStepDescription(
        number=1,
        title="Run generated code",
        config=CodeStepConfig(
            source="$memory.generated.python_source",
            runtime_profile="python-safe-v1",
            input_mapping={"values": "$memory.input.values"},
            input_schema={
                "type": "object",
                "properties": {"values": {"type": "array", "items": {"type": "number"}}},
                "required": ["values"],
                "additionalProperties": False,
            },
            output_schema={
                "type": "object",
                "properties": {"sum": {"type": "number"}, "count": {"type": "integer"}},
                "required": ["sum", "count"],
                "additionalProperties": False,
            },
            timeout_seconds=5,
            output_key="statistics",
        ),
    ),
])

context = ReasoningContext(
    outer_context="",
    api=None,
    code_execution_policy=CodeExecutionPolicy(profiles={
        "python-safe-v1": CodeRuntimeProfile(
            runtime="docker",
            revision="python-3.12-slim",
            prepare_config={"image": IMAGE},
        ),
    }),
)
# Normally an earlier step writes the generated source.
context.memory_write("python_source", SOURCE, namespace="generated")
context.memory_write("values", [1, 2, 3, 4], namespace="input")

report = chain.preflight(context)
print(report.required_code_profiles, report.missing_code_profiles, report.all_present)

result = asyncio.run(chain.execute_async(context))
outcome = result.step_results[0].as_code_execution_outcome()
print(outcome.status, outcome.output, outcome.python_version)
print(context.memory_read("statistics", namespace="code"))
```

Output with a local `python:3.12-slim` image:

```text
['python-safe-v1'] [] True
completed {'sum': 10, 'count': 4} 3.12.13
{'sum': 10, 'count': 4}
```

Find the digest of a local image with
`docker image inspect python:3.12-slim --format '{{json .RepoDigests}}'`.

A longer version with a dry-run mode is in
[`examples/agents/code_step_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/agents/code_step_example.py).

## Fields

`CodeStepConfig` forbids unknown fields (`extra="forbid"`).

| Field | Type | Default | Rules |
| --- | --- | --- | --- |
| `source` | `str` | required | Context reference to the source text, such as `$memory.generated.code`. Must start with `$`; inline code is rejected. 1–1024 chars. |
| `runtime_profile` | `str` | required | Profile id in the host policy. Must match `[A-Za-z][A-Za-z0-9_.-]{0,127}`. |
| `input_mapping` | `dict[str, str]` | `{}` | Key of the `inputs` object to a `$` reference. Keys must be Python-style identifiers and unique. |
| `input_schema` | `dict` | required | Schema subset for the `inputs` object. Top-level `type` must be `"object"`. |
| `output_schema` | `dict` | required | Schema subset for the value `run` returns. |
| `timeout_seconds` | `float` | `10.0` | `> 0`. |
| `max_source_bytes` | `int` | `20000` | `> 0`. UTF-8 size of the source. |
| `max_input_bytes` | `int` | `1000000` | `> 0`. Canonical JSON size of `inputs`. |
| `max_output_bytes` | `int` | `1000000` | `> 0`. Canonical JSON size of the result. |
| `output_key` | `str \| None` | `None` | Memory key for the result. Written only on `completed`. Up to 256 chars. |
| `output_namespace` | `str` | `"code"` | Memory namespace for `output_key`. |

Static checks at construction time:

- Every key in `input_schema.required` must appear in `input_mapping`.
- If `input_schema.additionalProperties` is `false`, `input_mapping` may not add keys
  that the schema does not declare.

### Schema subset

Both schemas accept only the keys `type`, `properties`, `required`, `items`, `enum`
and `additionalProperties`. Any other keyword (`minLength`, `format`, `$ref`, ...) is
**rejected** when the config is built. Other rules:

- `type` is required on every node: one JSON type or a non-empty list of unique types.
- `properties`, `required` and `additionalProperties` need `"object"` in `type`;
  `items` needs `"array"`.
- Every name in `required` must be declared in `properties`.
- `additionalProperties` must be a boolean.

## Host policy

The chain stores only a profile **name**. What that name means is decided by the host
application, at run time:

```python
context.code_execution_policy = CodeExecutionPolicy(profiles={...})
```

`ReasoningContext.code_execution_policy` is excluded from serialization, so chain or
context JSON cannot grant itself execution rights. `"python-safe-v1"` in the examples
is just a name; CARL ships no built-in profiles.

`CodeRuntimeProfile` fields (all frozen, unknown fields forbidden):

| Field | Default | Meaning |
| --- | --- | --- |
| `runtime` | required | Registered runtime name, for example `"docker"`. |
| `revision` | required | Your label for this runtime build. Recorded in the outcome. |
| `interpreter` | `("python", "-I", "-B")` | Fixed argv prefix, up to 16 tokens. |
| `prepare_config` | `{}` | Runtime settings. For `docker`, `image` must be pinned as `name@sha256:<64 hex>`. `network` may only be `"none"`. The keys `_network_binding`, `extra_args`, `workspace_output_mode` are reserved. Max 16384 JSON bytes. |
| `cpu_limit` | `1.0` | CPUs. |
| `mem_limit` | `"256m"` | Memory limit. |
| `pids_limit` | `32` | Process limit. |
| `max_timeout_seconds` | `30.0` | Ceiling for the step's `timeout_seconds`. |
| `max_cleanup_seconds` | `30.0` | Time allowed for sandbox cleanup. |
| `max_source_bytes` / `max_input_bytes` / `max_output_bytes` | `20000` / `1000000` / `1000000` | Ceilings for the step limits. |

The effective limit is always the smaller of the step value and the profile ceiling.
The values used are recorded in `effective_limits`.

### Which runtimes qualify

Before any code runs, CARL checks the runtime's declared capabilities in strict mode.
The runtime must offer `container` or `microvm` isolation and must enforce wall-time,
output limit, CPU, memory, PID limits, `network="none"`, workspace files and artifact
output limits. At prepare time it must also confirm that network isolation is on and
that the workspace output mount is read-only.

Among the runtimes that ship with CARL, only **`docker`** passes. Checked with CARL
0.5.0:

| Runtime | Result | Missing controls |
| --- | --- | --- |
| `docker` | runs | none |
| `local` | `denied` | isolation, cpu_limit, memory_limit, pids_limit, network |
| `firejail` | `denied` | isolation, cpu_limit, memory_limit, pids_limit |
| `e2b` | `denied` | wall_time, output_limit, cpu_limit, memory_limit, pids_limit, artifact_output_limit |

A custom runtime registered with `register_skill_runtime()` qualifies only if its
capabilities and prepared handle confirm the same controls.

With Docker, CARL runs a fresh container with `--rm`, `--pull=never`, `--cap-drop=ALL`,
`no-new-privileges`, a read-only root filesystem, a bounded `noexec` `/tmp` tmpfs,
`--network none`, read-only workspace mounts and the CPU, memory (no extra swap) and
PID limits from the profile. The container gets only three files: the source, the input
JSON and CARL's runner script. No host environment variables, credentials or package
installs are passed in.

## Preflight

`ReasoningChain.preflight(context)` lists every profile that CodeSteps request in
`required_code_profiles`. Profiles that the context policy cannot resolve (or all of
them, if there is no policy) go to `missing_code_profiles`, and `all_present` becomes
`False`.

Preflight checks only that the **name** resolves. It does not check that the runtime
qualifies or that Docker and the image are available. Those problems show up at run
time as `denied`, `runtime_unavailable` or `failed`.

See [preflight](/carl/care-integration/preflight/).

## Result

Read the typed outcome with `StepExecutionResult.as_code_execution_outcome()`. It
returns a `CodeExecutionOutcome`:

| Field | Meaning |
| --- | --- |
| `status` | One of the statuses below. |
| `profile_id`, `runtime`, `runtime_revision` | Which profile and runtime ran. |
| `source_sha256`, `source_bytes` | Hash and size of the exact source. The source text is not copied into the outcome. |
| `input_sha256`, `output_sha256` | Hashes of the canonical input and output JSON. |
| `output` | The validated return value. Only on `completed`. |
| `python_version` | Interpreter version reported by the runner. |
| `stdout`, `stderr`, `stdout_truncated`, `stderr_truncated` | Bounded diagnostics from the program. |
| `elapsed_seconds` | Wall time. |
| `effective_limits` | Limits actually applied. |
| `enforcement_report` | The runtime's control report, including `isolation_accepted` and `gaps`. |
| `error_message` | Reason for a non-completed status. |

On `completed`, `result` is the output as canonical JSON and one history entry is
added. Only the return value goes into history; stdout does not.

### Statuses

| `status` | Meaning |
| --- | --- |
| `completed` | The only success. Output passed `output_schema` and size checks. |
| `invalid_source` | Source did not resolve to a string, was too large, did not parse, or broke the `run(inputs)` contract. |
| `invalid_input` | `inputs` was not finite JSON, failed `input_schema`, or exceeded `max_input_bytes`. |
| `denied` | No policy, unknown profile, or the runtime failed the strict controls check. Code was not run. |
| `runtime_unavailable` | Runtime name not registered, or the runtime raised `SkillRuntimeError` while preparing, or did not confirm network isolation and a read-only output mount. |
| `timed_out` | Execution exceeded the effective timeout. |
| `invalid_output` | Return value was not JSON, failed `output_schema`, exceeded `max_output_bytes`, or no result envelope came back (for example stdout was truncated). |
| `failed` | `run` raised, the process exited non-zero, another runtime error occurred, or cleanup failed. |
| `cancelled` | The run was cancelled. The result has `skipped=True`. |

`StepExecutionResult.success` is `True` only for `completed`. `output_key` is written
only then.

## Limits

- Python is the only language. The code can import only what is already installed in
  the image. There is no network and no package install.
- Timeout and cancellation stop the container. Cleanup is bounded by
  `max_cleanup_seconds`; a cleanup failure turns the result into `failed`.
- Program output shares a bounded stdout buffer with CARL's result envelope (output
  limit + 4096 bytes). Heavy printing can push the envelope out and give
  `invalid_output`.
- Source parsing is a contract check, not a security boundary. Isolation comes from
  the runtime.
- `cache` is not rejected on this step. A cache hit returns the stored result without
  running code and without writing `output_key`. See [caching](/carl/steps/caching/).

## Serialization

- The wire type is `"code"`. It entered the chain format at `format_version` 7.
  Chains saved by CARL 0.5.0 carry `format_version` 11. See
  [migration](/carl/serialization/migration/).
- The full `CodeStepConfig` round-trips through `to_dict()` / `from_dict()`. The
  policy does not, by design.
- `ChainBuilder` has no `add_code_step` helper. Build `CodeStepDescription` directly.

## See also

- [Command step](/carl/steps/command/): run a program from an explicit argv list.
- [LLM step](/carl/steps/llm/) and [structured output](/carl/steps/structured-output/):
  produce the source in an earlier step.
- [Preflight](/carl/care-integration/preflight/).
- [Dynamic references](/carl/chains/dynamic-references/).
