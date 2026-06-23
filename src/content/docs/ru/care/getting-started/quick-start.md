---
title: Быстрый старт
description: Запустите MAESTRO и сгенерируйте первую цепочку в формате CARL за пять минут.
sidebar:
  order: 2
---

От свежего checkout до работающего агента — примерно за пять минут.

## Требования

- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/) (менеджер проекта и окружения)
- API-ключ OpenAI-совместимого провайдера (например, OpenRouter)

## 1. Установка

```bash
uv sync
```

## 2. Настройка

`care init` запросит минимум учётных данных MAGE (base URL, API-ключ, модель) и
запишет `./.env`, чтобы свежий checkout мог стартовать:

```bash
uv run care init
```

Для CI / скриптов — неинтерактивно:

```bash
uv run care init --non-interactive \
  --api-key sk-... \
  --base-url https://openrouter.ai/api/v1 \
  --model qwen/qwen3-coder
```

## 3. Запуск TUI

```bash
uv run care
```

MAESTRO открывается сразу в **чате** — транскрипт в стиле
Claude Code с полем ввода снизу и переключателем режима над ним.

## 4. Первая генерация агента

Введите задачу на естественном языке и нажмите <kbd>Enter</kbd>:

```text
Суммируй ключевые риски в этом квартальном отчёте и отранжируй по серьёзности.
```

MAGE сгенерирует цепочку, MAESTRO тут же её выполнит, и ответ выведется
инлайн. При первом запуске появится предложение ввести `/tour` — 5-шаговый тур.

## Дальше

- Запустите [`/tour`](/ru/care/getting-started/quick-start/) внутри TUI.
- Изучите два [режима чата](/ru/care/getting-started/overview/) — **Ad-Hoc** и **Production**.
- Откройте полный [справочник CLI](/ru/care/cli/overview/).
