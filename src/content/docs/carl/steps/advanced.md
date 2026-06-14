---
title: Advanced Steps
description: MCP, AgentSkills, multi-agent orchestration, tool discovery, evaluation, and human-in-the-loop steps.
sidebar:
  order: 10
---

Beyond the [foundational steps](/carl/steps/overview/#foundational), CARL ships
step types for MCP, skills, multi-agent orchestration, and more. Each gets a full
guide in its own section; this page is the map with the essentials.

## MCP — call tools on an MCP server

`MCPStepDescription` + `MCPStepConfig`. Transports: `stdio`, `http`, `sse`.

```python
from mmar_carl import MCPStepDescription
from mmar_carl.models.config import MCPStepConfig, MCPServerConfig

MCPStepDescription(
    number=1,
    title="Call MCP tool",
    config=MCPStepConfig(
        server=MCPServerConfig(server_name="my_server", command="python", args=["-m", "my_mcp_server"]),
        tool_name="search",
        argument_mapping={"query": "$history[-1]"},
    ),
)
```

→ Full guide: [MCP overview](/carl/mcp/overview/).

## MCP resource — read a resource into memory

`MCPResourceStepDescription` + `MCPResourceStepConfig`. Fetches read-only data
(files, docs, schemas) and writes it to memory + history.

```python
from mmar_carl import MCPResourceStepDescription
from mmar_carl.models.config import MCPResourceStepConfig, MCPServerConfig

MCPResourceStepDescription(
    number=1,
    title="Load API reference",
    config=MCPResourceStepConfig(
        server=MCPServerConfig(server_name="docs", transport="sse", url="http://docs/sse"),
        resource_uri="docs://api/reference.md",
        output_memory_key="api_docs",
    ),
)
```

## Agent handoff — delegate to a sub-chain

`AgentHandoffStepDescription` runs a complete sub-chain with an isolated context;
inputs are resolved from parent memory/history and the result is merged back via
`config.output_memory_key`.

```python
from mmar_carl import AgentHandoffStepDescription
from mmar_carl.models.config import AgentHandoffStepConfig

AgentHandoffStepDescription(
    number=3,
    title="Delegate to research agent",
    sub_chain=research_chain,
    config=AgentHandoffStepConfig(
        input_mapping={"input.topic": "$memory.input.topic"},
        output_memory_key="research_result",
    ),
)
```

The sub-chain's full `ReasoningResult` is available at
`step_result.result_data["sub_result"]`.

## The rest at a glance

| Step | Class · config | What it does | Example |
| --- | --- | --- | --- |
| AgentSkill | `AgentSkillStepDescription` · `AgentSkillStepConfig` | Run an [AgentSkill](https://agentskills.io) folder (LLM / SCRIPT / HYBRID / SUBAGENT / LLM_AGENT modes; sandboxed). | [agent_skill_example.py](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/agent_skill_example.py) |
| Supervisor | `SupervisorStepDescription` · `SupervisorStepConfig` | LLM routes the task to one of N registered specialist sub-chains. | [supervisor_routing_example.py](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/supervisor_routing_example.py) |
| Debate | `DebateStepDescription` · `DebateStepConfig` | Round-robin role-based debate, then a judge synthesises. | — |
| Parallel sampling | `ParallelSamplingStepDescription` · `ParallelSamplingStepConfig` | Sample N independent responses, then vote / LLM-judge the best. | [llm_council_example.py](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/llm_council_example.py) |
| Human input | `HumanInputStepDescription` · `HumanInputStepConfig` | Pause for human input (in-process callable or webhook). | [human_in_the_loop_example.py](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py) |
| Tool discovery | `ToolDiscoveryStepDescription` · `ToolDiscoveryStepConfig` | Discover + register tools at runtime from a module / callables / dict. | — |
| Evaluation | `EvaluationStepDescription` · `EvaluationStepConfig` | Inline quality gate on a prior step's output; reacts via `on_fail` (continue / abort / retry-with-feedback). | — |

:::note
Each of these has a dedicated section with full guides:
[Orchestration](/carl/orchestration/overview/) (supervisor / debate / parallel
sampling / handoff / human-in-the-loop), [AgentSkills](/carl/skills/overview/),
[MCP](/carl/mcp/overview/), and [Evaluation](/carl/evaluation/metrics/). This page
is the at-a-glance map.
:::
