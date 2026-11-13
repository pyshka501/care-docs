---
title: Что такое CARL?
description: Формат, в котором пишутся цепочки рассуждений (типизированные шаги, зависимости, исполнение по DAG), и его эталонная библиотека mmar-carl 0.5.2.
sidebar:
  order: 1
---

**CARL** — формат, в котором пишутся цепочки рассуждений. Цепочка — это список
типизированных **шагов** с зависимостями, запросами к контексту и настройками
исполнения. Эталонная реализация — Python-библиотека `mmar-carl` (Collaborative
Agent Reasoning Library). Она читает цепочку, строит направленный ациклический
граф (DAG), запускает параллельно всё, что можно, и для каждого шага подбирает
нужный кусок входного контекста.

В Maestro цепочки генерируются в этом формате и исполняются этой библиотекой.
Само приложение Maestro пока работает на более старой закреплённой сборке CARL,
а не на 0.5.2, см.
[какой CARL запускает Maestro](/ru/carl/care-integration/overview/#какой-carl-запускает-maestro).
Писать и запускать цепочки CARL можно и напрямую из Python.

Текущий релиз **0.5.2** (2026-11-09, на PyPI как `mmar-carl`, исходники:
[github.com/AIRI-MAESTRO/carl](https://github.com/AIRI-MAESTRO/carl)).

## Что она умеет

- **Исполнение по DAG**: шаги идут параллельно, когда это позволяют зависимости.
- **29 типов шагов**: LLM и структурированный вывод, инструменты и MCP, память и
  преобразования, условия и циклы, ограниченные агенты и планировщики,
  делегирование в Claude Code и Codex, код и команды в строгой песочнице,
  ожидание и fan-out, выбор элементов, типизированные вопросы decision-модели,
  досрочная остановка, а также мультиагентная оркестрация (handoff, supervisor, debate, parallel sampling,
  human input). См. [список шагов](/ru/carl/steps/overview/).
- **Цепочки как инструменты**: проверенную цепочку можно встроить как
  типизированный изолированный инструмент.
- **Полномочия у хоста**: сериализованная цепочка только запрашивает.
  Инструменты, политики команд и кода, сетевые ограничения, обработчик ввода
  от человека, разрешение на локальных агентов и эндпоинты decision-моделей
  хост передаёт во время запуска.
- **Управление запуском**: fail-fast, пауза с подтверждением, возобновление,
  отмена, таймауты.
- **Async и стриминг**: `execute_async`, `stream_async`, колбэки по шагам.
- **Эволюция и оценка**: мутации цепочек, примитивы для внешних движков
  эволюции, метрики, оценка на датасетах, рефлексия.
- **Наблюдаемость**: трассы исполнения, токены и стоимость, Langfuse.
- **Клиенты**: любой OpenAI-совместимый API (OpenRouter, Azure, Ollama, vLLM,
  LM Studio) и нативный клиент Anthropic.

## Extras для установки

```bash
pip install 'mmar-carl==0.5.2'           # core
pip install 'mmar-carl[vector-search]'   # FAISS semantic context search
pip install 'mmar-carl[mcp]'             # Model Context Protocol steps
pip install 'mmar-carl[langfuse]'        # Langfuse tracing
pip install 'mmar-carl[pandas]'          # pandas helpers
pip install 'mmar-carl[viz]'             # PNG charts (matplotlib)
pip install 'mmar-carl[e2b]'             # E2B sandbox runtime
pip install 'mmar-carl[codex]'           # Codex step (openai-codex SDK)
pip install 'mmar-carl[skills]'          # AgentSkills catalog + pdf + pptx
pip install 'mmar-carl[all]'             # everything above
```

OpenAI SDK, `jsonschema` и `httpx` входят в базовые зависимости, extra `openai`
нет. Extra `mcp` фиксирует MCP SDK на ветке 1.x. Ни одним extra не покрыты: `AnthropicClient` требует `pip install anthropic`,
а шагу Claude Code нужен CLI `claude` в `PATH`.

Нужен Python 3.12+.

## Что дальше

- [Быстрый старт](/ru/carl/getting-started/quick-start/): первая цепочка, работает без сети.
- [Основные понятия](/ru/carl/concepts/what-is-carl/): как всё устроено.
