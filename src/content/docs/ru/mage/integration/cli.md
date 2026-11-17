---
title: CLI
description: Команда mage (generate, в 0.2.0 с --strategy, edit, validate, evolve, version), её параметры и то, чего каждая команда не делает.
sidebar:
  order: 2
---

Пакет ставит команду `mage` (**выпущено**; на ветке разработки команды те
же). В Maestro обычно пользуются `maestro generate`: она зовёт MAGE с
настройками Maestro, см. [Генерация, запуск и повтор](/ru/care/cli/generate-run/).

## `mage generate "<задача>"`

```bash
mage generate "Analyze a financial report" -o chain.json --no-memory                              # 0.2.0: v3
mage generate "Analyze a financial report" --strategy legacy --mode fast -o chain.json --no-memory
```

| Параметр | По умолчанию | Заметки |
| --- | --- | --- |
| `--strategy`, `-s` | не задан: значение из конфига, `v3` | Только кандидат 0.2.0. `v3`, `legacy` (конвейер fast/deep) или `semantic`; любое другое значение даёт ошибку. |
| `--mode`, `-m` | `deep` | `fast` или `deep`. Действует только в `legacy`; в 0.2.0 добавьте `--strategy legacy`. |
| `--model` | `gpt-4o` | |
| `--api-key` | переменная `MAGE_API_KEY` | |
| `--base-url` | не задан | Любой OpenAI-совместимый эндпоинт. |
| `--temperature`, `-t` | `0.2` | |
| `--output`, `-o` | не задан | Записать JSON цепочки сюда; иначе он печатается. |
| `--no-memory` | выкл. | Без него MAGE пробует сохранить цепочку в GigaEvo Memory. |
| `--skills` | выкл. | Поиск навыков во встроенном реестре (стадия deep у legacy). |
| `--skills-web` | выкл. | Разрешить поиску навыков уходить в веб. |
| `--benchmark-profile` | не задан | Пресет под бенчмарк: `bfcl`, `seal_tools`, `rotbench`, `toolalpaca`, `custom`. Выбирает `legacy`, если не задан `--strategy`. |

CLI собирает `MAGEConfig` только из этих параметров. `MAGEConfig.from_env()`
он не вызывает, так что `MAGE_GENERATION_STRATEGY` ни на что не влияет,
переключатели стадий остаются по умолчанию, а задача передаётся строкой
(типизированного запроса нет). Поэтому в 0.2.0 стратегия берётся из
`--strategy` или из значения пакета по умолчанию, `v3`; в 0.1.3 и в ревизиях,
которые закрепляет Maestro, это всегда `legacy`. Каталог инструментов CLI не
передаёт, поэтому цепочка v3 из `mage generate` обходится без инструментов
(для v3 `capabilities` это закрытый мир).

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

Это собственный, более старый цикл эволюции MAGE. Он всегда работает на
стратегии `legacy`, в 0.2.0 тоже. Maestro эволюционирует
цепочки на платформе GigaEvo, см. [Эволюцию](/ru/care/workflows/evolution/).

## `mage version`

Печатает установленную версию: `mmar-mage 0.1.3` у релиза,
`mmar-mage 0.2.0` на ветке разработки.

`mage version`, `mage validate` и `mage --help` запускались на
`feat/v3-ideal-loop` (acf7091). На `prep/mage-0.2.0` (5a38672)
`mage generate --help` показывает `--strategy`, а неизвестная стратегия
завершается с кодом 1 ещё до вызова модели. `generate`, `edit` и `evolve`
делают платные вызовы модели и для этой страницы не запускались.
