---
title: Command Plan Step
description: Let an LLM choose typed arguments for a host-owned command capability, then run the plan through an approved CommandStep.
sidebar:
  order: 15
---

`CommandPlanStepDescription` asks an LLM to pick **one** command capability and fill its
arguments. The model chooses arguments only. It never supplies an executable, an argv
prefix, a runtime, a network mode or resource limits. The step itself runs nothing.

A later [`CommandStep`](/carl/steps/command/) with `plan_source` re-validates the plan
and executes it. Planned commands always need host approval.

The split of authority:

| Lives in the chain JSON | Lives only in the host process |
| --- | --- |
| `instruction`, requested `capability_ids`, planner `input_mapping` | `CommandCapabilityRegistry`: ids, argument schemas, executables, static args, argv builders |
| `plan_source`, `planned_capability_ids` on the CommandStep | `CommandPolicy` and the approval callback |

`chain.to_dict()` never emits the registry. The context field
`command_capability_registry` is excluded from serialization.

## Minimal example

The stub client below stands in for a real model.

```python
import asyncio
import json

from pydantic import BaseModel, ConfigDict, Field

from mmar_carl import (
    CommandApprovalRequest,
    CommandCapability,
    CommandCapabilityRegistry,
    CommandPlanStepConfig,
    CommandPlanStepDescription,
    CommandPolicy,
    CommandStepConfig,
    CommandStepDescription,
    LLMClientBase,
    ReasoningChain,
    ReasoningContext,
)


class EchoArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")  # required by CommandCapability
    text: str = Field(min_length=1, max_length=80)


registry = CommandCapabilityRegistry(
    [
        CommandCapability(
            capability_id="text.echo",
            description="Echo one short line",
            executable="/bin/echo",
            static_args=(),
            argument_model=EchoArgs,
            argv_builder=lambda args: [args.text],  # pure, no I/O
            revision="r1",
        )
    ]
)


class StubPlanner(LLMClientBase):
    """Stands in for a real model in this example."""

    async def get_response(self, prompt: str) -> str:
        return json.dumps({"capability_id": "text.echo", "arguments": {"text": "hello"}})

    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)


chain = ReasoningChain(
    steps=[
        CommandPlanStepDescription(
            number=1,
            title="Plan",
            config=CommandPlanStepConfig(
                instruction="Greet the user.",
                capability_ids=["text.echo"],
            ),
        ),
        CommandStepDescription(
            number=2,
            title="Run the approved plan",
            dependencies=[1],
            config=CommandStepConfig(
                plan_source="$steps.1.result_data.plan",
                planned_capability_ids=["text.echo"],
                runtime="local",
                network="host",
            ),
        ),
    ]
)


def approve(request: CommandApprovalRequest) -> bool:
    print(request.source, request.capability_id, request.capability_revision, request.argv)
    return True  # a real host asks a person


context = ReasoningContext(
    outer_context="",
    api=StubPlanner(),
    command_capability_registry=registry,
    command_policy=CommandPolicy(
        allowed_executables=frozenset({"/bin/echo"}),
        allowed_runtimes=frozenset({"local"}),
        allowed_networks=frozenset({"host"}),
        allow_planned_local=True,  # planned commands on the host are off by default
    ),
    on_command_approval_requested=approve,
)
result = asyncio.run(chain.execute_async(context))
print(result.step_results[0].result_data["plan"])
print(result.step_results[1].result)  # "hello\n"
```

The callback prints `planned text.echo r1 ('/bin/echo', 'hello')`, and step 2 prints
`hello`. A hermetic variant with a recording runtime (no subprocess at all) is in
[`examples/orchestration/command_plan_capabilities_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/command_plan_capabilities_example.py).

## CommandPlanStepConfig

The config forbids extra fields.

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `instruction` | `str` | — (required) | Task for the planner. 1–16 000 characters, no NUL. |
| `capability_ids` | `list[str]` | — (required) | Capabilities the model may choose from. 1–32 unique ids matching `[A-Za-z][A-Za-z0-9_.-]{0,127}`. Each must exist in the registry. |
| `input_mapping` | `dict[str, str]` | `{}` | Up to 32 named context references included in the planner prompt as JSON. A reference that resolves to `None` fails the step. |

`CommandPlanStepDescription` also has:

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `llm_config` | `LLMStepConfig \| None` | `None` | Per-step LLM override. |
| `retry_max` | `int \| None` | `None` | 1–10. Falls back to `context.retry_max`. |
| `timeout` | `float` | `30.0` | Planning call timeout, at most 300 seconds. |

The step cannot be cached, because the registry it depends on is runtime-only.

## Capabilities and the registry

`CommandCapability` is a frozen dataclass:

| Field | Meaning |
| --- | --- |
| `capability_id` | Id the model selects. |
| `description` | Shown to the model. |
| `executable` | Program to run. Same exact-match rules as in `CommandPolicy` (absolute path for `local`/`firejail`). |
| `static_args` | Fixed argv prefix after the executable (a tuple). |
| `argument_model` | Pydantic model with `ConfigDict(extra="forbid")`. Its JSON schema is shown to the model. |
| `argv_builder` | Trusted host function: validated model → dynamic argv suffix. It must be pure and deterministic, because approval inspects its output before anything runs. |
| `revision` | Your version label, e.g. `"r1"`. |

`capability.fingerprint` is a SHA-256 over id, description, executable, static args,
revision and the argument schema. Any change to these changes the fingerprint.

`CommandCapabilityRegistry(capabilities, max_prompt_bytes=128_000,
max_input_value_bytes=32_000, max_response_bytes=64_000)` holds the capabilities.
The limits cap the planner prompt, each planner input value and the model response.

The model sees only `capability_id`, `description` and `arguments_schema` for the
requested ids. The prompt asks for one JSON object with exactly the keys
`capability_id` and `arguments`.

## The plan record

The model's reply is parsed strictly as `CommandPlanEnvelope` (extra keys such as
`executable` are rejected), then `registry.validate_plan()` validates the arguments
against `argument_model` in strict mode and binds provenance. The result is a
`CommandPlanRecord`:

```python
{
    "capability_id": "text.echo",
    "capability_revision": "r1",
    "capability_fingerprint": "f0c2514c…",
    "arguments": {"text": "hello"},
    "arguments_sha256": "cbbbdcd2…",
}
```

### Result

`result` is the record as JSON. `result_data` holds `plan` (the record dict),
`capability_id`, `capability_revision`, `capability_fingerprint` and
`arguments_sha256`. The history entry names the selected capability.

## Running a plan

A planned `CommandStep` sets:

- `plan_source` — `$steps.<N>.result_data.plan`, or `$metadata.<key>` for a record
  supplied by the host.
- `planned_capability_ids` — the ids this step accepts. It narrows the registry, it
  never widens it. Required with `plan_source`.
- No `command` and no `input_mapping`. Typed values go through the plan.

At execution CARL:

1. Re-validates the record against the current registry: revision, fingerprint and
   `arguments_sha256` must match. A changed capability fails the step.
2. Evaluates `CommandPolicy` on the executable and static prefix only. A denied plan
   never runs the argv builder.
3. Calls `argv_builder` once, then evaluates the policy again on the final argv.
4. Always asks for approval. The `CommandApprovalRequest` has `source="planned"` and
   carries `capability_id`, `capability_revision`, `capability_fingerprint` and
   `arguments_sha256`.

The CommandStep's `result_data` then has `command_source="planned"`, the capability
id, revision and fingerprint, and `resolved_argument_count`. See
[Command step](/carl/steps/command/#result).

## Policy

- `CommandPolicy.require_approval_for_planned` is typed `Literal[True]`. Passing
  `False` raises a validation error. Without an approval callback a planned command
  fails.
- `CommandPolicy.allow_planned_local` defaults to `False`, so planned commands on
  `local` are denied unless the host opts in.
- All other policy rules (exact executables, runtimes, networks, ceilings) apply as for
  static commands.

## Replay

`chain.replay(...)` does not trust a stored plan. It re-validates each recorded
`CommandPlanRecord` against the current registry. If the capability changed, replay
raises `trace step <N> command capability changed; re-plan required`. Replay without a
registry raises as well.

## Failure modes

| Situation | Step | `error_message` |
| --- | --- | --- |
| No registry on the context | plan | `command planning requires a host-owned CommandCapabilityRegistry` |
| Unknown id, oversized input or prompt | plan | `failed to build command plan request: <detail>` |
| Model reply has extra keys, wrong types, unknown capability | plan | `command planner returned an invalid typed plan (<ExceptionType>)` (the raw reply is not echoed) |
| Planning call too slow | plan | `command planning timed out after <timeout>s` |
| Plan step failed, so the reference is empty | command | `failed to build runtime invocation: plan_source resolved to no value` |
| Registry revision or fingerprint changed | command | `failed to build runtime invocation: command plan record failed validation (ValueError)` |
| Planned command on `local` without opt-in | command | `command denied by application policy: LLM-planned host execution is not allowed` |
| No approval callback, or it said no | command | `command was not approved by the application host` |
| `argv_builder` raised | command | `failed to materialize validated command plan (<ExceptionType>)` |

Other failures (timeouts, non-zero exit, strict enforcement gaps) are the same as for
[static commands](/carl/steps/command/#failure-modes).

## Limits

- One capability per plan. Several commands need several plan/command pairs.
- The model can still choose harmful *values* within the schema. Constrain the
  argument model tightly (lengths, enums, patterns) and review in the approval callback.
- The registry is not persisted. The host must rebuild it with the same revisions to
  run or replay a stored plan.

## See also

- [Command step](/carl/steps/command/) — runtime fields, `CommandPolicy`, result keys.
- [Shell session step](/carl/steps/shell-session/)
- [Sandboxing](/carl/skills/sandbox/) — runtime backends.
