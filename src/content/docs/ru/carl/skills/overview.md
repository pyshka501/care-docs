---
title: Обзор AgentSkills
description: Запуск переносимых папок AgentSkill (SKILL.md) как шага в нескольких режимах выполнения.
sidebar:
  order: 1
---

[AgentSkills](https://agentskills.io) — переносимые папки навыков: `SKILL.md`
с инструкциями плюс необязательные скрипты, ссылки и ресурсы.
`AgentSkillStepDescription` запускает один из них как шаг цепочки.

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

## Идентификация навыка

Поле `skill` принимает строку-URI (или `AgentSkillSource`) — см.
[резолверы](/ru/carl/skills/resolvers/):

| Форма | Пример |
| --- | --- |
| GitHub tarball | `github://anthropics/skills/skills/pdf@main` |
| Локальный путь | `/path/to/skill` |
| Python-пакет | `module://my_pkg.skills.pdf` |
| Имя навыка | `pdf` (ищется в `~/.agents/skills/`, `./.claude/skills/`, …) |

## Режимы выполнения

| Режим | Поведение |
| --- | --- |
| `LLM` | `SKILL.md` как системный промпт; один вызов LLM (по умолчанию). |
| `SCRIPT` | Запуск бандловного скрипта напрямую; без вызова LLM. |
| `HYBRID` | Сначала скрипт, LLM как запасной вариант. |
| `SUBAGENT` | Скрипт собирает данные, LLM синтезирует. |
| `LLM_AGENT` | Итеративный цикл tool-calling: LLM вызывает `run_script` / `read_file` / `write_file` / `list_resources` до получения финального ответа; в изолированном рабочем пространстве. |

## Ключевые поля конфигурации

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `skill` | — | URI / источник навыка. |
| `task` | — | Текст задачи (поддерживает `{placeholders}` из `input_mapping`). |
| `execution_mode` | `LLM` | Один из режимов выше. |
| `input_mapping` | `{}` | Входные данные (также размещаются как файлы в режиме `LLM_AGENT`). |
| `output_memory_key` | `None` | Куда сохранить результат. |
| `llm_max_iterations` | — | Максимум раундов tool-calling в режиме `LLM_AGENT`. |
| `output_capture` | — | `"stdout"` / `"files"` / `"both"`. |
| `filter_security_terms` | `True` | Убрать секции паролей/шифрования из промпта LLM. |
| `extra_pip` | `[]` | Пакеты, устанавливаемые перед запуском скриптов. |

См. [изолированную среду](/ru/carl/skills/sandbox/) для `runtime`, `trust_policy` и
рабочего пространства `LLM_AGENT`.

## Смотрите также

- [Резолверы навыков](/ru/carl/skills/resolvers/) · [Изолированная среда и LLM_AGENT](/ru/carl/skills/sandbox/)
- [Пример AgentSkill](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/agent_skill_example.py) (PDF → анализ → PPTX).
