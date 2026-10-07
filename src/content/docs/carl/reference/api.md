---
title: API Reference
description: The public surface of mmar_carl 0.5.0 — top-level exports, grouped.
sidebar:
  order: 1
---

Everything below is importable from the top-level package
(`from mmar_carl import ...`). The list was checked against `mmar_carl.__all__`
(about 310 names) plus the host-contract names listed at the end. Follow the
links for guides.

## Core

`ReasoningChain` · `ChainBuilder` · `create_chain_from_config` ·
`ReasoningContext` · `ReasoningResult` · `StepExecutionResult` · `DAGExecutor`
· `ContextSnapshot` · `PromptTemplate` · `Language` · `StepType` ·
`MemoryOperation` · `ChainFormatNewerError` · `ExecutionCancelledError` →
[chains](/carl/chains/overview/) · [run controls](/carl/chains/run-controls/)

## Steps

Typed: `LLMStepDescription` · `ToolStepDescription` · `MemoryStepDescription`
· `TransformStepDescription` · `ConditionalStepDescription` ·
`StructuredOutputStepDescription` · `MCPStepDescription` ·
`MCPResourceStepDescription` · `AgentSkillStepDescription` ·
`AgentHandoffStepDescription` · `SupervisorStepDescription` ·
`DebateStepDescription` · `ParallelSamplingStepDescription` ·
`HumanInputStepDescription` · `ToolDiscoveryStepDescription` ·
`EvaluationStepDescription` · `AgentStepDescription` · `CodeStepDescription` ·
`WaitStepDescription` · `MapStepDescription` · `CommandPlanStepDescription` ·
`CommandStepDescription` · `ShellSessionStepDescription` ·
`ClaudeCodeStepDescription` · `CodexStepDescription`.
Base / legacy: `StepDescriptionBase` · `StepDescription` ·
`AnyStepDescription` · `StepConfig` · `create_step` →
[steps](/carl/steps/overview/)

## Step configs

`LLMStepConfig` · `ExecutionMode` · `ToolStepConfig` · `ToolErrorRecovery` ·
`ToolParameter` · `MemoryStepConfig` · `TransformStepConfig` ·
`ConditionalStepConfig` · `ConditionalBranch` · `StructuredOutputStepConfig` ·
`MCPStepConfig` · `MCPServerConfig` · `MCPResourceStepConfig` ·
`AgentHandoffStepConfig` · `SupervisorStepConfig` · `DebateStepConfig` ·
`ParallelSamplingStepConfig` · `ParallelSamplingAggregation` ·
`VoteNormalization` · `HumanInputStepConfig` · `ToolDiscoveryStepConfig` ·
`AgentSkillStepConfig` · `AgentSkillExecutionMode` · `AgentSkillSource` ·
`EvaluationStepConfig` · `EvalFailAction` · `AgentStepConfig` ·
`CodeStepConfig` · `WaitStepConfig` · `WaitCondition` · `WaitLeafCondition` ·
`AfterWaitCondition` · `AtWaitCondition` · `EventWaitCondition` ·
`AnyOfWaitCondition` · `MapStepConfig` · `CommandPlanStepConfig` ·
`CommandStepConfig` · `ShellSessionStepConfig` · `ClaudeCodeStepConfig` ·
`CodexStepConfig` · `LoopConfig` · `StepCache` · `StepGroup`

## Typed step outcomes

`HumanInputRequest` · `HumanInputResponse` · `HumanInputOutcome` ·
`HumanInputStatus` · `CodeExecutionOutcome` · `CodeExecutionStatus` ·
`CodeSchemaError` · `CodeSourceError` · `WaitOutcome` · `MapOutcome` ·
`MapItemOutcome` · `MapItemStatus` · `ChainToolOutcome` · `ChainToolStatus`

## Chain tools

`ChainToolDefinition` · `ChainToolRuntime` · `ChainToolOutcome` ·
`ChainToolStatus` → [chain tools](/carl/steps/chain-tools/)

## Host authority (commands, code, network)

`CommandPolicy` · `CommandDecision` · `CommandApprovalRequest` ·
`CommandCapability` · `CommandCapabilityRegistry` · `CommandPlanEnvelope` ·
`CommandPlanRecord` · `ValidatedCommandPlan` · `ResolvedCommandInvocation` ·
`CodeExecutionPolicy` · `CodeRuntimeProfile` · `NetworkPolicy` ·
`NetworkEnforcer` · `PreconfiguredNetworkEnforcer` · `ManagedNetworkProfile` ·
`NetworkEnforcementRequest` · `NetworkEnforcementPlan` ·
`NetworkEnforcementLease` · `NetworkEnforcerError` · `DockerNetworkBinding` ·
`FirejailNetworkBinding` · `resolve_network_policy` ·
`parse_network_allowlist_from_allowed_tools` · `ArtifactInput` ·
`ArtifactOutput` · `ArtifactRecord` → [command step](/carl/steps/command/) ·
[code step](/carl/steps/code/)

## External agents

`ClaudeCodeStepExecutor` · `ClaudeCodeCliStatus` · `check_claude_code_cli` ·
`CodexStepExecutor` · `CodexRuntimeStatus` · `check_codex_runtime` →
[Claude Code step](/carl/steps/claude-code/) · [Codex step](/carl/steps/codex/)

## Context extraction

`ContextSearchConfig` · `ContextQuery` · `SubstringSearchStrategy` ·
`VectorSearchStrategy` · `SearchStrategy` → [context & search](/carl/search/overview/)

## Memory

`LTMBase` · `InMemoryLTM` · `JsonFileLTM` · `LazyMemoryValue` · `unwrap_lazy` ·
`MemorySchemaError` → [memory](/carl/memory/overview/)

## LLM clients

`LLMClientBase` · `ChatMessage` · `OpenAICompatibleClient` ·
`OpenAIClientConfig` · `create_openai_client` · `RetryPolicy` ·
`AnthropicClient` · `AnthropicClientConfig` · `AnthropicClientError` ·
`openai_tools_to_anthropic` · `RecordingLLMClient` · `PlayingLLMClient` ·
`CassetteMissError` → [LLM clients](/carl/llm/clients/)

## Evaluation

`MetricBase` · `call_metric_async` · `MetricOutput` · `ExactMatchMetric` ·
`CaseInsensitiveMatchMetric` · `ContainsMetric` · `RegexMatchMetric` ·
`DatasetEvaluator` · `DataCase` · `SimpleDataset` · `DataFrameDataset` ·
`AbstractDataset` · `DatasetEvaluationReport` · `CaseEvaluationResult` ·
`SelectionStrategy` · `ThresholdStrategy` · `TopKWorstStrategy` · `EvalSuite`
· `EvalSuiteReport` · `EvalSuiteDiff` · `EvalCaseResult` · `MetricSummary` ·
`ReflectionOptions` · `SelfCriticDecision` · `SelfCriticEvaluatorBase` →
[evaluation](/carl/evaluation/metrics/)

## Evolution

`ChainEvolver` · `ChainMutator` · `MutationKind` · `ChainCrossover` ·
`CROSSOVER_KIND` · `EvolutionResult` · `IndividualMetrics` ·
`EvolutionCostEstimate` · `GenerationStats` · `format_runs_pareto` →
[evolution](/carl/evolution/overview/)

## Tracing, cost & visualization

`ExecutionTrace` · `TraceEvent` · `TraceAggregator` · `ChainVisualizer` ·
`CostEstimate` · `StepCostEstimate` · `StreamingBuffer` · logging:
`set_log_level` / `get_logger` / `log_info` / `log_debug` / `log_warning` /
`log_error` / `log_chain_start` / `log_chain_complete` / `log_step_start` /
`log_step_complete` / `log_batch_start` · `langfuse_flush` ·
`is_langfuse_enabled` → [tracing](/carl/tracing/overview/)

## RE-PLAN

`ReplanPolicy` · `RuleBasedReplanCheckerConfig` · `LLMReplanCheckerConfig` ·
`RegisteredReplanCheckerConfig` · `ReplanCheckerSpec` · `ReplanCheckerBase` ·
`RuleBasedReplanChecker` · `LLMReplanChecker` · `ReplanCheckerInput` ·
`ReplanCheckerVote` · `ReplanAction` · `ReplanAggregationStrategy` ·
`ReplanAggregationConfig` · `ReplanAggregationOutcome` · `ReplanTriggerConfig`
· `ReplanBudgetConfig` · `ReplanRollbackTarget` · `ReplanTargetType` ·
`ReplanVerdict` · `ReplanEvent` → [RE-PLAN](/carl/replan/overview/)

## Orchestration outputs

`DebateTranscript` · `DebateTurn` · `ParallelSamples` · `SupervisorDecision` →
[orchestration](/carl/orchestration/overview/)

## Maestro integration

`PreflightReport` · `RunRecord` · `CareChainMetadata` · `CareContextFile` ·
`CARE_METADATA_NAMESPACE` → [Maestro integration](/carl/care-integration/overview/)

## Skills & skill runtimes

`resolve_skill` · `GithubResolver` · `LocalResolver` · `HttpsTarballResolver` ·
`ModuleResolver` · `SkillResolverRegistry` · `get_default_registry` ·
`ResolvedSkill` · `SkillIntegrityError` · `SkillResolveError` ·
`SkillNotFoundError` · `SkillParseError` · `SkillLoader` · `SkillManifest` ·
`SkillFrontmatterData` · `SkillOutput` · `SkillOutputSchemaError` ·
`parse_and_validate_skill_output` · `list_cached_skills` · runtimes:
`SkillRuntime` · `SkillRuntimeHandle` · `RuntimeRunResult` ·
`SkillRuntimeError` · `RuntimeCapabilities` · `EnforcementReport` ·
`assess_runtime_enforcement` · `get_runtime_capabilities` ·
`register_skill_runtime` · `get_skill_runtime` · `list_skill_runtimes` ·
`LocalSkillRuntime` / `DockerSkillRuntime` / `E2BSkillRuntime` /
`FirejailSkillRuntime` → [AgentSkills](/carl/skills/overview/)

## Tools & extensibility

`carl_tool` · `ToolDefinition` · `ToolSource` · `ModuleToolSource` ·
`CallableToolSource` · `DictToolSource` · `AsyncToolWrapper` · `get_executor`
· `register_executor` · `StepExecutorBase` · one `*StepExecutor` class per
step type (for example `LLMStepExecutor`, `ToolStepExecutor`,
`MapStepExecutor`, `WaitStepExecutor`) → [tool steps](/carl/steps/tool/)

## Testing & MCP infrastructure

`ChainTestHarness` · `MCPSessionPool` → [MCP](/carl/mcp/overview/)

## Host contract names

These names come with the Maestro host contracts that are part of 0.5.0
(see [changelog](/carl/reference/changelog/#host-contracts-used-by-maestro)).
They are module attributes, not entries of `__all__`:

| Name | Value | Meaning |
| --- | --- | --- |
| `HOST_RUNTIME_INPUT_ABI` | `1` | `ReasoningContext.runtime_input` and `$outer_context.<field>` are supported. |
| `STRUCTURED_OUTPUT_SCOPED_INPUTS_ABI` | `1` | `StructuredOutputStepConfig.input_mapping` is supported. |
| `HUMAN_INPUT_SCOPED_PROMPT_ABI` | `1` | `HumanInputStepConfig.prompt_input_mapping` is supported. |

A host checks them with `getattr(mmar_carl, "HOST_RUNTIME_INPUT_ABI", 0) >= 1`
before relying on the contract.

:::note
Internal modules expose more than this list. Prefer the top-level imports
shown here.
:::
