---
title: Sandboxing & LLM_AGENT
description: Run skill scripts in an isolated runtime, and the workspace model of LLM_AGENT mode.
sidebar:
  order: 3
---

Skills that run scripts (`SCRIPT`, `HYBRID`, `SUBAGENT`, `LLM_AGENT`) execute in a
**runtime** you choose. Pick a sandbox to contain untrusted code.

## Runtimes

Set `runtime` on `AgentSkillStepConfig` (with `runtime_config` for backend
options):

| `runtime` | Isolation |
| --- | --- |
| `local` | Run in a local subprocess (least isolation). |
| `docker` | Run inside a Docker container. |
| `e2b` | Run in an e2b cloud sandbox. |
| `firejail` | Run under firejail (Linux). |

```python
AgentSkillStepConfig(
    skill="github://anthropics/skills/skills/pdf@main",
    task="Extract text from {pdf_path}.",
    execution_mode=AgentSkillExecutionMode.LLM_AGENT,
    runtime="docker",
    extra_pip=["pdfplumber"],     # installed before scripts run
    trust_policy="sha_pinned",    # "any" | "sha_pinned"
)
```

## Network policy

A skill runtime's egress is governed by a `NetworkPolicy` — one of three string
values, defaulting to `"none"` (fail closed):

| Policy | Effect |
| --- | --- |
| `none` | No outbound network (the default). Containerised backends drop all egress (`--network none`); `local`/`firejail` can only document it. |
| `allowlist` | Only traffic to the hosts in `runtime_config["network_allowlist"]` (merged with the skill manifest's `WebFetch(domain:…)` declarations). |
| `host` | Full host networking — an escape hatch. Backends log a `UserWarning` when selected. |

Set the policy through `runtime_config`:

```python
AgentSkillStepConfig(
    skill="github://anthropics/skills/skills/pdf@main",
    task="Fetch and summarise {url}.",
    execution_mode=AgentSkillExecutionMode.LLM_AGENT,
    runtime="docker",
    runtime_config={
        "network": "allowlist",
        "network_allowlist": ["api.example.com"],
    },
)
```

:::caution
**Enforcement varies by backend.** `docker` and `firejail` actually enforce the
policy. The default `local` runtime and `e2b` only *honour the contract* — they
validate the policy string (a bad value raises early) and stash the resolved
policy + allowlist on the handle, but don't restrict egress. The handle's
`backend["network_enforced"]` flag records which case you're in.
:::

### Resolving the policy directly

If you build a custom runtime (below) you can reuse the same resolution helpers:

```python
from mmar_carl import (
    resolve_network_policy, parse_network_allowlist_from_allowed_tools,
)

# Normalise runtime_config + the manifest's allowed-tools into (policy, hosts).
policy, allowlist = resolve_network_policy(
    runtime_config,
    manifest_allowed_tools=manifest.get_allowed_tools(),
)

# Or pull just the WebFetch(domain:…) hosts out of an allowed-tools declaration.
hosts = parse_network_allowlist_from_allowed_tools("Bash(git:*) WebFetch(domain:api.x.com)")
# → ["api.x.com"]
```

`resolve_network_policy` raises `SkillRuntimeError` on an unknown policy string,
and merges the explicit `network_allowlist` with any `WebFetch(domain:…)` hosts
the skill manifest declares (so the manifest becomes the source of truth for the
egress a skill needs). `parse_network_allowlist_from_allowed_tools` ignores bare
`WebFetch` with no domain — an unconstrained policy is a deliberate choice for the
chain author, not the manifest.

## The LLM_AGENT workspace

`LLM_AGENT` mode matches the AgentSkills progressive-disclosure model: the LLM runs
a tool-calling loop (`run_script` / `read_file` / `write_file` / `list_resources`)
until it produces a final answer, all inside an isolated workspace.

- Input files from `input_mapping` are staged in `/workspace/in/`.
- Files the LLM writes to `/workspace/out/` are collected into
  `result_data["output_files"]`.
- `output_capture` (`"stdout"` / `"files"` / `"both"`) selects what's returned.
- `output_files_glob` filters which output files are kept.
- `llm_max_iterations` bounds the tool-call rounds.

## Trust

`trust_policy="sha_pinned"` (with `skill_sha256`) verifies the skill's `SKILL.md`
digest before running — see [resolvers](/carl/skills/resolvers/). `filter_security_terms`
(default `True`) strips password/encrypt/decrypt sections from the LLM prompt.

## Custom runtimes

`runtime` is dispatched through a registry, so you can plug in your own sandbox
without forking CARL. The built-in names (`local`, `docker`, `e2b`, `firejail`)
self-register on import; register additional ones yourself:

```python
from mmar_carl import (
    register_skill_runtime, get_skill_runtime, list_skill_runtimes,
)

class MySkillRuntime:
    name = "mysandbox"
    async def prepare(self, skill, workspace, config): ...    # → SkillRuntimeHandle
    async def run(self, handle, cmd, *, env=None, stdin=None, timeout=None, cwd=None): ...
    async def read_file(self, handle, path): ...
    async def write_file(self, handle, path, data): ...
    async def cleanup(self, handle): ...

register_skill_runtime(MySkillRuntime.name, MySkillRuntime)

list_skill_runtimes()              # ['docker', 'e2b', 'firejail', 'local', 'mysandbox']
runtime = get_skill_runtime("mysandbox")   # instantiates the registered class
```

The runtime must satisfy the `SkillRuntime` `Protocol`: five async methods —
`prepare` (builds a workspace, returns a `SkillRuntimeHandle`), `run` (executes one
command, returns a `RuntimeRunResult`), `read_file`, `write_file`, and `cleanup`
(idempotent teardown). The handle threads through every call so a backend can stay
stateful (e.g. hold a long-lived container), and carries `workspace_root` /
`workspace_in` / `workspace_out` plus a free-form `backend` dict.

`register_skill_runtime(name, cls)` registers a class (re-registering a name
overwrites it). `get_skill_runtime(name)` instantiates it and raises
`SkillRuntimeError` for an unknown name (with an "install the matching extra"
hint); `list_skill_runtimes()` returns the sorted registered names. All of these,
plus `NetworkPolicy`, `SkillRuntime`, `SkillRuntimeHandle`, `RuntimeRunResult`, and
`SkillRuntimeError`, are importable from `mmar_carl`.

## See also

- [AgentSkills overview](/carl/skills/overview/) · [Resolvers](/carl/skills/resolvers/)
