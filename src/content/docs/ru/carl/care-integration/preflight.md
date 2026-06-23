---
title: Preflight
description: Статически интроспектировать, что нужно цепочке, и проверить это относительно контекста перед запуском.
sidebar:
  order: 2
---

Перед запуском сохранённой цепочки часто хочется знать, что она попытается использовать —
какие инструменты, MCP-серверы и AgentSkills — чтобы зарегистрировать или установить
недостающие части. CARL предоставляет статическую интроспекцию на `ReasoningChain`.

## На что ссылается эта цепочка?

```python
chain.required_tools()         # de-duplicated tool names from ToolStep configs
chain.required_mcp_servers()   # MCP server names referenced by MCP steps
chain.required_skills()        # AgentSkill identifiers (URI or source string)
```

Это чистые статические чтения — без выполнения, без LLM.

## Preflight относительно контекста

`chain.preflight(context)` сравнивает требования с реестром контекста и возвращает
`PreflightReport`:

```python
report = chain.preflight(context)
print(report.format_text())
if not report.all_present:
    print("register first:", report.missing_tools)
```

### PreflightReport

| Поле / член | Значение |
| --- | --- |
| `required_tools` / `required_mcp_servers` / `required_skills` | Всё, на что ссылается цепочка. |
| `missing_tools` | Инструменты, на которые есть ссылки, но которые **не** зарегистрированы в контексте (список MAESTRO «зарегистрировать перед запуском»). |
| `missing_mcp_servers` / `missing_skills` | Зарезервировано (сейчас всегда пусто — MCP несёт свою собственную конфигурацию; разрешение навыков асинхронно/зависит от сети). |
| `all_present` (свойство) | `True`, когда ничего не отсутствует. |
| `format_text()` | Однострочная сводка, когда всё OK, иначе многострочная разбивка. |

Отчёт **структурирован, а не нарративен** — MAESTRO превращает его в модальное окно; CLI и
CI читают сырые списки.

## Смотрите также

- [Обзор интеграции с MAESTRO](/ru/carl/care-integration/overview/)
- Аналог в CLI: [`care validate`](/ru/care/cli/discovery/) выполняет preflight файла цепочки.
