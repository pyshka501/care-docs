---
title: Changelog
description: Release highlights for mmar-carl.
sidebar:
  order: 2
---

Highlights per release. Full notes live in
[`RELEASE.md`](https://github.com/Glazkoff/carl-experiments/blob/main/RELEASE.md).

## v0.3.0 — 2026-06-02 (current)

- 🤝 **Multi-agent orchestration**: [handoff](/carl/orchestration/handoff/),
  [supervisor](/carl/orchestration/supervisor/), [debate](/carl/orchestration/debate/),
  [parallel sampling](/carl/orchestration/parallel-sampling/),
  [human-in-the-loop](/carl/orchestration/human-in-the-loop/).
- 🧱 **Sandboxed [AgentSkill](/carl/skills/overview/) execution** (docker / e2b /
  firejail) + `LLM_AGENT` mode + URI skill resolver.
- 📊 **Observability**: [`ExecutionTrace`](/carl/tracing/overview/), Gantt /
  heatmap / animated playback, `ChainVisualizer`.
- 🧬 **Chain generation** (`ChainBuilder.from_description`) +
  [evolutionary search](/carl/evolution/overview/) (`ChainEvolver`).
- 🤖 Native `AnthropicClient`, [record/replay cassettes](/carl/llm/record-replay/),
  cost estimation, dataset evaluation.
- 🔌 [MCP](/carl/mcp/overview/) graduated from experimental; pause/resume,
  cancellation, streaming, lossless serialization.

## v0.2.0 — 2026-04-15

- 🔧 Breaking: LLM client refactoring; removed `mmar-llm-mapi`.
- ✨ 74 new tests, an examples runner.
- 🐛 6 critical fixes (conditional steps, serialization, input mapping).
- 📝 Documentation improvements throughout.

## v0.1.0

- 🚨 Typed step description classes (`StepDescription` deprecated).
- 📊 Structured logging with configurable levels.
- 🔍 Error-traceback preservation; ⏱️ chain-level timeout; 🔄 per-step retry.
- 🌐 OpenAI-compatible API support; 🎛️ per-step LLM config.
- ⚡ Execution modes (FAST / SELF_CRITIC); 🔀 chain-level RE-PLAN policy; 📊 evaluation metrics.

## See also

- [Migration: legacy → typed steps](/carl/serialization/migration/)
