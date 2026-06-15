---
title: Справочник API
description: Публичный API mmar_carl — все top-level экспорты, по группам.
sidebar:
  order: 1
---

Всё ниже импортируется из top-level пакета `mmar_carl`
(`from mmar_carl import ...`). Эта страница группирует публичный API;
переходите по ссылкам за полными руководствами.

## Ядро

`ReasoningChain` · `ChainBuilder` · `ReasoningContext` · `ReasoningResult` ·
`StepExecutionResult` · `DAGExecutor` · `ContextSnapshot` · `PromptTemplate` ·
`Language` · `StepType` · `MemoryOperation` · `ChainFormatNewerError` ·
`ExecutionCancelledError` → [цепочки](/ru/carl/chains/overview/) · [концепции](/ru/carl/concepts/what-is-carl/)

## Шаги

Типизированные: `LLMStepDescription` · `ToolStepDescription` ·
`MemoryStepDescription` · `TransformStepDescription` · `ConditionalStepDescription` ·
`StructuredOutputStepDescription` · `MCPStepDescription` ·
`MCPResourceStepDescription` · `AgentSkillStepDescription` ·
`AgentHandoffStepDescription` · `SupervisorStepDescription` ·
`DebateStepDescription` · `ParallelSamplingStepDescription` ·
`HumanInputStepDescription` · `ToolDiscoveryStepDescription` ·
`EvaluationStepDescription`. База/legacy: `StepDescriptionBase` ·
`StepDescription` · `AnyStepDescription` · `create_step` → [шаги](/ru/carl/steps/overview/)

## Конфиги шагов

`ToolStepConfig` · `ToolErrorRecovery` · `ToolParameter` · `MemoryStepConfig` ·
`TransformStepConfig` · `ConditionalStepConfig` · `ConditionalBranch` ·
`StructuredOutputStepConfig` · `LLMStepConfig` · `ExecutionMode` · `LoopConfig` ·
`StepCache` · `StepGroup` · `MCPStepConfig` · `MCPServerConfig` ·
`MCPResourceStepConfig` · `AgentHandoffStepConfig` · `SupervisorStepConfig` ·
`DebateStepConfig` · `ParallelSamplingStepConfig` · `ParallelSamplingAggregation` ·
`HumanInputStepConfig` · `ToolDiscoveryStepConfig` · `AgentSkillStepConfig` ·
`AgentSkillExecutionMode` · `AgentSkillSource` · `EvaluationStepConfig` ·
`EvalFailAction`

## Извлечение контекста

`ContextSearchConfig` · `ContextQuery` · `SubstringSearchStrategy` ·
`VectorSearchStrategy` · `SearchStrategy` → [контекст и поиск](/ru/carl/search/overview/)

## Память

`LTMBase` · `InMemoryLTM` · `JsonFileLTM` · `LazyMemoryValue` · `unwrap_lazy` ·
`MemorySchemaError` → [память](/ru/carl/memory/overview/)

## LLM-клиенты

`OpenAICompatibleClient` · `OpenAIClientConfig` · `create_openai_client` ·
`AnthropicClient` · `AnthropicClientConfig` · `RetryPolicy` · `LLMClientBase` ·
`ChatMessage` · `RecordingLLMClient` · `PlayingLLMClient` · `CassetteMissError` →
[LLM-клиенты](/ru/carl/llm/clients/)

## Оценка

`MetricBase` · `call_metric_async` · `MetricOutput` · `ExactMatchMetric` ·
`CaseInsensitiveMatchMetric` · `ContainsMetric` · `RegexMatchMetric` ·
`DatasetEvaluator` · `DataCase` · `SimpleDataset` · `DataFrameDataset` ·
`AbstractDataset` · `DatasetEvaluationReport` · `ThresholdStrategy` ·
`TopKWorstStrategy` · `EvalSuite` · `EvalSuiteReport` · `EvalSuiteDiff` ·
`ReflectionOptions` → [оценка](/ru/carl/evaluation/metrics/)

## Эволюция

`ChainEvolver` · `ChainMutator` · `MutationKind` · `EvolutionResult` ·
`IndividualMetrics` · `EvolutionCostEstimate` · `GenerationStats` ·
`format_runs_pareto` → [эволюция](/ru/carl/evolution/overview/)

## Трейсинг, стоимость и визуализация

`ExecutionTrace` · `TraceEvent` · `TraceAggregator` · `ChainVisualizer` ·
`CostEstimate` · `StepCostEstimate` · `StreamingBuffer` · логирование:
`set_log_level` / `get_logger` / `log_*` · `langfuse_flush` ·
`is_langfuse_enabled` → [трейсинг](/ru/carl/tracing/overview/)

## RE-PLAN

`ReplanPolicy` · `RuleBasedReplanCheckerConfig` · `LLMReplanCheckerConfig` ·
`RegisteredReplanCheckerConfig` · `RuleBasedReplanChecker` · `LLMReplanChecker` ·
`ReplanAction` · `ReplanAggregationStrategy` · `ReplanAggregationConfig` ·
`ReplanTriggerConfig` · `ReplanBudgetConfig` · `ReplanRollbackTarget` ·
`ReplanVerdict` → [RE-PLAN](/ru/carl/replan/overview/)

## Выводы оркестрации

`DebateTranscript` · `DebateTurn` · `ParallelSamples` · `SupervisorDecision` ·
`ReplanEvent` → [оркестрация](/ru/carl/orchestration/overview/)

## Навыки

`resolve_skill` · `GithubResolver` · `LocalResolver` · `HttpsTarballResolver` ·
`ModuleResolver` · `SkillResolverRegistry` · `ResolvedSkill` ·
`SkillIntegrityError` · `SkillLoader` · `SkillManifest` · рантаймы навыков
(`LocalSkillRuntime` / `DockerSkillRuntime` / `E2BSkillRuntime` /
`FirejailSkillRuntime`) · `list_cached_skills` → [AgentSkills](/ru/carl/skills/overview/)

## Инструменты и расширяемость

`carl_tool` · `ToolDefinition` · `ModuleToolSource` · `CallableToolSource` ·
`DictToolSource` · `get_executor` · `register_executor` · `StepExecutorBase` ·
классы `*StepExecutor` по типам → [tool-шаги](/ru/carl/steps/tool/)

## Тестирование и инфраструктура MCP

`ChainTestHarness` · `MCPSessionPool` → [MCP](/ru/carl/mcp/overview/)

:::note
Этот индекс покрывает 200+ публичных имён, экспортируемых из `mmar_carl`. Внутренние
модули содержат больше; предпочитайте top-level импорты, показанные здесь.
:::
