---
title: Команды настройки
description: Инициализация конфига, проверка состояния и защита секретов.
sidebar:
  order: 3
---

## `care init`

Быстрый старт в один шаг: записать минимальный `.env` с учётными данными MAGE,
необходимыми новому чекауту.

```bash
care init                                    # интерактивно
care init --non-interactive --api-key sk-... --base-url ... --model qwen/qwen3-coder --mode interactive
```

| Флаг | По умолчанию | Назначение |
| --- | --- | --- |
| `--env-path` | `./.env` | Куда записать `.env`. |
| `--api-key` | запрос | API-ключ MAGE. |
| `--base-url` | запрос (`https://openrouter.ai/api/v1`) | OpenAI-совместимый базовый URL. |
| `--model` | запрос (`qwen/qwen3-coder`) | Идентификатор модели, понятный эндпоинту; `qwen/qwen3-coder` — рекомендуемая конвенция для OpenRouter. |
| `--mode interactive\|production\|ad_hoc` | запрос (`interactive`) | Режим чата по умолчанию. |
| `--force` | выкл. | Перезаписать целевой файл, если он существует. |
| `--non-interactive` | выкл. | Не запрашивать — для незаданных значений берутся значения по умолчанию (обязательно для CI). |

:::note[`ad_hoc` приводится к `interactive`]
`--mode` принимает устаревшие написания `ad_hoc` / `ad-hoc` / `adhoc`, но все они
приводятся к `interactive` ещё до записи в `.env`. Любое другое значение даёт код
выхода `1`.
:::

## `care doctor`

Отчёт о состоянии: какие переменные окружения заданы, путь к конфигу, установленные
зависимости и глубокие сетевые проверки Memory / MAGE / Platform.

```bash
care doctor              # с сетевыми проверками
care doctor --no-probes  # оффлайн / CI
```

:::note[Глубокие проверки, общие с TUI]
`care doctor` запускает те же глубокие проверки, что и интерфейс `/status` в
MAESTRO CARE (один `run_all_probes(deep=True)`): проверка MAGE — это
аутентифицированный round-trip к `/models`, поэтому истёкший ключ загорается
красным, а не даёт ложно-зелёный статус. Команда завершается с кодом `1`, если
падает проверка **Memory** или **MAGE** (Platform необязателен). В CI, где
сервисы недоступны, используйте `--no-probes`.
:::

## `care migrate-secrets`

Переместить plaintext API-ключи из конфигурационного TOML в keychain ОС.

```bash
care migrate-secrets --dry-run   # предпросмотр без изменений
```

Запустите `care <команда> --help` для полного списка флагов.
