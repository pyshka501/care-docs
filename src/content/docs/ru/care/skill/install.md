---
title: Установка и использование
description: Установите переносимый навык Maestro одной командой для Claude Code, Codex, hermes или OpenClaw, сделайте CLI доступным и проверьте.
sidebar:
  order: 2
---

Переносимый навык Maestro — небольшой бандл (`maestro/` с `SKILL.md`, `scripts/` и
`references/`), который учит внешнего агента работать с Maestro. Ему нужен рабочий
CLI Maestro, который навык сам **не** ставит (см. шаг 2). Навык агента внутри
приложения поставляется вместе с приложением, ставить его не нужно.

## 1. Установка навыка

```bash
uvx maestro-install skill
```

`skill` — действие опубликованного мастера `maestro-install`. Оно скачивает бандл и
распаковывает его в каталог навыков выбранного агента. Мастер спросит, какого
агента выбрать, или укажите его через `--agent`:

| `--agent` | Каталог навыков |
| --- | --- |
| `claude` | `~/.claude/skills/` |
| `codex` | `~/.codex/skills/` |
| `hermes` | `~/.hermes/skills/` |
| `openclaw` | `~/.openclaw/skills/` |
| `all` | все четыре каталога выше |
| `<path>` | свой каталог навыков |

```bash
uvx maestro-install skill --agent all
```

С `--fast` (или `--non-interactive`) мастер ничего не спрашивает: ставит навык всем
агентам, у которых есть домашний каталог, а если таких нет — в Claude Code. Верхняя
папка бандла — `maestro/`. Существующая `maestro/` сохраняется как `maestro.bak`.

По умолчанию бандл скачивается с
`https://airi-maestro.github.io/care-docs/maestro.skill`. Другой адрес задаётся
через `--skill-url` или `$MAESTRO_SKILL_URL` (зеркало, форк, локальная сборка):

```bash
uvx maestro-install skill --agent claude \
  --skill-url https://airi-maestro.github.io/care-docs/maestro.skill
```

:::note[Старый пакет]
В старом пакете `care-install` действия `skill` нет, используйте `maestro-install`.
Обновить сам мастер: `uvx --refresh maestro-install`.
:::

**Вручную.** Скачайте тот же адрес и распакуйте сами:

```bash
curl -fsSLO https://airi-maestro.github.io/care-docs/maestro.skill
unzip maestro.skill -d ~/.claude/skills/     # → ~/.claude/skills/maestro/
```

В hermes команда `/skills` покажет **maestro**. Вызов — `/maestro` или просто
описание задачи для Maestro. В Claude Code навык срабатывает на задачах Maestro сам.

:::caution[Совпадение имён]
Навык определяется полем `name` во frontmatter, а не именем папки. Копия в
`maestro.bak/` тоже объявляет `name: maestro`. Если агент загружает все папки из
каталога навыков, после проверки новой версии удалите или перенесите копию.
:::

## 2. Сделать CLI доступным (один раз)

Навык вызывает команду `maestro`. Настройте Maestro один раз мастером, он же
поставит глобальный shim `maestro`:

```bash
uvx maestro-install        # рабочая папка + .env + shim `maestro` в ~/.local/bin
```

Проверьте, что `~/.local/bin` есть в `PATH`. Другие варианты:
`uv tool install --editable <checkout>` или `export CARE_HOME=/path/to/checkout`.
Работает и без установки: запускатель откатывается к
`uvx --from maestro-care maestro`. См. [Быстрый старт](/ru/care/getting-started/quick-start/).

## 3. Проверка

Запускатель из бандла показывает, как он нашёл CLI. Затем проверьте окружение:

```bash
bash ~/.claude/skills/maestro/scripts/care.sh --where    # global | checkout | pypi
bash ~/.claude/skills/maestro/scripts/care.sh doctor     # конфиг и проверки сервисов
```

`doctor` должен показать endpoint модели и доступную Memory. После этого попросите
агента «сгенерируй цепочку для …», «запусти цепочку X» или «покажи память».

:::note[Пути к файлам]
Когда CLI найден через глобальный shim или `uvx`, он работает из вашей **рабочей
папки** Maestro, и относительные пути считаются от неё. Передавайте **абсолютные
пути** в `--output`, `--export`, `run --file`, `validate`, `replay`, шаблоны
`import` и `dataset export`.
:::

## Обновление

Повторите `uvx maestro-install skill`: папка заменится, прежняя копия останется как
`maestro.bak`. Навык и CLI версионируются отдельно. В бандле релиза 0.5.0 в начале
`SKILL.md` написано `Skill revision: cli/0.5.0`. Сам Maestro обновляется через
`uvx maestro-install update`, перенастраивается через
`uvx maestro-install reconfigure`.
