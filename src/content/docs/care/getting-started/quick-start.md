---
title: Quick Start
description: Boot MAESTRO and generate your first chain in the CARL format in five minutes.
sidebar:
  order: 2
---

Get from a fresh checkout to a running agent in about five minutes.

## Prerequisites

- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/) (project + environment manager)
- An OpenAI-compatible API key (e.g. OpenRouter)

## 1. Install

```bash
uv sync
```

## 2. Configure

`care init` walks the minimum MAGE credentials (base URL, API key, model) and
writes a `./.env` so a fresh checkout can boot:

```bash
uv run care init
```

For CI / scripted setup, do it non-interactively:

```bash
uv run care init --non-interactive \
  --api-key sk-... \
  --base-url https://openrouter.ai/api/v1 \
  --model qwen/qwen3-coder
```

## 3. Launch the TUI

```bash
uv run care
```

MAESTRO CARE opens directly into the **chat surface** — a Claude-Code-style
transcript with a prompt at the bottom and a mode toggle above it.

## 4. Generate your first agent

Type a task in natural language and press <kbd>Enter</kbd>:

```text
Summarise the key risks in this quarterly report and rank them by severity.
```

MAGE generates a chain, MAESTRO runs it on the spot, and the answer prints
inline. First-time users see a one-line offer to type `/tour` for a 5-step walkthrough.

## Next steps

- Run [`/tour`](/care/getting-started/quick-start/) inside the TUI for a guided walkthrough.
- Learn the two [chat modes](/care/getting-started/overview/) — **Ad-Hoc** vs **Production**.
- Browse the full [CLI reference](/care/cli/overview/).
