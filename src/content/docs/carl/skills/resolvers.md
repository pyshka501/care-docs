---
title: Skill Resolvers
description: Resolve skills from GitHub, local paths, HTTPS, or Python modules — with caching and SHA pinning.
sidebar:
  order: 2
---

`resolve_skill(uri)` fetches a skill from a URI and returns a handle with the
extracted local path. The `AgentSkillStepConfig.skill` field uses the same
resolution.

```python
from mmar_carl import resolve_skill

skill = resolve_skill("github://anthropics/skills/skills/pdf@main")
print(skill.local_root)   # ~/.cache/mmar_carl/skills/github/<key>/skills/pdf
```

## Supported schemes

| Scheme | Resolves from |
| --- | --- |
| `github://owner/repo/path@ref` | A GitHub tarball (no `git` needed). |
| `local://` / plain path | A local directory. |
| `https://` | A remote archive. |
| `module://pkg.path` | A Python package. |

`SkillResolverRegistry` dispatches by scheme; register custom resolvers to extend it.
`GithubResolver` downloads tarballs from `codeload.github.com` and caches them under
`~/.cache/mmar_carl/skills/github/<key>/`.

## Integrity (SHA pinning)

Pin a skill to a known `SKILL.md` digest so a compromised upstream is caught:

```python
skill = resolve_skill(
    "github://anthropics/skills/skills/pdf@main",
    sha256="<hex-of-SKILL.md>",
    trust_policy="sha_pinned",
)
```

With `trust_policy="sha_pinned"`, CARL verifies the SHA256 of the local `SKILL.md`
after extraction and raises `SkillIntegrityError` on a mismatch. Force a fresh
download with `GithubResolver().resolve(uri, force_refresh=True)`.

## Discovering installed skills

```python
from mmar_carl import SkillLoader

skills = SkillLoader().catalog_all()   # SKILL.md dirs + the agent-skills library
```

`SkillManifest` parses the `SKILL.md` frontmatter, including
`get_allowed_tools()` / `get_allowed_tool_names()` for the `allowed-tools` list.

:::caution
Anthropic's `pdf` and `pptx` skills are **source-available, not open-source** —
fetch them at runtime; don't redistribute.
:::

## See also

- [AgentSkills overview](/carl/skills/overview/) · [Sandboxing](/carl/skills/sandbox/)
