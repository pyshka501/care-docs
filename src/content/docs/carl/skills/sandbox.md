---
title: Sandboxing & LLM_AGENT
description: Where AgentSkill scripts actually run, what the runtime backends enforce, the network policy, and the LLM_AGENT workspace.
sidebar:
  order: 3
---

This page covers isolation for **AgentSkill steps**. Sandboxed execution of
commands lives in [CommandStep](/carl/steps/command/),
[ShellSessionStep](/carl/steps/shell-session/) and
[CodeStep](/carl/steps/code/); they share the runtime backends described below.

## Where skill scripts run

`AgentSkillStepConfig.runtime` defaults to `"local"`. In CARL 0.5.0 this is the
only runtime an AgentSkill step can execute scripts with. `LocalSkillRuntime`
starts a host subprocess: the script sees the host filesystem, the host network
and, unless `extra_pip` is set, the full host environment including credentials.
It emits a one-time `UserWarning` that says so.

Setting `runtime` to `docker`, `e2b` or `firejail` does not sandbox the skill.
Every script launch then raises `SkillRuntimeError` ("AgentSkill script execution
on non-local runtimes requires a staged workspace and is not implemented yet").
What that means per mode:

| Mode | With a non-local `runtime` |
| --- | --- |
| `LLM` | Runs normally; no script is launched. |
| `SCRIPT` | Step fails. |
| `HYBRID` | Script fails, the step falls back to the LLM (`result_data["script_error"]`, `llm_fallback=True`). |
| `SUBAGENT` | Script fails, the LLM runs with an error note in the prompt; the step can succeed. |
| `LLM_AGENT` | Step fails as soon as the model calls `run_script`. |

`extra_pip` is installed through the same path, so it also works only on `local`
(with the host's `pip`). An unknown runtime name fails the step before anything
runs.

:::caution
Treat every AgentSkill that runs scripts as trusted code on your machine. For
untrusted code, use a fixed [CommandStep](/carl/steps/command/) with a host-owned
`CommandPolicy` and a sandboxed runtime.
:::

## Runtime backends

Four backends are registered on import: `local`, `docker`, `e2b`, `firejail`.
Each declares a `RuntimeCapabilities` record. `enforced` means the backend
prevents the violation, `advisory` means it records or applies the control only
after the fact, `unsupported` means it does nothing.

| Control | `local` | `docker` | `firejail` | `e2b` |
| --- | --- | --- | --- | --- |
| `isolation` | `none` | `container` | `process` | `microvm` |
| `wall_time` | enforced (POSIX) | enforced | enforced | advisory |
| `output_limit` | enforced | enforced | enforced | advisory |
| `cpu_limit` | unsupported | enforced | unsupported | unsupported |
| `memory_limit` | unsupported | enforced | advisory | unsupported |
| `pids_limit` | unsupported | enforced | advisory | unsupported |
| `network_none` | unsupported | enforced | enforced | enforced |
| `network_allowlist` | unsupported | unsupported | unsupported | enforced |
| `workspace_files` | enforced | enforced | enforced | enforced |
| `persistent_shell` | unsupported | unsupported | unsupported | unsupported |
| `artifact_output_limit` | enforced | enforced | enforced | advisory |

Prerequisites: `docker` needs the Docker CLI and daemon, `firejail` needs Linux
with firejail, `e2b` needs `pip install 'mmar-carl[e2b]'` and an API key (read
from `E2B_API_KEY` by default).

```python
from mmar_carl import (
    assess_runtime_enforcement, get_runtime_capabilities, get_skill_runtime,
)

runtime = get_skill_runtime("docker")
get_runtime_capabilities(runtime).network_allowlist   # "unsupported"

report = assess_runtime_enforcement(
    runtime, mode="strict", network="allowlist",
    cpu_limit_requested=True, memory_limit_requested=True, pids_limit_requested=False,
)
report.gaps             # ("network",)
report.fully_enforced   # False
report.as_dict()        # runtime, isolation, mode, controls, gaps
```

`get_runtime_capabilities()` returns an all-`unsupported` record with
`isolation="unknown"` for a runtime that declares nothing.
`assess_runtime_enforcement()` builds the `EnforcementReport` that command steps
use: with `enforcement_mode="strict"` they refuse to start when a requested
control has a gap. AgentSkill steps do not produce an enforcement report.

## Network policy

`runtime_config["network"]` takes one of three values (`NetworkPolicy`):

| Policy | Meaning |
| --- | --- |
| `none` (default) | Request no egress. |
| `allowlist` | Request egress only to exact hosts from `runtime_config["network_allowlist"]` plus `WebFetch(domain:...)` hosts from the skill's `allowed-tools`. At least one host is required; CIDRs, wildcards, URLs and ports are rejected. |
| `host` | Full host networking; backends emit a `UserWarning`. |

What the backends do with it:

- **local**: validates and records the policy (`handle.backend["network_enforced"]
  = False`). It cannot block anything.
- **docker** / **firejail**: `none` maps to `--network none` / `--net=none`.
  `allowlist` without a host-issued binding also runs with no network at all
  (fails closed). With a `DockerNetworkBinding` / `FirejailNetworkBinding` from a
  host `NetworkEnforcer`, the container joins the pre-provisioned network or
  interface.
- **e2b**: passes `none` and `allowlist` to the E2B create API.

For an AgentSkill step only the first case applies: the policy string is
validated (an unknown value fails the step) and then ignored by `local`.

```python
from mmar_carl import resolve_network_policy, parse_network_allowlist_from_allowed_tools

policy, hosts = resolve_network_policy(
    {"network": "allowlist", "network_allowlist": ["api.example.com"]},
    manifest_allowed_tools="Read WebFetch(domain:docs.example.com)",
)
# ("allowlist", ["api.example.com", "docs.example.com"])

parse_network_allowlist_from_allowed_tools("Bash(git:*) WebFetch(domain:api.x.com)")
# ["api.x.com"]; a bare WebFetch with no domain is ignored
```

### Host-owned network enforcement

A hostname list in chain JSON is not proof that a filter exists. Managed egress
is a host-side contract in `mmar_carl.network_enforcement`: a `NetworkEnforcer`
plans, acquires and releases a lease for a `ManagedNetworkProfile`.
`PreconfiguredNetworkEnforcer` is the shipped implementation. It is an
attestation adapter: it creates no Docker networks, configures no interfaces and
installs no firewall rules; the operator vouches that each binding enforces the
exact allowlist. The enforcer sits on `ReasoningContext.network_enforcer`, is
runtime-only and never serialized. Command steps use it; AgentSkill steps do not.

## The LLM_AGENT workspace

`LLM_AGENT` creates a temporary directory `carl_skill_*` with `in/` and `out/` and
runs a tool-calling loop with five fixed tools:

| Tool | What it does |
| --- | --- |
| `list_resources()` | Lists the skill's scripts, references and assets. |
| `read_resource(resource_path)` | Reads a file under the skill dir (first 8000 chars). |
| `read_file(path)` | Reads a file (first 10000 chars). `/workspace/in` and `/workspace/out` are mapped to the temp dirs; relative paths are relative to the skill dir. |
| `write_file(filename, content)` | Writes `out/<basename>`. |
| `run_script(script_path, args)` | Runs a `.py` (with `python_executable`) or `.sh` (with `/bin/sh`) script through the local runtime, `cwd` = `working_dir` or skill dir. |

- `input_mapping` values that are paths to existing host files are copied into
  `in/`; other values are passed through as text.
- Files in `out/` matching `output_files_glob` go to `result_data["output_files"]`
  as `{path, name, size}`.
- `output_capture` picks the step result: `"stdout"` (final answer), `"files"`
  (JSON list of files) or `"both"` (answer plus file names).
- The loop stops on a reply with no tool calls or after `llm_max_iterations`
  (default 8). Cancellation is checked before every round.
- Each call emits `llm_agent.tool_call` and `llm_agent.tool_result` step events.
- The workspace is deleted afterwards unless `persist_workspace=True`.

:::caution[The workspace is not a sandbox]
`/workspace/...` is a naming convention, not isolation. The tools run in the
CARL process on the host: `read_file` accepts any absolute path and
`read_resource` follows `../`, so the model can read any file the process can
read. The real temp paths are also shown in the system prompt. `write_file` is
limited to `out/`. Scripts run on the host as described above.
:::

## Custom runtimes

You can register your own backend. It becomes available to command steps and to
`get_skill_runtime()`. AgentSkill steps still reject any runtime whose `name` is
not `"local"`.

```python
from typing import ClassVar
from mmar_carl import RuntimeCapabilities, register_skill_runtime, list_skill_runtimes

class MySandbox:
    name: ClassVar[str] = "mysandbox"
    capabilities: ClassVar[RuntimeCapabilities] = RuntimeCapabilities(
        isolation="container", wall_time="enforced", network_none="enforced",
    )
    async def prepare(self, skill, workspace, config): ...           # -> SkillRuntimeHandle
    async def run(self, handle, cmd, *, env=None, stdin=None, timeout=None, cwd=None): ...
    async def read_file(self, handle, path): ...
    async def read_file_bounded(self, handle, path, max_bytes, timeout=None): ...
    async def write_file(self, handle, path, data): ...
    async def cleanup(self, handle): ...                              # idempotent

register_skill_runtime(MySandbox.name, MySandbox)
list_skill_runtimes()   # ['docker', 'e2b', 'firejail', 'local', 'mysandbox']
```

The `SkillRuntime` protocol requires `name`, `capabilities` and the six async
methods above. `run` returns a `RuntimeRunResult` (`stdout`, `stderr`,
`exit_code`, `duration_s`, truncation flags). A runtime that declares no
capabilities is treated as unsupported for every control.
`register_skill_runtime` overwrites an existing name; `get_skill_runtime`
raises `SkillRuntimeError` for an unknown one.

## See also

- [AgentSkills overview](/carl/skills/overview/) · [Resolvers](/carl/skills/resolvers/)
- [CommandStep](/carl/steps/command/) · [ShellSessionStep](/carl/steps/shell-session/) · [CodeStep](/carl/steps/code/)
