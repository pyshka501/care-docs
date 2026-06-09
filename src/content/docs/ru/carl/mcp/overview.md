---
title: Обзор MCP
description: Вызов инструментов на серверах Model Context Protocol из цепочки.
sidebar:
  order: 1
---

[Model Context Protocol](https://modelcontextprotocol.io) позволяет цепочке
вызывать инструменты, размещённые на внешнем MCP-сервере. `MCPStepDescription`
вызывает один такой инструмент. (В v0.3.0 MCP вышел из статуса экспериментального.)

```bash
pip install 'mmar-carl[mcp]'
```

```python
from mmar_carl import MCPStepDescription, MCPStepConfig, MCPServerConfig

MCPStepDescription(
    number=1,
    title="Search via MCP",
    config=MCPStepConfig(
        server=MCPServerConfig(
            server_name="my_server",
            command="python",
            args=["-m", "my_mcp_server"],   # транспорт stdio
        ),
        tool_name="search",
        argument_mapping={"query": "$history[-1]"},
    ),
)
```

## MCPServerConfig

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `server_name` | — | Логическое имя сервера. |
| `transport` | `"stdio"` | `"stdio"` (подпроцесс), `"http"` (streamable HTTP), `"sse"` (HTTP + Server-Sent Events). |
| `command` / `args` | — | Как запустить `stdio`-сервер. |
| `url` | — | Базовый URL для `http` / `sse`. |
| `headers` | `{}` | Доп. HTTP-заголовки (например, `Authorization`) для `http` / `sse`. |

## MCPStepConfig

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `server` | — | Объект `MCPServerConfig`. |
| `tool_name` | — | MCP-инструмент для вызова. |
| `arguments` | `{}` | Статические аргументы. |
| `argument_mapping` | `{}` | Аргументы из [ссылок](/ru/carl/chains/dynamic-references/). |
| `timeout` | `60.0` | Секунды. |

Соединения управляются внутренним пулом (`mcp_pool`), а MCP-прогоны поддерживают
pause/resume, отмену, стриминг и lossless-сериализацию.

:::tip
Для продакшена по возможности регистрируйте MCP-возможности как обычные
[инструменты](/ru/carl/steps/tool/) через `context.register_tool(...)` — меньше
движущихся частей, чем у живого соединения с сервером.
:::

## Смотрите также

- [MCP-ресурсы](/ru/carl/mcp/resources/) — чтение данных (а не вызов инструментов) с сервера.
