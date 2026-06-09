---
title: AgentSkills Overview
description: Run portable AgentSkill folders (SKILL.md) as a step, in several execution modes.
sidebar:
  order: 1
---

[AgentSkills](https://agentskills.io) are portable skill folders — a `SKILL.md`
with instructions plus optional scripts, references, and assets.
`AgentSkillStepDescription` runs one as a chain step.

```python
from mmar_carl import AgentSkillStepDescription, AgentSkillStepConfig, AgentSkillExecutionMode

AgentSkillStepDescription(
    number=1,
    title="Extract PDF text",
    config=AgentSkillStepConfig(
        skill="github://anthropics/skills/skills/pdf@main",
        task="Extract the text from {pdf_path} and summarise it.",
        execution_mode=AgentSkillExecutionMode.LLM_AGENT,
        input_mapping={"pdf_path": "$memory.input.pdf_path"},
    ),
)
```

## Skill identity

The `skill` field accepts a URI string (or an `AgentSkillSource`) — see
[resolvers](/carl/skills/resolvers/):

| Form | Example |
| --- | --- |
| GitHub tarball | `github://anthropics/skills/skills/pdf@main` |
| Local path | `/path/to/skill` |
| Python package | `module://my_pkg.skills.pdf` |
| Skill name | `pdf` (searched in `~/.agents/skills/`, `./.claude/skills/`, …) |

## Execution modes

| Mode | Behaviour |
| --- | --- |
| `LLM` | `SKILL.md` as a system prompt; a single LLM call (default). |
| `SCRIPT` | Run a bundled script directly; no LLM call. |
| `HYBRID` | Script first, LLM fallback. |
| `SUBAGENT` | Script collects data, LLM synthesises. |
| `LLM_AGENT` | Iterative tool-calling loop: the LLM calls `run_script` / `read_file` / `write_file` / `list_resources` until it has a final answer; workspace-isolated. |

## Key config fields

| Field | Default | Purpose |
| --- | --- | --- |
| `skill` | — | Skill URI / source. |
| `task` | — | The task text (supports `{placeholders}` from `input_mapping`). |
| `execution_mode` | `LLM` | One of the modes above. |
| `input_mapping` | `{}` | Inputs (also staged as files in `LLM_AGENT` mode). |
| `output_memory_key` | `None` | Where to store the result. |
| `llm_max_iterations` | — | Max tool-call rounds in `LLM_AGENT` mode. |
| `output_capture` | — | `"stdout"` / `"files"` / `"both"`. |
| `filter_security_terms` | `True` | Strip password/encrypt sections from the LLM prompt. |
| `extra_pip` | `[]` | Packages installed before running scripts. |

See [sandboxing](/carl/skills/sandbox/) for `runtime`, `trust_policy`, and the
`LLM_AGENT` workspace.

## See also

- [Skill resolvers](/carl/skills/resolvers/) · [Sandboxing & LLM_AGENT](/carl/skills/sandbox/)
- [AgentSkill example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/agent_skill_example.py) (PDF → analysis → PPTX).
