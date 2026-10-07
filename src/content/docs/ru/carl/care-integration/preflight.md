---
title: Preflight
description: Статически узнать, что нужно цепочке, и сверить это с контекстом до запуска.
sidebar:
  order: 2
---

Перед запуском сохранённой цепочки полезно знать, что она будет использовать.
Тогда можно заранее зарегистрировать или установить недостающее.
`ReasoningChain` отвечает на этот вопрос без выполнения и без вызова LLM.

## На что ссылается цепочка?

```python
chain.required_tools()             # инструменты из шагов tool / map / agent и allowed_tools у chain tools
chain.required_mcp_servers()       # имена MCP-серверов
chain.required_skills()            # идентификаторы AgentSkill (URI или строка источника)
chain.required_code_profiles()     # runtime_profile у шагов code
chain.required_claude_code_clis()  # cli_path у шагов claude_code (по умолчанию "claude")
chain.required_codex_runtimes()    # ["openai-codex"], если в цепочке есть шаг codex
```

Инструменты, которые находит во время прогона
[шаг обнаружения инструментов](/ru/carl/steps/tool-discovery/), сюда не
попадают. Имена встроенных chain tools тоже не попадают: их даёт сама
цепочка.

## Preflight на контексте

`chain.preflight(context)` сравнивает эти списки с тем, что есть в контексте,
и возвращает `PreflightReport`:

```python
report = chain.preflight(context)
print(report.format_text())
if not report.all_present:
    print("сначала зарегистрируйте:", report.missing_tools)
```

### PreflightReport

| Поле / член | Как решается «не хватает» |
| --- | --- |
| `required_*` | Всё, на что ссылается цепочка (шесть списков, как выше). |
| `missing_tools` | Нет в `context.list_tools()`. |
| `missing_code_profiles` | Нет `context.code_execution_policy` или он не находит профиль. |
| `missing_claude_code_clis` | `shutil.which()` не находит CLI. |
| `missing_codex_runtimes` | `check_codex_runtime()` сообщает, что среда недоступна. |
| `missing_mcp_servers` / `missing_skills` | Всегда пустые. MCP-серверы несут свою конфигурацию, навыки разрешаются по сети во время прогона. Preflight их перечисляет, но не проверяет. |
| `all_present` (свойство) | `True`, когда все списки `missing_*` пусты. |
| `format_text()` | Одна строка, если всё на месте, иначе разбивка. |

Отчёт это данные, а не текст. Maestro превращает его в отказ или диалог, CLI и
CI читают списки напрямую.

## В Maestro

Maestro запускает preflight дважды: на разобранной цепочке без контекста
(чтобы перечислить требования) и на заполненном контексте прямо перед
запуском. Если не хватает инструмента, MCP-сервера или навыка, запуск
отклоняется. В командной строке `maestro validate <chain.json>` разбирает
цепочку и выполняет preflight (см. [CLI: обзор](/ru/care/cli/discovery/)).

## См. также

- [Интеграция с Maestro](/ru/carl/care-integration/overview/)
- [Chain tools](/ru/carl/steps/chain-tools/) · [Шаг code](/ru/carl/steps/code/)
