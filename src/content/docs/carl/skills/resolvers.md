---
title: Skill Resolvers
description: Resolve skills from GitHub, HTTPS tarballs, local paths or Python packages, with an on-disk cache and SHA-256 pinning.
sidebar:
  order: 2
---

`resolve_skill(uri)` turns a skill URI into a local directory and returns a
`ResolvedSkill`. Use it when you want to download, pin and inspect a skill
before a chain runs.

```python
from mmar_carl import resolve_skill

skill = resolve_skill("github://anthropics/skills/skills/pdf@main")
skill.local_root        # ~/.cache/mmar_carl/skills/github/<key16>/skills/pdf
skill.sha256            # SHA-256 of SKILL.md
skill.resolved_version  # "anthropics/skills@main"
```

`ResolvedSkill` also carries `name`, `skill_md_path`, `frontmatter`,
`instructions`, `scripts`, `references`, `assets`, and `to_memory_payload()`
for a memory card.

:::note
The AgentSkill **step** does not call `resolve_skill`. It loads skills through
`SkillLoader`, which handles `github://` the same way but treats other
`https://` URLs as git repositories, and ignores `trust_policy`. See
[AgentSkills overview](/carl/skills/overview/#skill-identity).
:::

## Schemes

`SkillResolverRegistry` dispatches by prefix:

| URI | Resolver | Notes |
| --- | --- | --- |
| `github://owner/repo[/subpath][@ref]` | `GithubResolver` | Downloads `codeload.github.com/<owner>/<repo>/tar.gz/<ref>`, falls back to `github.com/<owner>/<repo>/archive/<ref>.tar.gz`. Ref defaults to `main`. Needs `httpx`. |
| `https://...` / `http://...` | `HttpsTarballResolver` | Downloads a `.tar.*` or `.zip` archive and finds the first `SKILL.md` inside. Optional `#sha256=<hex>` fragment. Needs `httpx`. |
| `local:///abs/path` | `LocalResolver` | Directory must contain `SKILL.md`. |
| `module://pkg.name` | `ModuleResolver` | Package dir, or `<pkg>/skills/<last-name>/`. |
| anything else | `LocalResolver` | Treated as a filesystem path (`~` is expanded). Bare names are **not** searched here; that is `SkillLoader`'s job. |

The registry has no public method for adding schemes. To support another
source, resolve it yourself and pass the local path.

## Cache

The default cache root is `~/.cache/mmar_carl/skills` (override with
`resolve_skill(..., cache_dir=...)`):

- GitHub: `github/<key16>/<subpath>/`, where `key16` is the first 16 hex chars of
  `sha256("owner/repo/subpath@ref")`. The cache has no TTL; a moving ref such as
  `main` stays at the first downloaded commit until you pass `force_refresh=True`.
- HTTPS: `https/<key16>/`, keyed by the URL.
- `SkillLoader` (used by the step) clones non-GitHub git URLs into `git/<key16>/`.

`list_cached_skills()` walks the cache and returns one `ResolvedSkill` per cached
`SKILL.md`, sorted by name; broken entries are skipped.

## Integrity (SHA-256 pinning)

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

What is checked depends on the resolver:

| Resolver | Behaviour |
| --- | --- |
| `github://` | With `trust_policy="sha_pinned"`, compares `sha256` to the digest of the extracted `SKILL.md`, on fresh downloads and cache hits. If `sha256` is `None`, nothing is checked and no error is raised. |
| `local://`, plain paths, `module://` | Compares `sha256` to `SKILL.md` whenever `sha256` is given; `trust_policy` is ignored. |
| `https://` | `sha_pinned` without a digest raises `SkillIntegrityError`. On a fresh download the same digest is compared to both the archive bytes and `SKILL.md`, so pinning a fresh download fails in 0.5.0 whichever digest you pass. |

Only `SKILL.md` is hashed. Scripts, references and assets next to it are not
covered by the pin.

Errors: `SkillResolveError` (cannot locate, download or parse) and
`SkillIntegrityError` (digest mismatch or missing pin). Both are exported from
`mmar_carl`.

## Discovering installed skills

```python
from mmar_carl import SkillLoader

SkillLoader().catalog()       # [(name, description)] from SKILL.md dirs
SkillLoader().catalog_all()   # + skills from the agent-skills library, deduplicated by name
SkillLoader().catalog_all(payloads=True)  # list of memory-card dicts
```

`catalog()` scans `./.agents/skills`, `./.claude/skills`, `~/.agents/skills`,
`~/.claude/skills` plus any extra paths. `catalog_all()` adds
`catalog_from_agent_skills()`, which needs the `mmar-carl[agent-skills]` extra and
returns `[]` without it. With `payloads=True` only `SKILL.md` directories are
included; agent-skills library entries are not.

`SkillManifest` is the parsed `SKILL.md`. `get_allowed_tools()` and
`get_allowed_tool_names()` parse the `allowed-tools` frontmatter. These are
descriptive helpers: CARL does not restrict tools based on them.

:::caution
Anthropic's `pdf` and `pptx` skills are source-available, not open source.
Fetch them at runtime; don't redistribute them.
:::

## See also

- [AgentSkills overview](/carl/skills/overview/) · [Sandboxing](/carl/skills/sandbox/)
- [Resolver example](https://github.com/Glazkoff/carl/blob/main/examples/skills/skill_resolver_example.py)
