---
title: API Reference
description: The public surface of mmar_carl — all top-level exports, grouped.
sidebar:
  order: 1
---

Everything below is importable from the top-level `mmar_carl` package
(`from mmar_carl import ...`). This page groups the public surface; follow the
links for full guides.

## Core

`ReasoningChain` · `ChainBuilder` · `ReasoningContext` · `ReasoningResult` ·
`StepExecutionResult` · `DAGExecutor` · `ContextSnapshot` · `PromptTemplate` ·
`Language` · `StepType` · `MemoryOperation` · `ChainFormatNewerError` ·
`ExecutionCancelledError` → [chains](/carl/chains/overview/) · [concepts](/carl/concepts/what-is-carl/)

## Steps

Typed: `LLMStepDescription` · `ToolStepDescription` · `MemoryStepDescription` ·
`TransformStepDescription` · `ConditionalStepDescription` ·
`StructuredOutputStepDescription` · `MCPStepDescription` ·
`MCPResourceStepDescription` · `AgentSkillStepDescription` ·
`AgentHandoffStepDescription` · `SupervisorStepDescription` ·
`DebateStepDescription` · `ParallelSamplingStepDescription` ·
`HumanInputStepDescription` · `ToolDiscoveryStepDescription` ·
`EvaluationStepDescription`. Base/legacy: `StepDescriptionBase` ·
`StepDescription` · `AnyStepDescription` · `create_step` → [steps](/carl/steps/overview/)

## Step configs

`ToolStepConfig` · `ToolErrorRecovery` · `ToolParameter` · `MemoryStepConfig` ·
`TransformStepConfig` · `ConditionalStepConfig` · `ConditionalBranch` ·
`StructuredOutputStepConfig` · `LLMStepConfig` · `ExecutionMode` · `LoopConfig` ·
`StepCache` · `StepGroup` · `MCPStepConfig` · `MCPServerConfig` ·
`MCPResourceStepConfig` · `AgentHandoffStepConfig` · `SupervisorStepConfig` ·
`DebateStepConfig` · `ParallelSamplingStepConfig` · `ParallelSamplingAggregation` ·
`HumanInputStepConfig` · `ToolDiscoveryStepConfig` · `AgentSkillStepConfig` ·
`AgentSkillExecutionMode` · `AgentSkillSource` · `EvaluationStepConfig` ·
`EvalFailAction`

## Context extraction

`ContextSearchConfig` · `ContextQuery` · `SubstringSearchStrategy` ·
`VectorSearchStrategy` · `SearchStrategy` → [context & search](/carl/search/overview/)

## Memory

`LTMBase` · `InMemoryLTM` · `JsonFileLTM` · `LazyMemoryValue` · `unwrap_lazy` ·
`MemorySchemaError` → [memory](/carl/memory/overview/)

## LLM clients

`OpenAICompatibleClient` · `OpenAIClientConfig` · `create_openai_client` ·
`AnthropicClient` · `AnthropicClientConfig` · `RetryPolicy` · `LLMClientBase` ·
`ChatMessage` · `RecordingLLMClient` · `PlayingLLMClient` · `CassetteMissError` →
[LLM clients](/carl/llm/clients/)

## Evaluation

`MetricBase` · `call_metric_async` · `MetricOutput` · `ExactMatchMetric` ·
`CaseInsensitiveMatchMetric` · `ContainsMetric` · `RegexMatchMetric` ·
`DatasetEvaluator` · `DataCase` · `SimpleDataset` · `DataFrameDataset` ·
`AbstractDataset` · `DatasetEvaluationReport` · `ThresholdStrategy` ·
`TopKWorstStrategy` · `EvalSuite` · `EvalSuiteReport` · `EvalSuiteDiff` ·
`ReflectionOptions` → [evaluation](/carl/evaluation/metrics/)

## Evolution

`ChainEvolver` · `ChainMutator` · `MutationKind` · `EvolutionResult` ·
`IndividualMetrics` · `EvolutionCostEstimate` · `GenerationStats` ·
`format_runs_pareto` → [evolution](/carl/evolution/overview/)

## Tracing, cost & visualization

`ExecutionTrace` · `TraceEvent` · `TraceAggregator` · `ChainVisualizer` ·
`CostEstimate` · `StepCostEstimate` · `StreamingBuffer` · logging:
`set_log_level` / `get_logger` / `log_*` · `langfuse_flush` ·
`is_langfuse_enabled` → [tracing](/carl/tracing/overview/)

## RE-PLAN

`ReplanPolicy` · `RuleBasedReplanCheckerConfig` · `LLMReplanCheckerConfig` ·
`RegisteredReplanCheckerConfig` · `RuleBasedReplanChecker` · `LLMReplanChecker` ·
`ReplanAction` · `ReplanAggregationStrategy` · `ReplanAggregationConfig` ·
`ReplanTriggerConfig` · `ReplanBudgetConfig` · `ReplanRollbackTarget` ·
`ReplanVerdict` → [RE-PLAN](/carl/replan/overview/)

## Orchestration outputs

`DebateTranscript` · `DebateTurn` · `ParallelSamples` · `SupervisorDecision` ·
`ReplanEvent` → [orchestration](/carl/orchestration/overview/)

## Skills

`resolve_skill` · `GithubResolver` · `LocalResolver` · `HttpsTarballResolver` ·
`ModuleResolver` · `SkillResolverRegistry` · `ResolvedSkill` ·
`SkillIntegrityError` · `SkillLoader` · `SkillManifest` · skill runtimes
(`LocalSkillRuntime` / `DockerSkillRuntime` / `E2BSkillRuntime` /
`FirejailSkillRuntime`) · `list_cached_skills` → [AgentSkills](/carl/skills/overview/)

## Tools & extensibility

`carl_tool` · `ToolDefinition` · `ModuleToolSource` · `CallableToolSource` ·
`DictToolSource` · `get_executor` · `register_executor` · `StepExecutorBase` ·
the per-type `*StepExecutor` classes → [tool steps](/carl/steps/tool/)

## Testing & MCP infra

`ChainTestHarness` · `MCPSessionPool` → [MCP](/carl/mcp/overview/)

:::note
This index covers the 200+ public names exported from `mmar_carl`. Internal modules
expose more; prefer the top-level imports shown here.
:::
