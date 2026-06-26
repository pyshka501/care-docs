---
title: Установка и использование
description: Установите скилл Maestro одной командой — для Claude Code или hermes; сделайте `care` доступным; проверьте.
sidebar:
  order: 2
---

Скилл Maestro — небольшой бандл (`maestro/` — `SKILL.md` + `scripts/` +
`references/`), который учит Claude Code или hermes управлять Maestro. Ему нужна
рабочая команда `care`, которую он сам **не** устанавливает (см. шаг 2).

## 1. Установка скилла — одной командой

```bash
uvx maestro-install skill
```

`skill` — это позиционная подкоманда опубликованного мастера `maestro-install`. Она
скачивает бандл и распаковывает в каталог скиллов выбранного агента. Спросит, какой
агент, либо укажите явно через `--agent`:

| `--agent` | Каталог скиллов |
| --- | --- |
| `claude` | `~/.claude/skills/` |
| `codex` | `~/.codex/skills/` |
| `hermes` | `~/.hermes/skills/` |
| `openclaw` | `~/.openclaw/skills/` |
| `all` | все агенты выше, что найдёт |
| `<path>` | произвольный каталог скиллов |

```bash
uvx maestro-install skill --agent all
```

Без `--agent` мастер спросит; с `--fast` он сам определяет установленных агентов и по
умолчанию берёт Claude Code. Верхняя папка бандла — `maestro/`; существующую `maestro/`
он сохраняет как `maestro.bak`.

По умолчанию бандл берётся с
`https://airi-maestro.github.io/care-docs/maestro.skill`. Переопределить можно через
`--skill-url` или переменную окружения `$MAESTRO_SKILL_URL` (зеркало или
зафиксированная версия):

```bash
uvx maestro-install skill --agent claude \
  --skill-url https://airi-maestro.github.io/care-docs/maestro.skill
```

:::note[Устаревший пакет]
Старый пакет `care-install` устарел и не умеет ставить скилл — всегда используйте
`maestro-install`. Принудительно обновить сам установщик: `uvx --refresh
maestro-install`.
:::

**Запасной путь вручную (без мастера).** Скачайте тот же URL и распакуйте сами:

```bash
curl -fsSLO https://airi-maestro.github.io/care-docs/maestro.skill
unzip maestro.skill -d ~/.claude/skills/     # → ~/.claude/skills/maestro/  (или ~/.codex/skills/, ~/.hermes/skills/)
```

В hermes команда `/skills` покажет **maestro**, вызов — `/maestro` (или просто опишите
задачу про Maestro). В Claude Code скилл срабатывает автоматически на задачах про
Maestro.

## 2. Сделайте `care` доступным (один раз)

Скилл управляет командой `care`; настройте её один раз опубликованным мастером (он же
ставит глобальный шим `care`):

```bash
uvx maestro-install        # воркспейс + .env + шим `care` в ~/.local/bin
```

Убедитесь, что `~/.local/bin` в `PATH`. Альтернативы: `uv tool install --editable
<чекаут>` или `export CARE_HOME=/путь/к/чекауту`. Работает и без установки — лаунчер
откатывается на `uvx --from maestro-care care`. См.
[Быстрый старт](/ru/care/getting-started/quick-start/).

## 3. Проверьте

Лаунчер сообщает, как он нашёл `care`, затем — health-check:

```bash
bash ~/.claude/skills/maestro/scripts/care.sh --where    # global | checkout | pypi
bash ~/.claude/skills/maestro/scripts/care.sh doctor     # конфиг + пробы сервисов
```

`doctor` должен показать ваш эндпоинт модели и доступную память. Готово — просите
агента «сгенерируй цепочку для …», «запусти цепочку X», «покажи память».

:::note[Пути к файлам]
Когда `care` резолвится в глобальный шим (или фолбэк `uvx`), он запускается из
**воркспейса** Maestro, поэтому относительные пути считаются относительно него.
Передавайте **абсолютные пути** для `--output`, `validate <file>`, `replay <file>` и
`import`-глобов.
:::

## Обновление

Перезапустите установку одной командой — она заменит папку, сохранив прежнюю копию как
`maestro.bak`. Скилл и CLI `care` версионируются независимо; перенастроить сам Maestro
можно через `uvx maestro-install reconfigure`.
