---
title: Команды настройки
description: Записать стартовый .env, проверить окружение и сервисы, перенести секреты в keychain.
sidebar:
  order: 3
---

## `maestro init`

Быстрый старт: записывает минимальный `.env` с ключом модели, чтобы свежий checkout
или рабочая папка сразу заработали. Спрашивает всё, что не передано флагами. С
`--non-interactive` берёт значения по умолчанию.

```bash
maestro init                                         # интерактивные вопросы
maestro init --non-interactive \
  --api-key "$OPENROUTER_API_KEY" \
  --base-url https://openrouter.ai/api/v1 \
  --model qwen/qwen3-coder \
  --mode interactive
maestro init --non-interactive --api-key "$KEY" --mode production --force
```

| Флаг | По умолчанию | Назначение |
| --- | --- | --- |
| `--env-path PATH` | `./.env` | Куда писать файл. |
| `--api-key KEY` | вопрос | Ключ модели для генерации цепочек. |
| `--base-url URL` | `https://openrouter.ai/api/v1` | OpenAI-совместимый base URL. |
| `--model ID` | `anthropic/claude-3.5-sonnet` | Id модели, который понимает endpoint. |
| `--mode interactive\|production\|ad_hoc` | `interactive` | Режим чата по умолчанию. |
| `--force` | выкл. | Перезаписать существующий файл. |
| `--non-interactive` | выкл. | Ничего не спрашивать; пустые значения берутся по умолчанию (нужно для CI). |

Модель по умолчанию — просто запасное значение, а не рекомендация. Выберите
модель, которую отдаёт ваш endpoint. На OpenRouter часто берут `qwen/qwen3-coder`.

### Режимы

- **`interactive`** — чат генерирует цепочку и по умолчанию спрашивает перед
  запуском. Ничего не сохраняется, пока вы не сохраните сами. Работает без Memory.
- **`production`** — каждый запрос даёт воспроизводимую цепочку. Она сохраняется в
  Memory под стабильным `chain_id`, получает базовый запуск, а при настроенной
  Platform запускается эволюция. Нужен `CARE_MEMORY__BASE_URL`. Без него
  приложение с предупреждением возвращается в interactive.

`ad_hoc` (а также `ad-hoc`, `adhoc`) — старое имя `interactive`, в файл пишется
`interactive`. Любое другое значение даёт код выхода `1`. См.
[Режимы](/ru/care/workflows/modes/).

## `maestro doctor`

Диагностический отчёт: путь к конфигу, заданные переменные `CARE_*`, каталоги
config, cache и state, установленные extras и сетевые проверки Memory,
endpoint модели генератора и Platform. Если настроены серверы решателей STARM,
`doctor` запрашивает у каждого `GET /info`.

```bash
maestro doctor
maestro doctor --no-probes              # только env / config / extras (офлайн, CI)
maestro doctor --config ./care.toml     # проверить конкретный конфиг
```

| Флаг | Назначение |
| --- | --- |
| `--config PATH` | Другой путь к конфигу (по умолчанию `~/.config/care/config.toml`). |
| `--no-probes` | Пропустить все сетевые проверки, включая STARM. |

Проверка модели — это запрос `/models` с ключом, поэтому истёкший ключ виден как
ошибка, а не как ложный зелёный статус. `doctor` выходит с кодом `1`, если упала
проверка **Memory** или **модели**. Проверка Platform необязательна. После проверок
`doctor` ещё отмечает подозрительные поля конфига, например ключ, вставленный в
поле `*_base_url`.

### Проверка серверов STARM

Если задан `tools.starm_ports`, `doctor` печатает по строке на сервер. Хосты и
значения `<arch>` / `<N>` ниже — заглушки:

```text
== STARM solvers ==
  ✓ solve_sudoku  http://gpu-01:8080  ok: <arch>, up to <N> recursion steps
  ⚠ solve_maze  http://gpu-01:8081  misrouted: serves 'sudoku'
  ✗ solve_arc_agi_1  http://gpu-01:8082  unreachable: ConnectError
```

- `ok` — сервер отвечает и обслуживает нужную задачу. В строке архитектура модели и
  предел шагов рекурсии из `/info`.
- `misrouted` — сервер обслуживает другую задачу. Обычно перепутаны порты, и
  сервер отклонит каждый запрос.
- `unreachable` — на порту никто не отвечает.

Этот раздел только информирует и не меняет код выхода. Настройка и подробности:
[Решатели STARM](/ru/care/solvers/starm/).

## `maestro migrate-secrets`

Переносит значения `*_api_key` из `~/.config/care/config.toml` в системное хранилище
ключей и переписывает TOML на ссылки `keystore://…`.

```bash
maestro migrate-secrets --dry-run       # показать, ничего не меняя
maestro migrate-secrets
```

| Флаг | Назначение |
| --- | --- |
| `--config PATH` | Другой путь к конфигу. |
| `--dry-run` | Показать, что будет перенесено, не трогая хранилище и TOML. |
