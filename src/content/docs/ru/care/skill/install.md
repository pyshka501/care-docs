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

Скачать **и** распаковать в каталог скиллов вашего агента через `uv`:

```bash
uv run https://raw.githubusercontent.com/pyshka501/care-docs/main/public/install.py
```

Он сам определит Claude Code (`~/.claude/skills`) и hermes (`~/.hermes/skills`) и
распакует скилл в `<dir>/maestro`. Явный выбор — `-- --target claude|hermes|both`:

```bash
uv run https://raw.githubusercontent.com/pyshka501/care-docs/main/public/install.py -- --target both
```

Нет `uv`? Тот же скрипт работает под обычным Python, либо распакуйте бандл вручную:

```bash
# curl + python
curl -fsSL https://raw.githubusercontent.com/pyshka501/care-docs/main/public/install.py | python3 - --target claude

# полностью вручную
curl -fsSLO https://raw.githubusercontent.com/pyshka501/care-docs/main/public/maestro.skill
unzip maestro.skill -d ~/.claude/skills/     # → ~/.claude/skills/maestro/  (или ~/.hermes/skills/)
```

В hermes команда `/skills` покажет **maestro**, вызов — `/maestro` (или просто опишите
задачу про Maestro). В Claude Code скилл срабатывает автоматически на задачах про
Maestro.

## 2. Сделайте `care` доступным (один раз)

Скилл управляет командой `care`; настройте её один раз опубликованным мастером (он же
ставит глобальный шим `care`):

```bash
uvx care-install        # воркспейс + .env + шим `care` в ~/.local/bin
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
`maestro.bak`. Скилл и CLI `care` версионируются независимо; обновляйте сам Maestro
через `uvx care-install update`.
