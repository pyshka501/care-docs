---
title: Резолверы навыков
description: Разрешение навыков с GitHub, из HTTPS-архивов, локальных путей и Python-пакетов, с дисковым кэшем и пиннингом SHA-256.
sidebar:
  order: 2
---

`resolve_skill(uri)` превращает URI навыка в локальную папку и возвращает
`ResolvedSkill`. Он нужен, когда навык надо скачать, закрепить и проверить до
запуска цепочки.

```python
from mmar_carl import resolve_skill

skill = resolve_skill("github://anthropics/skills/skills/pdf@main")
skill.local_root        # ~/.cache/mmar_carl/skills/github/<key16>/skills/pdf
skill.sha256            # SHA-256 of SKILL.md
skill.resolved_version  # "anthropics/skills@main"
```

В `ResolvedSkill` также есть `name`, `skill_md_path`, `frontmatter`,
`instructions`, `scripts`, `references`, `assets` и `to_memory_payload()` для
карточки памяти.

:::note
**Шаг** AgentSkill не вызывает `resolve_skill`. Он загружает навыки через
`SkillLoader`. `github://` там обрабатывается так же, но остальные `https://`
считаются git-репозиториями, а `trust_policy` игнорируется. См.
[обзор AgentSkills](/ru/carl/skills/overview/).
:::

## Схемы

`SkillResolverRegistry` выбирает резолвер по префиксу:

| URI | Резолвер | Примечания |
| --- | --- | --- |
| `github://owner/repo[/subpath][@ref]` | `GithubResolver` | Скачивает `codeload.github.com/<owner>/<repo>/tar.gz/<ref>`, запасной адрес `github.com/<owner>/<repo>/archive/<ref>.tar.gz`. Ref по умолчанию `main`. Нужен `httpx`. |
| `https://...` / `http://...` | `HttpsTarballResolver` | Скачивает архив `.tar.*` или `.zip` и ищет в нём первый `SKILL.md`. Можно добавить фрагмент `#sha256=<hex>`. Нужен `httpx`. |
| `local:///abs/path` | `LocalResolver` | В папке должен быть `SKILL.md`. |
| `module://pkg.name` | `ModuleResolver` | Папка пакета или `<pkg>/skills/<последнее-имя>/`. |
| всё остальное | `LocalResolver` | Считается путём в файловой системе (`~` раскрывается). Голые имена здесь **не** ищутся, это делает `SkillLoader`. |

Публичного метода для новых схем у реестра нет. Другой источник разрешайте сами
и передавайте локальный путь.

## Кэш

Корень кэша по умолчанию `~/.cache/mmar_carl/skills` (меняется через
`resolve_skill(..., cache_dir=...)`):

- GitHub: `github/<key16>/<subpath>/`, где `key16` — первые 16 hex-символов
  `sha256("owner/repo/subpath@ref")`. TTL нет. Плавающий ref вроде `main`
  остаётся на первом скачанном коммите, пока не передан `force_refresh=True`.
- HTTPS: `https/<key16>/`, ключ — URL.
- `SkillLoader` (его использует шаг) клонирует не-GitHub git-адреса в `git/<key16>/`.

`list_cached_skills()` обходит кэш и возвращает по одному `ResolvedSkill` на
каждый `SKILL.md`, по имени. Битые записи пропускаются.

## Целостность (пиннинг SHA-256)

```python
from mmar_carl import resolve_skill, SkillIntegrityError

try:
    skill = resolve_skill(
        "github://anthropics/skills/skills/pdf@main",
        sha256="<hex digest of SKILL.md>",
        trust_policy="sha_pinned",
    )
except SkillIntegrityError:
    ...  # SKILL.md changed upstream
```

Что проверяется, зависит от резолвера:

| Резолвер | Поведение |
| --- | --- |
| `github://` | С `trust_policy="sha_pinned"` сравнивает `sha256` с хэшем распакованного `SKILL.md`, и при скачивании, и при попадании в кэш. Если `sha256` равен `None`, проверки нет и ошибки тоже. |
| `local://`, обычные пути, `module://` | Сравнивает `sha256` с `SKILL.md`, если `sha256` передан. `trust_policy` игнорируется. |
| `https://` | `sha_pinned` без хэша даёт `SkillIntegrityError`. При свежем скачивании один и тот же хэш сравнивается и с байтами архива, и с `SKILL.md`. Поэтому в 0.5.0 пиннинг свежего скачивания падает с любым хэшем. |

Хэшируется только `SKILL.md`. Скрипты, справочники и ассеты рядом с ним пин не
покрывает.

Ошибки: `SkillResolveError` (не удалось найти, скачать или разобрать) и
`SkillIntegrityError` (хэш не совпал или его нет). Обе экспортируются из
`mmar_carl`.

## Поиск установленных навыков

```python
from mmar_carl import SkillLoader

SkillLoader().catalog()       # [(name, description)] from SKILL.md dirs
SkillLoader().catalog_all()   # + skills from the agent-skills library, deduplicated by name
SkillLoader().catalog_all(payloads=True)  # list of memory-card dicts
```

`catalog()` просматривает `./.agents/skills`, `./.claude/skills`,
`~/.agents/skills`, `~/.claude/skills` и дополнительные пути. `catalog_all()`
добавляет `catalog_from_agent_skills()`. Для него нужен extra
`mmar-carl[agent-skills]`, без него он возвращает `[]`. С `payloads=True`
возвращаются только папки с `SKILL.md`, записей из библиотеки agent-skills там
нет.

`SkillManifest` — разобранный `SKILL.md`. `get_allowed_tools()` и
`get_allowed_tool_names()` разбирают поле `allowed-tools`. Это описательные
помощники: CARL по ним инструменты не ограничивает.

:::caution
Навыки Anthropic `pdf` и `pptx` — source-available, а не open source.
Загружайте их во время работы и не распространяйте.
:::

## См. также

- [Обзор AgentSkills](/ru/carl/skills/overview/) · [Песочница](/ru/carl/skills/sandbox/)
- [Пример резолвера](https://github.com/Glazkoff/carl/blob/main/examples/skills/skill_resolver_example.py)
