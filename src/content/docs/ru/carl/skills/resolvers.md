---
title: Резолверы навыков
description: Разрешение навыков с GitHub, локальных путей, HTTPS или Python-модулей — с кэшированием и SHA-пинингом.
sidebar:
  order: 2
---

`resolve_skill(uri)` загружает навык из URI и возвращает дескриптор с извлечённым
локальным путём. Поле `AgentSkillStepConfig.skill` использует то же разрешение.

```python
from mmar_carl import resolve_skill

skill = resolve_skill("github://anthropics/skills/skills/pdf@main")
print(skill.local_root)   # ~/.cache/mmar_carl/skills/github/<key>/skills/pdf
```

## Поддерживаемые схемы

| Схема | Откуда разрешается |
| --- | --- |
| `github://owner/repo/path@ref` | GitHub tarball (без `git`). |
| `local://` / обычный путь | Локальная директория. |
| `https://` | Удалённый архив. |
| `module://pkg.path` | Python-пакет. |

`SkillResolverRegistry` диспетчеризует по схеме; регистрируйте пользовательские резолверы для расширения.
`GithubResolver` скачивает tarball-архивы с `codeload.github.com` и кэширует их в
`~/.cache/mmar_carl/skills/github/<key>/`.

## Целостность (SHA-пининг)

Прикрепите навык к известному дайджесту `SKILL.md`, чтобы обнаруживать скомпрометированный upstream:

```python
skill = resolve_skill(
    "github://anthropics/skills/skills/pdf@main",
    sha256="<hex-of-SKILL.md>",
    trust_policy="sha_pinned",
)
```

С `trust_policy="sha_pinned"` CARL проверяет SHA256 локального `SKILL.md`
после извлечения и вызывает `SkillIntegrityError` при несовпадении. Принудительно обновите
через `GithubResolver().resolve(uri, force_refresh=True)`.

## Обнаружение установленных навыков

```python
from mmar_carl import SkillLoader

skills = SkillLoader().catalog_all()   # SKILL.md dirs + the agent-skills library
```

`SkillManifest` парсит frontmatter `SKILL.md`, включая
`get_allowed_tools()` / `get_allowed_tool_names()` для списка `allowed-tools`.

:::caution
Навыки Anthropic `pdf` и `pptx` **доступны в исходных кодах, но не open-source** —
загружайте их во время выполнения; не распространяйте.
:::

## Смотрите также

- [Обзор AgentSkills](/ru/carl/skills/overview/) · [Изолированная среда](/ru/carl/skills/sandbox/)
