---
title: Обнаружение инструментов
description: Регистрируйте инструменты через @carl_tool и обнаруживайте их динамически во время выполнения.
sidebar:
  order: 11
---

Помимо регистрации инструментов по одному через `context.register_tool(...)` (см.
[tool-шаги](/ru/carl/steps/tool/)), CARL 0.3.0 может **обнаруживать** инструменты пакетно.

## Декоратор `@carl_tool`

Помечайте функции как обнаруживаемые, опционально проставляя им теги:

```python
from mmar_carl import carl_tool

@carl_tool
def search(query: str) -> str:
    ...

@carl_tool(tags=["information", "external"])
def fetch_data(url: str) -> dict:
    ...
```

## Регистрация с диска

Загрузите каждый `@carl_tool` в файлах, соответствующих glob, одним вызовом:

```python
names = context.register_tools_from_path(
    "tools/*.py",
    tag_filter=["information"],   # optional: only tools carrying these tags
    name_prefix="ext_",          # optional: namespace the registered names
)
```

## Обнаружение во время выполнения как шаг

`ToolDiscoveryStepDescription` обнаруживает + регистрирует инструменты посреди цепочки из
**источника инструментов**:

```python
from mmar_carl import (
    ToolDiscoveryStepDescription, ToolDiscoveryStepConfig, ModuleToolSource,
)

ToolDiscoveryStepDescription(
    number=1,
    title="Discover tools",
    config=ToolDiscoveryStepConfig(
        source=ModuleToolSource(module="my_pkg.tools", tag="search", name_prefix="x_"),
        output_memory_key="discovered_tools",
    ),
)
```

### Источники инструментов

| Источник | Откуда обнаруживает |
| --- | --- |
| `ModuleToolSource(module, name_prefix="", tag="", strip_prefix=…)` | Путь к Python-модулю — сканирует его на функции `@carl_tool`. |
| `CallableToolSource(factory)` | Предоставляемая вами `factory() -> {name: callable}`. |
| `DictToolSource(tools)` | Явный словарь `{name: callable}`. |

`ToolDiscoveryStepConfig` также принимает `tool_timeout`. Имена обнаруженных инструментов
записываются в `output_memory_key`, чтобы последующие шаги видели, что доступно.

## Смотрите также

- [Tool-шаги](/ru/carl/steps/tool/) — вызов зарегистрированных инструментов.
- `ToolDefinition` (экспортируется) собирает инструменты программно.
