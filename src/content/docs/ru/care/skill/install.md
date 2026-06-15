---
title: Установка и использование
description: Скачайте скилл care-cli, установите для Claude Code или hermes, сделайте `care` доступным и проверьте.
sidebar:
  order: 2
---

Скилл — это zip, верхняя папка в котором `care-cli/`. «Установить» значит положить эту
папку в каталог скиллов вашего агента. Нужна рабочая команда `care` — скилл *управляет*
CARE, но не устанавливает его.

## 1. Сделайте `care` доступным (один раз)

Проще всего — опубликованный мастер, он же ставит глобальный шим `care`:

```bash
uvx care-install        # воркспейс + .env + шим `care` в ~/.local/bin
```

Убедитесь, что `~/.local/bin` есть в `PATH`. Альтернативы: глобально через
`uv tool install --editable <чекаут maestro-care>`, либо указать скиллу путь —
`export CARE_HOME=/path/to/maestro-care`. (Работает и без установки — лаунчер
откатывается на `uvx --from maestro-care care`.) Полная настройка —
[Быстрый старт](/ru/care/getting-started/quick-start/).

## 2. Установите скилл

Скачайте **[`care-cli.skill`](/care-cli.skill)** и распакуйте в нужный каталог:

```bash
# Claude Code
unzip care-cli.skill -d ~/.claude/skills/          # -> ~/.claude/skills/care-cli/

# hermes (NousResearch) — стандарт agentskills.io
unzip care-cli.skill -d ~/.hermes/skills/          # -> ~/.hermes/skills/care-cli/
```

В hermes команда `/skills` покажет **care-cli**, вызов — `/care-cli` (или просто
опишите задачу про CARE — описание скилла написано так, чтобы срабатывать). В Claude
Code скилл срабатывает, когда задача упоминает CARE / MAGE / CARL-цепочки / команду
`care`.

## 3. Проверьте

Лаунчер сообщает, как он нашёл `care`, затем — health-check:

```bash
bash ~/.claude/skills/care-cli/scripts/care.sh --where      # global | checkout | pypi
bash ~/.claude/skills/care-cli/scripts/care.sh doctor       # env, конфиг, пробы сервисов
```

`doctor` должен показать ваш MAGE-эндпоинт и доступную Memory. Готово — просите агента
«сгенерируй цепочку для …», «запусти цепочку X», «покажи память CARE».

:::note[Пути к файлам]
Когда `care` резолвится в глобальный шим (или фолбэк `uvx`), он запускается из
**воркспейса** CARE, поэтому относительные пути считаются относительно него. Передавайте
**абсолютные пути** для `--output`, `validate <file>`, `replay <file>` и `import`-глобов,
чтобы поведение было одинаковым при любом способе резолва.
:::

## Обновление

Перекачайте `care-cli.skill` и распакуйте поверх существующей папки (с заменой). Скилл и
CLI `care` версионируются независимо — обновляйте сам CARE через `uvx care-install update`
(или повторным `uv tool install`).
