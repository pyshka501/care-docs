---
title: Deploy to the agent hub
description: Headless twins of /deploy, /deployments, and /metrics — ship a chain to the agent hub and inspect it from the terminal.
sidebar:
  order: 6.7
---

These are the terminal twins of the **agent hub** screens — `care deploy`,
`care deployments`, and `care metrics` mirror the TUI's `/deploy`,
`/deployments`, and `/metrics`. A deployed chain is served as an HTTP agent on
the hub, with its own Swagger UI.

:::caution[The hub is not autostarted in headless mode]
The TUI spins up the agent hub for you on the first `/deploy`. The CLI does
**not** — there is no background process behind a headless command. You must
already have a hub running, otherwise every command here fails with
`hub is not running` and **exit code 2**. See
[Deploying Agents](/care/workflows/deploy/) for hub install, configuration, and
autostart inside the TUI.
:::

## `care deploy <chain_id>`

Deploy a saved chain to the agent hub as an HTTP agent. The command mints an
`api_key`; the hub then fetches the chain by `entity_id` on the given channel
and validates that it loads (a rejection surfaces here).

```bash
care deploy weather-risk --name weather-risk --channel stable
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `chain_id` | — | Memory `entity_id` of the chain to deploy. |
| `--name NAME` | slug of `chain_id` | Agent name on the hub. |
| `--channel C` | `stable` | Channel to deploy — production ships the released version, not the dev tip. |

On success it prints the deployed agent's name, its **URL**, and a link to its
`/docs` (Swagger) page. There is **no `--json`** for this command.

## `care deployments`

List the agents currently on the hub — a readiness badge, URL, version, and run
count per deployment.

```bash
care deployments
care deployments --json
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--json` | off | Emit JSON instead of the badge list. |

## `care metrics [name]`

Usage / cost metrics. Pass an agent **name** to read that agent's `/metrics`;
omit it to summarise run counts across all deployments.

```bash
care metrics weather-risk        # one agent's metrics
care metrics                     # run-count summary across the hub
care metrics --json
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `name` | — | Agent name (omit to summarise all deployments). |
| `--json` | off | Emit JSON. |

---

## Example: deploy, list, inspect

Deploy a chain on the stable channel, confirm it landed, then read its metrics:

```bash
# 1. Deploy the chain (hub must already be running)
care deploy weather-risk --channel stable
# → deployed: weather-risk  →  http://127.0.0.1:8080/agents/weather-risk  (docs: …/docs)

# 2. List what's on the hub
care deployments
# → ● weather-risk  http://127.0.0.1:8080/agents/weather-risk  v1  runs=0

# 3. Read its usage metrics
care metrics weather-risk
```

:::note
Exit code `2` from any of these means the hub is unreachable (or rejected the
deploy). Start the hub first — `carl-agent-hub serve` — then retry. See
[Deploying Agents](/care/workflows/deploy/).
:::

## See also

- [Deploying Agents](/care/workflows/deploy/) — the `/deploy` TUI flow, hub install, config, and autostart
- [Memory & Library](/care/cli/memory/) — find a chain's `entity_id` to deploy
- [Production mode](/care/workflows/production/)
