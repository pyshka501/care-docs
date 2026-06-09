---
title: Песочница и LLM_AGENT
description: Запуск скриптов навыков в изолированном рантайме и модель workspace в режиме LLM_AGENT.
sidebar:
  order: 3
---

Навыки, запускающие скрипты (`SCRIPT`, `HYBRID`, `SUBAGENT`, `LLM_AGENT`),
выполняются в выбранном вами **рантайме**. Выберите песочницу, чтобы сдержать
недоверенный код.

## Рантаймы

Задайте `runtime` в `AgentSkillStepConfig` (с `runtime_config` для опций бэкенда):

| `runtime` | Изоляция |
| --- | --- |
| `local` | Запуск в локальном подпроцессе (наименьшая изоляция). |
| `docker` | Запуск внутри Docker-контейнера. |
| `e2b` | Запуск в облачной песочнице e2b. |
| `firejail` | Запуск под firejail (Linux). |

```python
AgentSkillStepConfig(
    skill="github://anthropics/skills/skills/pdf@main",
    task="Extract text from {pdf_path}.",
    execution_mode=AgentSkillExecutionMode.LLM_AGENT,
    runtime="docker",
    extra_pip=["pdfplumber"],     # ставится перед запуском скриптов
    trust_policy="sha_pinned",    # "any" | "sha_pinned"
)
```

## Workspace режима LLM_AGENT

Режим `LLM_AGENT` соответствует модели прогрессивного раскрытия AgentSkills: LLM
крутит цикл вызовов инструментов (`run_script` / `read_file` / `write_file` /
`list_resources`), пока не сформирует финальный ответ — всё в изолированном workspace.

- Входные файлы из `input_mapping` размещаются в `/workspace/in/`.
- Файлы, записанные LLM в `/workspace/out/`, собираются в `result_data["output_files"]`.
- `output_capture` (`"stdout"` / `"files"` / `"both"`) выбирает, что вернуть.
- `output_files_glob` фильтрует, какие выходные файлы сохранить.
- `llm_max_iterations` ограничивает число раундов вызовов инструментов.

## Доверие

`trust_policy="sha_pinned"` (вместе с `skill_sha256`) проверяет дайджест `SKILL.md`
навыка перед запуском — см. [резолверы](/ru/carl/skills/resolvers/).
`filter_security_terms` (по умолчанию `True`) вырезает разделы про
password/encrypt/decrypt из промпта LLM.

## Смотрите также

- [Обзор AgentSkills](/ru/carl/skills/overview/) · [Резолверы](/ru/carl/skills/resolvers/)
