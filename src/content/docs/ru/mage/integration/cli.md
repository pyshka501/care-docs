---
title: CLI
description: Команда mage (generate, edit, validate, evolve, version), её параметры и то, чего каждая команда не делает.
sidebar:
  order: 2
---

Пакет ставит команду `mage` (**выпущено**; на ветке разработки команды те
же). В Maestro обычно пользуются `maestro generate`: она зовёт MAGE с
настройками Maestro, см. [Генерация, запуск и повтор](/ru/care/cli/generate-run/).

## `mage generate "<задача>"`

```bash
mage generate "Analyze a financial report" --mode fast -o chain.json --no-memory
```

| Параметр | По умолчанию | Заметки |
| --- | --- | --- |
| `--mode`, `-m` | `deep` | `fast` или `deep`. |
| `--model` | `gpt-4o` | |
| `--api-key` | переменная `MAGE_API_KEY` | |
| `--base-url` | не задан | Любой OpenAI-совместимый эндпоинт. |
| `--temperature`, `-t` | `0.2` | |
| `--output`, `-o` | не задан | Записать JSON цепочки сюда; иначе он печатается. |
| `--no-memory` | выкл. | Без него MAGE пробует сохранить цепочку в GigaEvo Memory. |
| `--skills` | выкл. | Поиск навыков во встроенном реестре. |
| `--skills-web` | выкл. | Разрешить поиску навыков уходить в веб. |
| `--benchmark-profile` | не задан | Пресет под бенчмарк: `bfcl`, `seal_tools`, `rotbench`, `toolalpaca`, `custom`. |

CLI собирает `MAGEConfig` только из этих параметров. `MAGEConfig.from_env()`
он не вызывает, поэтому всегда работает со стратегией `legacy` и
переключателями стадий по умолчанию и принимает задачу строкой
(типизированного запроса нет).

## `mage edit "<инструкция>"`

```bash
mage edit "rename to 'Invoice QA'" --chain chain.json -o edited.json     # локальный файл, без памяти
mage edit "add a validation step" --id chain-abc123 --save               # сохранённая цепочка, новая версия
mage edit "also extract tables from the PDF summariser"                  # найти цепочку в памяти
```

Параметры: `--id`, `--chain`, `--channel` (`latest`), `--save`, `--output`,
`--model`, `--api-key`, `--base-url`, `--temperature`. Неудачная правка
оставляет исходную цепочку как была.

## `mage validate <chain.json>`

```bash
mage validate chain.json
```

Три слоя: `validate_carl_json` (всегда), строгие типы CARL (`--strict`, вкл.),
`ReasoningChain.from_json` (`--check-carl`, вкл.). `--check-capabilities`
ещё ищет каждый URI `agent_skill` в памяти и предупреждает о
ненайденных. Код выхода 0 при успехе, 1 при провале.

:::caution[Это не полный допуск]
`mage validate` не запускает `lint_chain` и `validate_runtime_chain`.
Цепочка, которую он принял, всё ещё может не пройти допуск при генерации
(неверные привязки, финальный шаг не совпадает с контрактом выхода).
:::

## `mage evolve "<задача>"`

Синтезирует небольшой бенчмарк под задачу, создаёт популяцию цепочек и
несколько поколений их мутирует. Среди параметров `--population` (5),
`--generations` (4), `--benchmark-tasks` (8), `--threshold` (0.95),
`--plateau` (2), `--seed`, `--model`, `--execution-model`,
`--memory/--no-memory`, `--web`, `--output`, `--benchmark-output`.

Это собственный, более старый цикл эволюции MAGE. Maestro эволюционирует
цепочки на платформе GigaEvo, см. [Эволюцию](/ru/care/workflows/evolution/).

## `mage version`

Печатает установленную версию: `mmar-mage 0.1.3` у релиза,
`mmar-mage 0.2.0` на ветке разработки.

`mage version`, `mage validate` и `mage --help` запускались на
`feat/v3-ideal-loop` (acf7091). `generate`, `edit` и `evolve` делают платные
вызовы модели и для этой страницы не запускались.
