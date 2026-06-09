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

## See also

- [AgentSkills overview](/carl/skills/overview/) · [Resolvers](/carl/skills/resolvers/)
