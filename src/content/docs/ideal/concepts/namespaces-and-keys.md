---
title: Namespaces and keys
description: How IdeaL scopes ideas by namespace, what each API key may read and write, scopes, admin keys and the anonymous mode.
sidebar:
  order: 2
---

A **namespace** is one lake: a set of ideas, tools, chains and run events
that belong together. Typical choices: one per team, one per project, or a
throwaway one for experiments. Ratings start local to a namespace and then
borrow from other namespaces (see [Rating](/ideal/concepts/rating/)).

## What a key may touch

Every API key has an **owner** and an optional list of additional
**namespaces**.

| Action | Allowed when |
| --- | --- |
| Read a namespace | It is the owner or in the key's list, or the key has `read:any`. |
| Write a namespace | It is the owner or in the key's list, or the key has `write:any`. |
| Write without a namespace | The write goes to the owner namespace. |
| List without a namespace | Only the owner namespace, unless the key has `read:any`. |
| Report outcomes for a run | The key may write every namespace that run already has events in. |

A refused namespace returns **403** "Namespace is not allowed for this key".
Namespace lists (`/v1/search/facets`, MCP `ideal_namespaces`) show only the
namespaces the key may read.

## Scopes

| Scope | Gives |
| --- | --- |
| `read:any` | Read every namespace. |
| `write:any` | Write every namespace. |
| `delete:any`, `clear:all` | Destructive maintenance endpoints. |
| `admin:keys` | Admin API and the Admin tab: issue, view, edit and revoke keys; the auth switch. |
| `evolve` | Reserved for evolution clients. |

## Anonymous mode

`AUTH_REQUIRED=false` (the default) serves requests without a key as an
anonymous caller with no namespace restrictions. A key that is sent is still
checked: an invalid, revoked or expired key gets 401.

An admin can override the environment from the Admin tab ("Требовать
API-ключ"), which writes `PUT /v1/admin/settings {"auth_required": true}`.
The stored value wins over `AUTH_REQUIRED`. `GET /health` reports the current
mode as `"auth": "open"` or `"required"`.

The agent guide (`/v1/ideal/AGENTS.md`) and the seeding skill files stay
readable without a key even in strict mode.

## Issuing keys

From the shell (prints the plaintext once; the database keeps only a hash):

```bash
make create-key OWNER=alice [SCOPES=read:any] [LABEL="..."] [EXPIRES_DAYS=30]
```

This CLI sets owner and scopes only. Additional namespaces are set in the
Admin tab or with `PATCH /v1/admin/keys/{key_id}`.

From the Admin tab or `POST /v1/admin/keys` with `{owner, label, namespaces,
scopes, expires_days}`. Keys issued this way are also stored encrypted with
`API_SECRET_KEY`, so an admin can view the plaintext again later. Keys from
the CLI cannot be viewed again.

The Admin tab lists keys with `last_used_at`, request count and per-namespace
activity (runs, last event). Activity is buffered and written at most once a
minute per key.

:::caution[Bootstrap admin]
Migration `016` inserts a key named `bootstrap admin` (owner `admin`,
scopes `admin:keys`, `read:any`, `write:any`) from a fixed hash in the
repository. It exists so the hosted stand needs no shell access. On your own
deployment, revoke it in the Admin tab unless you were given its plaintext.
:::

## Signed run links

Run pages (`/v1/ideal/run/{namespace}/{run_id}?sig=...`) do not use API keys.
The `sig` is an HMAC of namespace and run id under `API_SECRET_KEY`. Anyone
with the link can view the run and force or add ideas in it while the run is
live. Treat run links as secrets: do not log or post them. A wrong or missing
signature returns 404.

A reader of the namespace can get the links of any run with
`GET /v1/ideal/run/{namespace}/{run_id}/link`. This is how Maestro shows the
radar of runs it did not start.

## In Maestro

Maestro reads and writes exactly one configured namespace (**IdeaL
namespace** in Settings). It can show other namespaces the key may read, but
only for viewing. See [Connect Maestro](/ideal/maestro/connect/).
