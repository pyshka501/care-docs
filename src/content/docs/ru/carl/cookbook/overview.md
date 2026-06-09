---
title: Cookbook
description: Запускаемые примеры цепочек по топикам, привязанные к каталогу examples/ репозитория.
sidebar:
  order: 1
---

У каждой концепции из этих доков есть запускаемый пример в репозитории CARL. Это
индекс; каждая ссылка ведёт на полный исполняемый скрипт.

## Запуск примеров

```bash
# Задайте API-ключ для примеров, вызывающих LLM
export OPENAI_API_KEY="sk-or-v1-..."

# Запустить один пример
PYTHONPATH=$(pwd) uv run python examples/orchestration/basic_chain_example.py

# Или все сразу
make examples
```

Примеры только с инструментами и метриками работают **без** API-ключа.

## Orchestration

| Пример | Что показывает |
| --- | --- |
| [basic_chain](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/basic_chain_example.py) | Базовая цепочка, зависимости, сериализация. |
| [parallel_branches](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/parallel_branches_example.py) | DAG-параллелизм независимых шагов. |
| [conditions](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/conditions_example.py) | Условное ветвление. |
| [loop_until](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/loop_until_example.py) | Цикл с возвратом до выполнения условия. |
| [execution_modes_mock](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/execution_modes_mock_example.py) / [pipeline](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/execution_modes_pipeline_example.py) | FAST vs SELF_CRITIC. |

## Tool calling

| Пример | Что показывает |
| --- | --- |
| [tool_steps](https://github.com/Glazkoff/carl-experiments/blob/main/examples/tool_calling/tool_steps_example.py) | Tool-шаги, память, смешанные цепочки. |
| [structured_output](https://github.com/Glazkoff/carl-experiments/blob/main/examples/tool_calling/structured_output_example.py) | JSON-вывод по схеме. |

## Агенты (мульти-агент)

| Пример | Что показывает |
| --- | --- |
| [supervisor_routing](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/supervisor_routing_example.py) | LLM-маршрутизация к специалистам. |
| [llm_council](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/llm_council_example.py) | Голосование по N-сэмплам. |
| [human_in_the_loop](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py) | Пауза для ввода человека. |
| [agent_skill](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/agent_skill_example.py) | Выполнение AgentSkill. |

## Оценка

| Пример | Что показывает |
| --- | --- |
| [metrics](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/metrics_example.py) | Свои + встроенные метрики (без API-ключа). |
| [dataset_evaluator](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/dataset_evaluator_example.py) | Пакетная оценка + отчёт. |
| [reflection](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/reflection_example.py) / [reflection_metrics](https://github.com/Glazkoff/carl-experiments/blob/main/examples/evaluation/reflection_metrics_example.py) | Рефлексия, рефлексия с метриками. |

## RE-PLAN

| Пример | Что показывает |
| --- | --- |
| [deterministic](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_deterministic_example.py) · [llm_checker](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_llm_checker_example.py) · [voting](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_voting_example.py) · [checkpoint_rollback](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_checkpoint_rollback_example.py) · [budget_guard](https://github.com/Glazkoff/carl-experiments/blob/main/examples/replan/replan_budget_guard_example.py) | Стратегии RE-PLAN. |

## Навыки и LLM-инференс

| Пример | Что показывает |
| --- | --- |
| [chain_from_description](https://github.com/Glazkoff/carl-experiments/blob/main/examples/skills/chain_from_description_example.py) | Генерация цепочки из NL. |
| [skill_resolver](https://github.com/Glazkoff/carl-experiments/blob/main/examples/skills/skill_resolver_example.py) | Разрешение навыков по URI. |
| [openrouter](https://github.com/Glazkoff/carl-experiments/blob/main/examples/llm_inference/openrouter_example.py) · [token_usage](https://github.com/Glazkoff/carl-experiments/blob/main/examples/llm_inference/token_usage_example.py) | OpenRouter, учёт токенов. |

## Соберите свою

См. [сквозной туториал](/ru/carl/cookbook/end-to-end/) — мульти-шаговый агент с нуля,
объединяющий LLM-, tool-, memory- и conditional-шаги.
