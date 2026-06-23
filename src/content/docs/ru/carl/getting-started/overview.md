---
title: Что такое CARL?
description: Формат, в котором описываются reasoning-цепочки — типизированные шаги, зависимости и исполнение на DAG; mmar-carl — его эталонная библиотека.
sidebar:
  order: 1
---

**CARL** — это формат, в котором описываются reasoning-цепочки. Цепочка — это
список типизированных **шагов** с зависимостями, контекстными запросами под
каждый шаг и настройками исполнения. Эталонная реализация формата — Python-
библиотека `mmar-carl` (Collaborative Agent Reasoning Library): она читает
цепочку, строит направленный ациклический граф (DAG), запускает параллельно всё,
что можно, и автоматически извлекает релевантный контекст из входных данных под
каждый шаг.

В MAESTRO цепочки в этом формате создаёт MAGE, а исполняет их рантайм.
Цепочки CARL можно также описывать и запускать напрямую из Python.

## Ключевые возможности

- **Исполнение на DAG** — шаги параллелятся автоматически по зависимостям.
- **RAG-извлечение контекста** — substring- или FAISS-векторный поиск подбирает контекст под каждый шаг.
- **Много типов шагов** — LLM, Tool, MCP, Memory, Transform, Conditional, Structured Output, AgentSkill и мульти-агентная оркестрация (handoff / supervisor / debate / parallel sampling / human-in-the-loop).
- **Async + streaming** — `execute_async` и `stream_async` с пошаговыми колбэками.
- **Эволюция и оценка** — генетический поиск по цепочкам, метрики, оценка на датасетах, рефлексия.
- **Наблюдаемость** — трейсы исполнения, Gantt-диаграммы, разбивка по токенам/стоимости, Langfuse.
- **OpenAI-совместимость** — OpenRouter, Azure, Ollama, vLLM, LM Studio; плюс нативный Anthropic-клиент.

## Дополнительные экстры установки

```bash
pip install mmar-carl                 # ядро (substring-поиск)
pip install 'mmar-carl[vector-search]' # FAISS семантический поиск
pip install 'mmar-carl[openai]'        # OpenAI-совместимые провайдеры
pip install 'mmar-carl[mcp]'           # Model Context Protocol
pip install 'mmar-carl[skills]'        # AgentSkills (+ pdf + pptx)
pip install 'mmar-carl[viz]'           # вывод PNG-диаграмм
pip install 'mmar-carl[all]'           # всё сразу
```

Требуется Python 3.12+.

## Дальше

- [Быстрый старт](/ru/carl/getting-started/quick-start/) — первая цепочка.
- [Базовые концепции](/ru/carl/concepts/what-is-carl/) — ментальная модель.
