---
title: Обзор MCP
description: Вызов инструментов на серверах Model Context Protocol из цепочки, через MCP-шаги или через зарегистрированные инструменты с пулом сессий.
sidebar:
  order: 1
---

[Model Context Protocol](https://modelcontextprotocol.io) позволяет цепочке
вызывать инструменты внешнего MCP-сервера. В CARL для этого два пути:

- **`MCPStepDescription`**: один шаг вызывает один инструмент на одном сервере.
- **`context.register_mcp_tools(server)`**: находит все инструменты сервера и
  регистрирует их как обычные [инструменты](/ru/carl/steps/tool/). Их можно
  вызывать из шагов-инструментов и агентов.

Для MCP нужен необязательный SDK:

```bash
pip install 'mmar-carl[mcp]'
```

Без него MCP-шаги падают с ошибкой "MCP SDK not installed".

## MCP-шаг

```python
from mmar_carl import MCPStepDescription, MCPStepConfig, MCPServerConfig

MCPStepDescription(
    number=1,
    title="Search via MCP",
    config=MCPStepConfig(
        server=MCPServerConfig(
            server_name="my_server",
            command="python",
            args=["-m", "my_mcp_server"],   # stdio transport
        ),
        tool_name="search",
        argument_mapping={"query": "$history[-1]"},
    ),
)
```

Результат шага — содержимое ответа инструмента. Текстовые блоки склеиваются
через перевод строки, остальное кодируется в JSON. Запись в истории помечена
`[MCP: <server_name>/<tool_name>]`.

### MCPServerConfig

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `server_name` | обязательно | Логическое имя. Используется в истории и preflight. |
| `transport` | `"stdio"` | `"stdio"` (подпроцесс), `"http"` (streamable HTTP), `"sse"` (HTTP + Server-Sent Events, старый транспорт). |
| `command` | `None` | Исполняемый файл для `stdio`. |
| `args` | `[]` | Аргументы для `stdio`. |
| `url` | `None` | Адрес для `http` / `sse`. Для них обязателен. |
| `headers` | `{}` | Дополнительные HTTP-заголовки для `http` / `sse` (например, `Authorization`). |

Полей для переменных окружения и рабочей папки сервера нет.

:::caution
`MCPServerConfig` входит в конфиг шага и пишется в JSON цепочки как есть, вместе
с `headers`. Не кладите долгоживущие токены в `headers` цепочки, которую
сохраняете или передаёте.
:::

### MCPStepConfig

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `server` | обязательно | `MCPServerConfig`. |
| `tool_name` | обязательно | Имя MCP-инструмента. |
| `arguments` | `{}` | Статические аргументы. |
| `argument_mapping` | `{}` | Аргументы из [ссылок](/ru/carl/chains/dynamic-references/). Перекрывают статические с тем же именем. |
| `timeout` | `60.0` | Секунды на запрос `call_tool`. |

### Как выполняется вызов

Каждый MCP-шаг открывает своё соединение. Он запускает процесс `stdio` (или
открывает HTTP / SSE), делает `initialize()`, вызывает инструмент и закрывает
соединение. `timeout` ограничивает вызов инструмента. Для `http` / `sse` это
ещё и таймаут HTTP-клиента. Пул сессий MCP-шаги не используют.

## Зарегистрированные MCP-инструменты и пул сессий

```python
names = await context.register_mcp_tools(server)
# ["mcp:my_server/search", "mcp:my_server/fetch", ...]
```

`register_mcp_tools(server, *, prefix=None, timeout=30.0, tags=None)` один раз
вызывает `list_tools()` и регистрирует обёртку на каждый инструмент. Префикс
имени по умолчанию `mcp:<server_name>/`. Каждый вызов обёртки открывает новую
сессию, если не открыт пул:

```python
async with context.mcp_pool() as pool:
    await context.register_mcp_tools(server)
    result = await chain.execute_async(context)
    pool.stats()   # {"open": True, "active_sessions": 1, "server_keys": [...]}
```

Пока пул открыт, `register_mcp_tools`, зарегистрированные обёртки и
`list_mcp_resources` используют одну инициализированную `ClientSession` на
сервер. Ключ — `(server_name, transport, command или url)`. Все сессии
закрываются при выходе из `async with`. `MCPSessionPool` можно использовать и
отдельно (`async with MCPSessionPool() as pool: session = await pool.acquire(server)`).

## Статус и ограничения

MCP в CARL 0.5.0 — поддерживаемая, не экспериментальная часть. Живые тесты с
настоящим сервером FastMCP запускаются через `pytest -m mcp_live`. Известные
ограничения:

- Для [управления запуском](/ru/carl/chains/run-controls/) и
  [стриминга](/ru/carl/async/streaming/) MCP-шаг — обычный шаг. Отмена и пауза
  проверяются между шагами, а не внутри идущего вызова. Вывод инструмента не
  стримится.
- Шаг не смотрит на флаг `isError` в ответе. Инструмент, вернувший ошибку, даёт
  успешный шаг, а результатом становится текст ошибки.
- `from_json()` / `load()` восстанавливают MCP-шаг как устаревший
  `StepDescription`. Чтобы получить `MCPStepDescription`, используйте
  типизированный загрузчик. См. [JSON-сериализацию](/ru/carl/serialization/json/).

## Preflight

`chain.preflight(context)` перечисляет имена серверов всех MCP-шагов и шагов
MCP-ресурсов в `required_mcp_servers`. Серверы описаны в конфиге шага, и CARL не
может проверить, доступны ли они. Поэтому `missing_mcp_servers` всегда пуст. См.
[Preflight](/ru/carl/care-integration/preflight/).

:::tip
Если возможность доступна как Python-функция, регистрация через
`context.register_tool(...)` проще живого сервера.
:::

## См. также

- [MCP-ресурсы](/ru/carl/mcp/resources/): чтение данных с сервера вместо вызова инструментов.
- [Шаги-инструменты](/ru/carl/steps/tool/) · [Динамические ссылки](/ru/carl/chains/dynamic-references/)
