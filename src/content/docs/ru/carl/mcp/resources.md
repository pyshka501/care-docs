---
title: MCP-ресурсы
description: Чтение именованного MCP-ресурса в память и историю.
sidebar:
  order: 2
---

MCP-**ресурсы** — это данные только для чтения, которые отдаёт сервер (файлы, доки,
схемы) — в отличие от MCP-**инструментов**, которые принимают аргументы и выполняют
действия. `MCPResourceStepDescription` извлекает ресурс и записывает его в память +
историю, без вызова инструмента.

```python
from mmar_carl import MCPResourceStepDescription, MCPResourceStepConfig, MCPServerConfig

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

## MCPResourceStepConfig

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `server` | — | Объект `MCPServerConfig`. |
| `resource_uri` | — | URI ресурса (например, `docs://api/reference.md`). |
| `output_memory_key` | `""` | Если задано, сохраняет контент в `memory[output_namespace][key]`. Если пусто — только в `$history[-1]` / `$metadata.step_N`. |
| `output_namespace` | `"mcp_resource"` | Namespace для записи. |
| `timeout` | `30.0` | Секунды. |

Прочитать контент позже можно через `$memory.mcp_resource.api_docs` (или ваш ключ/namespace).

## Смотрите также

- [Обзор MCP](/ru/carl/mcp/overview/) — вызов инструментов.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/) — чтение сохранённого контента.
