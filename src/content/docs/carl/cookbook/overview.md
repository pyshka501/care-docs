---
title: Cookbook
description: Runnable example chains by topic, mapped to the repo's examples/ directory.
sidebar:
  order: 1
---

Every concept in these docs has a runnable example in the CARL repo. This is the
index; each links to a complete, executable script.

## Running examples

```bash
# Set an API key for examples that call an LLM
export OPENAI_API_KEY="sk-or-v1-..."

# Run one example
PYTHONPATH=$(pwd) uv run python examples/orchestration/basic_chain_example.py

# Or run them all
make examples
```

Tool-only and metric examples run **without** an API key.

## Orchestration

| Example | Shows |
| --- | --- |
| [basic_chain](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/basic_chain_example.py) | Core chain, dependencies, serialization. |
| [parallel_branches](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/parallel_branches_example.py) | DAG parallelism across independent steps. |
| [conditions](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/conditions_example.py) | Conditional branching. |
| [loop_until](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/loop_until_example.py) | Loop-back until a condition holds. |
| [execution_modes_mock](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/execution_modes_mock_example.py) / [pipeline](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/execution_modes_pipeline_example.py) | FAST vs SELF_CRITIC. |

## Tool calling

| Example | Shows |
| --- | --- |
| [tool_steps](https://github.com/Glazkoff/carl-experiments/blob/main/examples/tool_calling/tool_steps_example.py) | Tool steps, memory, mixed chains. |
| [structured_output](https://github.com/Glazkoff/carl-experiments/blob/main/examples/tool_calling/structured_output_example.py) | Schema-constrained JSON output. |

## Agents (multi-agent)

| Example | Shows |
| --- | --- |
| [supervisor_routing](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/supervisor_routing_example.py) | LLM routing to specialists. |
| [llm_council](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/llm_council_example.py) | N-sample voting. |
| [human_in_the_loop](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py) | Pause for human input. |
| [agent_skill](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/agent_skill_example.py) | AgentSkill execution. |

## Evaluation

| Example | Shows |
| --- | --- |
| [metrics](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/metrics_example.py) | Custom + built-in metrics (no API key). |
| [dataset_evaluator](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/dataset_evaluator_example.py) | Batch evaluation + report. |
| [reflection](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/reflection_example.py) / [reflection_metrics](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/reflection_metrics_example.py) | Reflection, metric-fed reflection. |

## RE-PLAN

| Example | Shows |
| --- | --- |
| [deterministic](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_deterministic_example.py) · [llm_checker](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_llm_checker_example.py) · [voting](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_voting_example.py) · [checkpoint_rollback](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_checkpoint_rollback_example.py) · [budget_guard](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_budget_guard_example.py) | The RE-PLAN strategies. |

## Skills & LLM inference

| Example | Shows |
| --- | --- |
| [chain_from_description](https://github.com/Glazkoff/carl-experiments/blob/main/examples/skills/chain_from_description_example.py) | Generate a chain from NL. |
| [skill_resolver](https://github.com/Glazkoff/carl-experiments/blob/main/examples/skills/skill_resolver_example.py) | URI-based skill resolution. |
| [openrouter](https://github.com/Glazkoff/carl-experiments/blob/main/examples/llm_inference/openrouter_example.py) · [token_usage](https://github.com/Glazkoff/carl-experiments/blob/main/examples/llm_inference/token_usage_example.py) | OpenRouter, token accounting. |

## Build one yourself

See the [end-to-end tutorial](/carl/cookbook/end-to-end/) — a multi-step agent
built from scratch, combining LLM, tool, memory, and conditional steps.
