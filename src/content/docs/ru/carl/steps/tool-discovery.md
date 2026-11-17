---
title: Обнаружение инструментов
description: Регистрировать инструменты пачкой через @carl_tool и находить их во время выполнения.
sidebar:
  order: 11
---

Инструменты можно регистрировать по одному через `context.register_tool(...)`
(см. [tool-шаги](/ru/carl/steps/tool/)). Кроме того, CARL умеет регистрировать их
пачкой: из файлов на диске до запуска или из модуля, фабрики или словаря во время
запуска с помощью шага `tool_discovery`.

## Декоратор `@carl_tool`

`@carl_tool` помечает функцию как инструмент CARL и при желании добавляет теги.
Он ставит на функцию `__carl_tool__ = True`, а с `tags` ещё и `__carl_tool_tags__`.
Сама функция не меняется.

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

`context.register_tools_from_path` загружает каждый `.py`-файл, подходящий под
glob-шаблон, и регистрирует каждую публичную функцию с `@carl_tool`:

```python
names = context.register_tools_from_path(
    "tools/**/*.py",              # glob, recursive; ~ is expanded
    tag_filter=["information"],   # optional: only tools with at least one of these tags
    name_prefix="ext_",           # optional: prepended to each registered name
)
```

Метод возвращает зарегистрированные имена в порядке обнаружения. Что нужно знать:

- Каждый подходящий файл **импортируется, поэтому его код верхнего уровня
  выполняется**. Указывайте только каталоги, которым доверяете.
- Файлы, которые не удалось импортировать, молча пропускаются (запись в лог на
  уровне DEBUG).
- Уже зарегистрированное имя перезаписывается. Чтобы разделить каталоги,
  используйте `name_prefix`.

## Обнаружение во время выполнения как шаг

`ToolDiscoveryStepDescription` находит инструменты в **источнике инструментов**
во время запуска и регистрирует их в контексте. После этого их могут вызывать
следующие [tool-шаги](/ru/carl/steps/tool/). Вызова LLM нет.

```python
from mmar_carl import (
    ToolDiscoveryStepDescription, ToolDiscoveryStepConfig, ModuleToolSource,
)

ToolDiscoveryStepDescription(
    number=1,
    title="Discover tools",
    config=ToolDiscoveryStepConfig(
        source=ModuleToolSource(module="my_pkg.tools", tag="search"),
        output_memory_key="discovered_tools",
    ),
)
```

### ToolDiscoveryStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `source` | `ModuleToolSource \| CallableToolSource \| DictToolSource \| GitToolSource` | (обязательное) | Где искать инструменты. |
| `output_memory_key` | `str` | `""` | Если задан, отсортированный список имён инструментов записывается в `memory["tools"][output_memory_key]`, то есть в `$memory.tools.<key>`. |
| `tool_timeout` | `float \| None` | `None` | Таймаут на вызов для найденных **синхронных** инструментов. На async-инструменты не влияет. |

`result_data` шага имеет вид `{"tool_names": [...]}`.

### Источники инструментов

| Источник | Что находит |
| --- | --- |
| `ModuleToolSource(module, name_prefix="", tag="", strip_prefix=False)` | Импортирует `module` и берёт его публичные вызываемые объекты с фильтрами, описанными ниже. |
| `CallableToolSource(factory)` | Вызывает `factory()`, которая должна вернуть `{name: callable}`. |
| `DictToolSource(tools)` | Явный словарь `{name: callable}`. |
| `GitToolSource(git_url, module_file, git_ref="HEAD", git_subdirectory=None, function=None, sha256=None)` | Клонирует Git-репозиторий и импортирует из него один файл модуля. Берёт функции с `@carl_tool` или только `function`, если она задана. Появился в 0.5.0. |

Фильтры `ModuleToolSource`:

- `name_prefix`: оставить только объекты, чьё имя начинается с этого префикса.
  Это **фильтр**, а не пространство имён.
- `strip_prefix=True`: регистрировать их без префикса (`tool_search` →
  `search`).
- `tag`: оставить только объекты, у которых среди тегов `@carl_tool` есть этот.

:::caution
Без `tag` `ModuleToolSource` **не** ищет `@carl_tool`. Он регистрирует все
публичные вызываемые объекты модуля, включая импортированные функции и классы.
Ограничьте его через `tag` или `name_prefix` либо направьте на модуль, где лежат
только инструменты.
:::

`CallableToolSource` и `DictToolSource` хранят Python-объекты, поэтому цепочку с
ними нельзя полностью описать в JSON. `ModuleToolSource` хранит только путь к
модулю, а `GitToolSource` только репозиторий, ревизию и хэши.

## Инструменты из закреплённого коммита Git

`GitToolSource` загружает код инструментов из Git. Закрепляйте его двумя
способами: в `git_ref` укажите полный SHA коммита, а в `sha256` перечислите
ожидаемые SHA-256 файлов, на которые полагаетесь (пути считаются от
`git_subdirectory`).

```python
from mmar_carl import ToolDiscoveryStepConfig, ToolDiscoveryStepDescription
from mmar_carl.models.config import GitToolSource

ToolDiscoveryStepDescription(
    number=1,
    title="Load pinned text tools",
    config=ToolDiscoveryStepConfig(
        source=GitToolSource(
            git_url="https://github.com/acme/text-tools.git",
            git_ref="<40-char commit sha>",
            module_file="tools.py",
            sha256={"tools.py": "<sha256 of tools.py>"},
        ),
        output_memory_key="git_tools",   # → $memory.tools.git_tools
    ),
)
```

- `git_ref` из 40 или 64 hex-символов скачивается через `--depth=1` и
  выбирается точно. Любое другое значение клонируется как ветка или тег
  (`HEAD` = ветка по умолчанию). Код закрепляет только SHA коммита.
- Копии кэшируются в `~/.cache/mmar_carl/skills/git/` по ключу из URL, ревизии и
  подкаталога. Хэши проверяются при каждой загрузке, и при попадании в кэш
  тоже. Несовпадение валит шаг (`SHA256 mismatch for tools.py: …`).
- `module_file` и пути в `sha256` должны оставаться внутри копии.
- Без `function` регистрируются только функции с `@carl_tool`, вместе с их
  тегами. С `function` регистрируется ровно эта функция.
- Загрузка выполняет модуль в процессе хоста. Закрепляйте только код, которому
  доверяете. `GitToolSource` не экспортируется с верхнего уровня, импортируйте
  его из `mmar_carl.models.config`.

AgentSkill использует тот же Git-загрузчик и ту же проверку хэшей, см.
[резолверы навыков](/ru/carl/skills/resolvers/).

## См. также

- [Tool-шаги](/ru/carl/steps/tool/): вызов зарегистрированных инструментов.
- `ToolDefinition` (экспортируется из `mmar_carl`) для программной сборки инструментов.
