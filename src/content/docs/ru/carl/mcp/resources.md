---
title: MCP-ресурсы
description: Чтение именованного MCP-ресурса в память и историю и просмотр того, что отдаёт сервер.
sidebar:
  order: 2
---

MCP-**ресурсы** — данные только для чтения, которые отдаёт сервер (файлы,
документация, схемы). MCP-**инструменты** принимают аргументы и выполняют
действия. `MCPResourceStepDescription` читает один ресурс через
`session.read_resource(uri)` и пишет его в память и историю. Инструменты не
вызываются.

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

Нужен extra `mmar-carl[mcp]`. Транспорты и `MCPServerConfig` те же, что у
[MCP-шагов](/ru/carl/mcp/overview/#mcpserverconfig). Как и MCP-шаг, этот шаг
открывает своё соединение на каждый запуск и не использует пул сессий.

## MCPResourceStepConfig

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `server` | обязательно | `MCPServerConfig`. |
| `resource_uri` | обязательно, не пустое | URI ресурса, например `docs://api/reference.md`. |
| `output_memory_key` | `""` | Если задан, содержимое пишется в `memory[output_namespace][output_memory_key]`. Если пуст, оно есть только в результате шага и в `$history[-1]`. |
| `output_namespace` | `"mcp_resource"` | Пространство имён для записи. |
| `timeout` | `30.0` | Секунды на вызов `read_resource`. Должен быть > 0. |

Потом содержимое читается через `$memory.mcp_resource.api_docs` (или ваш ключ и
пространство имён), см. [динамические ссылки](/ru/carl/chains/dynamic-references/).

## Что сохраняется

- Один элемент с `text`: текст.
- Один элемент с `blob`: blob в том виде, как его вернул сервер (base64-текст).
- Несколько элементов: весь список как есть.
- Ни одного элемента: пустая строка.

В память значение пишется как есть. Результат шага — то же значение строкой
(не-строки кодируются в JSON). Запись в истории с меткой
`[MCP RESOURCE: <server_name>/<uri>]` хранит только первые 1000 символов.

## Список ресурсов

```python
resources = await context.list_mcp_resources(server, timeout=30.0)
for r in resources:
    print(r.uri, r.name)
```

`list_mcp_resources` возвращает описания ресурсов сервера (обычно `uri`, `name`,
`description`, `mimeType`). Внутри `async with context.mcp_pool():` он
использует сессию из пула.

## См. также

- [Обзор MCP](/ru/carl/mcp/overview/): вызов инструментов, пул сессий, preflight.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/): чтение сохранённого содержимого.
