---
title: AgentSkills Overview
description: Run a portable AgentSkill folder (SKILL.md plus scripts and references) as a chain step, in one of five execution modes.
sidebar:
  order: 1
---

[AgentSkills](https://agentskills.io) are portable skill folders: a `SKILL.md`
with YAML frontmatter and instructions, plus optional `scripts/`, `references/`
and `assets/`. `AgentSkillStepDescription` runs one skill as a chain step.

```python
from mmar_carl import (
    AgentSkillStepDescription, AgentSkillStepConfig, AgentSkillExecutionMode,
)

AgentSkillStepDescription(
    number=1,
    title="Extract PDF text",
    config=AgentSkillStepConfig(
        skill="github://anthropics/skills/skills/pdf@main",
        task="Extract the text from {pdf_path} and summarise it.",
        execution_mode=AgentSkillExecutionMode.LLM_AGENT,
        input_mapping={"pdf_path": "$memory.input.pdf_path"},
    ),
)
```

The core package runs skills without extras. Optional extras:

```bash
pip install 'mmar-carl[agent-skills]'   # agent-skills library for SkillLoader.catalog_from_agent_skills()
pip install 'mmar-carl[skills]'         # agent-skills + pdf + pptx (the PDF -> PPTX example)
```

:::caution[Skills run on the host]
In CARL 0.5.0 an AgentSkill step executes scripts only with `runtime="local"`,
which is a host subprocess with no isolation. Choosing `docker`, `e2b` or
`firejail` makes script execution fail. Run only skills you trust. To run
untrusted code in a sandbox, use a fixed [CommandStep](/carl/steps/command/).
Details: [Sandboxing & LLM_AGENT](/carl/skills/sandbox/).
:::

## Skill identity

`skill` accepts a string or an `AgentSkillSource`. A string is converted to an
`AgentSkillSource` when the config is built:

| String form | Becomes | How the step loads it |
| --- | --- | --- |
| `github://owner/repo/path@ref` | `git_url` + `git_subdirectory` + `git_ref` | GitHub tarball through `GithubResolver`; no `git` binary. Ref defaults to `main`. |
| `/abs/path`, `./rel`, `../rel`, `local:///abs/path`, anything ending in `/` | `path` | Directory with a `SKILL.md`. |
| `module://pkg.name` | `package` | Package directory, or `<pkg>/skills/<last-name>/`. |
| `https://...`, `http://...`, `git@...` | `git_url` | `https://github.com/...` goes through `GithubResolver`; any other URL is cloned with `git clone --depth=1`. |
| any other string, e.g. `pdf` | `name` | Searched in `search_paths`, then `./.agents/skills`, `./.claude/skills`, `~/.agents/skills`, `~/.claude/skills`. |

A tarball URL such as `https://host/skill.tar.gz` is **not** downloaded by the
step: the step treats it as a git URL. Fetch tarballs with
[`resolve_skill()`](/carl/skills/resolvers/) and pass the local path.

## Execution modes

| Mode | Behaviour |
| --- | --- |
| `LLM` (default) | `SKILL.md` goes into the system prompt; one LLM call with the task as the user turn. |
| `SCRIPT` | Runs one bundled `.py` or `.sh` script, no LLM. `script_name` picks it; without it the skill must have exactly one script. Inputs are passed as `--key value`. A non-zero exit fails the step. |
| `HYBRID` | Runs the script first; falls back to `LLM` mode if it fails, raises or prints nothing. |
| `SUBAGENT` | Runs the script, then the LLM reasons over its output. If the script fails, the LLM still runs with an error note. |
| `LLM_AGENT` | Tool-calling loop over five fixed tools (`run_script`, `read_file`, `write_file`, `list_resources`, `read_resource`), up to `llm_max_iterations` rounds. See [the workspace model](/carl/skills/sandbox/#the-llm_agent-workspace). |

`LLM_AGENT` needs a client that implements `get_response_with_tools`. The base
client's default returns no tool calls, so with such a client the loop ends after
one plain LLM call.

:::caution[`allowed-tools` is not enforced]
The `allowed-tools` field of `SKILL.md` is printed into the system prompt as
`**Allowed tools**: ...` and nothing more. `LLM_AGENT` always offers the same five
tools, whatever the skill declares. The only runtime use of `allowed-tools` is
reading `WebFetch(domain:...)` hosts into the network allowlist, which the local
runtime does not enforce either.
:::

## Config fields

All fields of `AgentSkillStepConfig` with their defaults in 0.5.0:

| Field | Default | Purpose |
| --- | --- | --- |
| `skill` | required | Skill string or `AgentSkillSource` (see above). |
| `task` | required | Task text. `{key}` placeholders are filled from `input_mapping`. |
| `execution_mode` | `LLM` | One of the five modes. |
| `input_mapping` | `{}` | Name to [reference](/carl/chains/dynamic-references/) (`$history[-1]`, `$memory.ns.key`, ...). |
| `output_key` | `"result"` | Label for the result. |
| `output_memory_key` | `None` | If set, the text result is written to memory under this key. |
| `output_memory_namespace` | `"agent_skill"` | Namespace for `output_memory_key`. |
| `output_file_key` | `None` | If set, the path of the first output file is written to `agent_skill.<key>`. |
| `llm_config` | `None` | Per-step LLM override. |
| `system_prompt_prefix` | `None` | Text placed before the skill instructions. |
| `include_skill_description` | `True` | Include the frontmatter `description`. |
| `max_instructions_chars` | `3000` | Truncate instructions; `None` for no limit. |
| `strip_code_blocks` | `True` | Drop fenced code blocks from the instructions. |
| `filter_security_terms` | `True` | Drop sections whose headings mention password / encrypt / decrypt / crypt, and such items from the description. |
| `script_name` | `None` | Script for `SCRIPT` / `HYBRID` / `SUBAGENT`, relative to the skill dir. |
| `script_args` | `{}` | Static `--key value` args, merged with resolved inputs. |
| `python_executable` | `"python"` | Interpreter for `.py` scripts. |
| `working_dir` | `None` | Script cwd; defaults to the skill directory. |
| `cache_skills` | `True` | Cache parsed manifests in the loader. |
| `skill_cache_dir` | `None` | Cache for `git clone` checkouts (default `~/.cache/mmar_carl/skills`). GitHub tarballs always use the default cache. |
| `timeout` | `120.0` | Seconds per script run. |
| `llm_max_iterations` | `8` | Max rounds in `LLM_AGENT`. |
| `persist_workspace` | `False` | `LLM_AGENT`: keep the workspace and write its path to `agent_skill.<output_memory_key or title>_workspace`. |
| `output_capture` | `"both"` | `LLM_AGENT`: `"stdout"`, `"files"` or `"both"`. |
| `output_files_glob` | `["*"]` | `LLM_AGENT`: which files from `out/` are collected. |
| `runtime` | `"local"` | Script runtime. Only `local` works for this step, see [sandboxing](/carl/skills/sandbox/). |
| `runtime_config` | `{}` | Network policy keys (`network`, `network_allowlist`); validated, not enforced on `local`. |
| `trust_policy` | `"any"` | `"any"` or `"sha_pinned"`. **Not checked by the step**, see below. |
| `skill_sha256` | `None` | Expected `SKILL.md` digest. **Not checked by the step.** |
| `extra_pip` | `[]` | Packages installed with `pip install --target` into a temporary overlay put on `PYTHONPATH`. Runs on the host. |
| `output_schema` | `None` | `LLM_AGENT` only: light JSON-schema check of the final answer (`type`, `properties`, `required`, `items`). |
| `output_schema_strict` | `True` | Fail the step on a parse or schema error; `False` records `schema_warnings` instead. |

:::caution[Integrity pinning is not applied by the step]
`trust_policy` and `skill_sha256` are stored and serialized, but the step
executor never reads them: a step with `trust_policy="sha_pinned"` and a wrong
digest still runs. To pin a skill, call
[`resolve_skill(..., sha256=..., trust_policy="sha_pinned")`](/carl/skills/resolvers/)
yourself before building the chain, and pass the verified local path as `skill`.
:::

## Result

`result_data` holds `skill_name` and `execution_mode`, plus mode-specific keys:
`stderr` / `returncode` for `SCRIPT`, `script_used` / `llm_fallback` /
`script_error` for `HYBRID`, and `iterations`, `tool_calls_made`,
`output_files`, `parsed_output`, `schema_validated`, `schema_warnings`,
`workspace_root` for `LLM_AGENT`. The history entry is tagged `[skill:<name>]`.

## Serialization and preflight

AgentSkill steps round-trip through `chain.to_dict()` / `from_dict()`. The skill
is stored as the converted `AgentSkillSource` (for example `git_url` +
`git_subdirectory`), not as the original URI string. See
[JSON serialization](/carl/serialization/json/).

`chain.preflight(context)` lists skill identifiers in `required_skills`;
`missing_skills` is always empty because skills are not resolved during
preflight. See [Preflight](/carl/care-integration/preflight/).

## See also

- [Skill resolvers](/carl/skills/resolvers/) · [Sandboxing & LLM_AGENT](/carl/skills/sandbox/)
- [AgentSkill example](https://github.com/Glazkoff/carl/blob/main/examples/agents/agent_skill_example.py) (PDF -> analysis -> PPTX).
