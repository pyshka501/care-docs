---
title: Connect an agent
description: Connect Codex, Claude Code, or OpenCode to a project lake and understand the IdeaL MCP tools it uses.
sidebar:
  order: 1
---

IdeaL works with agents through a stateless MCP connection. Set it up through
the project console. Open **Подключить агента**, copy the instruction, and
follow it in the agent’s terminal. The connection instruction is personal.

After setup, start a new conversation. The agent first checks its current
projects and mode, so changes made in the console take effect without a new
manual configuration.

## Connection modes

| Mode | When to use it |
| --- | --- |
| **Simple use** | You want IdeaL only when you explicitly ask the agent to use the project lake. |
| **Superpower** | You want the supported plugin to keep IdeaL active throughout connected improvement work. |

The mode is stored with the connected agent and can be changed from the
console’s agent list.

## MCP tools

The agent calls these tools; users normally do not call them by hand.

| Tool | Purpose |
| --- | --- |
| `ideal_agent` | Read the connected projects, active mode, and current instructions at the start of a session. |
| `ideal_namespaces` | List available lakes for a manual connection that is not attached to a project. |
| `ideal_catalog` | Read relevant ideas, tools, and saved solutions once before building. |
| `ideal_start_run` | Start an improvement run and return its live radar link. |
| `ideal_ideas` | Get suggestions before one evaluated change. |
| `ideal_report_change` | Report the result of that change. |
| `ideal_report_run` | Finish the run and save its best reusable solution. |

The MCP server also exposes the full agent guide as `ideal://AGENTS.md` and
the seeding workflow as `ideal://skill/SKILL.md`.

## Expected agent behaviour

For a connected run, the agent should:

1. consult the catalog before the first solution;
2. start one run and show its live link immediately;
3. retrieve suggestions before every evaluated change;
4. report the result of every change;
5. finish the run with the best solution found, even when work stops early.

## See also

- [Quick start](/ideal/getting-started/quick-start/)
- [Projects and lakes](/ideal/concepts/projects-and-lakes/)
