---
title: Deploying Agents
description: Ship a saved chain to the agent hub and serve it as an HTTP agent with its own Swagger UI.
sidebar:
  order: 4
---

*Added in MAESTRO 0.0.3.*

`/deploy` ships a saved chain to the **agent hub** — one lightweight local process
that serves each deployed chain as an HTTP agent, mounted at `/agents/<name>` with
its own Swagger UI at `/agents/<name>/docs`.

## Install

The hub ships as a separate package so the base install stays light:

```bash
pip install "maestro-care[deploy]"
```

That puts the `carl-agent-hub` CLI on your PATH (it's also bundled in the `[full]`
extra). MAESTRO autostarts it for you on the first `/deploy`, so you rarely run
it by hand.

## Deploy a chain

In **Production** mode (Memory must be configured):

```text
/deploy <ref> [--channel <ch>] [--name <agent>]
```

- **`<ref>`** — a chain entity id or a name-search query (may contain spaces).
- **`--channel`** — which channel to deploy. Defaults to **`stable`** — production
  ships the released version, not the dev tip.
- **`--name`** — the agent's name on the hub (defaults from the chain).

What happens:

1. **Resolve** the chain on the requested channel (with a `latest` fallback).
2. **Deploy gate** — a client-side check (the chain loads, uses only template-safe
   tools, and passes the MAGE lint). On failure the issues are listed and **nothing
   is deployed**.
3. **Hub up** — if the hub is down and `autostart` is on, MAESTRO spawns it and
   waits for `/healthz`.
4. **Deploy** — `POST /deployments`; the hub mounts the agent.
5. You get the **agent URL**, a link to its **Swagger docs**, and a readiness line.

## What you get

Each deployment is an HTTP agent on the hub:

- **Agent endpoint** — `…/agents/<name>`
- **Swagger UI** — `…/agents/<name>/docs`

One hub hosts many chains at once and persists them between restarts (its
`state_file`), so deployed agents survive a hub restart.

## Configure the hub

The `[hub]` section (env prefix `CARE_HUB__`):

| Setting | Default | Purpose |
| --- | --- | --- |
| `base_url` | `http://127.0.0.1:8080` | Hub control API the client talks to. |
| `port` | `8080` | Port autostart serves on (must agree with `base_url`). |
| `autostart` | `true` | Spawn the hub when it's down. |
| `state_file` | `~/.maestro/agent-hub.json` | Where the hub persists deployments. |
| `agent_server_cmd` | `["carl-agent-hub", "serve"]` | Command MAESTRO spawns to autostart (gets `--port` / `--state-file` appended). |
| `start_timeout` | `15` | Seconds to wait for `/healthz` after autostart. |
| `timeout` | `30` | Per-request timeout for control-API calls. |

See [Configuration → sections](/care/configuration/sections/).

## From the CLI

`/deploy` has headless twins: `care deploy`, `care deployments`, and
`care metrics` mirror these screens from the terminal. One caveat — the CLI does
**not** autostart the hub, so you must already have one running. See
[Deploy to the agent hub](/care/cli/deploy/).

## Notes

- It needs **Memory** (the chain registry), like the other Production commands.
- For a fire-and-forget POST to an external service instead of the hub, see
  [`/upload`](/care/slash-commands/production/).

## See also

- [Deploy to the agent hub](/care/cli/deploy/) — the `care deploy/deployments/metrics` CLI
- [Production mode](/care/workflows/production/) · [Scenarios](/care/workflows/scenarios/)
