---
title: Changelog
description: Ключевые изменения по релизам mmar-carl.
sidebar:
  order: 2
---

Ключевое по релизам. Полные заметки — в
[`RELEASE.md`](https://github.com/Glazkoff/carl-experiments/blob/main/RELEASE.md).

## v0.3.0 — 2026-06-02 (текущий)

- 🤝 **Мульти-агентная оркестрация**: [handoff](/ru/carl/orchestration/handoff/),
  [supervisor](/ru/carl/orchestration/supervisor/), [debate](/ru/carl/orchestration/debate/),
  [parallel sampling](/ru/carl/orchestration/parallel-sampling/),
  [human-in-the-loop](/ru/carl/orchestration/human-in-the-loop/).
- 🧱 **Песочница для [AgentSkill](/ru/carl/skills/overview/)** (docker / e2b /
  firejail) + режим `LLM_AGENT` + URI-резолвер навыков.
- 📊 **Наблюдаемость**: [`ExecutionTrace`](/ru/carl/tracing/overview/), Gantt /
  heatmap / анимированный плейбэк, `ChainVisualizer`.
- 🧬 **Генерация цепочек** (`ChainBuilder.from_description`) +
  [эволюционный поиск](/ru/carl/evolution/overview/) (`ChainEvolver`).
- 🤖 Нативный `AnthropicClient`, [record/replay-кассеты](/ru/carl/llm/record-replay/),
  оценка стоимости, оценка на датасетах.
- 🔌 [MCP](/ru/carl/mcp/overview/) вышел из экспериментального; pause/resume,
  отмена, стриминг, lossless-сериализация.

## v0.2.0 — 2026-04-15

- 🔧 Ломающие изменения: рефакторинг LLM-клиента; удалён `mmar-llm-mapi`.
- ✨ 74 новых теста, раннер примеров.
- 🐛 6 критических фиксов (conditional-шаги, сериализация, маппинг входов).
- 📝 Улучшения документации.

## v0.1.0

- 🚨 Типизированные классы описаний шагов (`StepDescription` устарел).
- 📊 Структурное логирование с настраиваемыми уровнями.
- 🔍 Сохранение трейсбэков ошибок; ⏱️ таймаут на уровне цепочки; 🔄 повторы по шагам.
- 🌐 Поддержка OpenAI-совместимых API; 🎛️ пошаговый LLM-конфиг.
- ⚡ Режимы исполнения (FAST / SELF_CRITIC); 🔀 политика RE-PLAN на уровне цепочки; 📊 метрики оценки.

## Смотрите также

- [Миграция: legacy → типизированные шаги](/ru/carl/serialization/migration/)
