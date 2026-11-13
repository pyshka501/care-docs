---
title: Справочник API
description: Публичный API mmar_carl 0.5.2 — экспорты верхнего уровня по группам.
sidebar:
  order: 1
---

Всё ниже импортируется из пакета верхнего уровня
(`from mmar_carl import ...`). Список сверен с `mmar_carl.__all__`
в 0.5.2 (381 имя) плюс имена контрактов хоста в конце страницы. Подробности
по ссылкам.

## Ядро

`ReasoningChain` · `ChainBuilder` · `create_chain_from_config` ·
`ReasoningContext` · `ReasoningResult` · `StepExecutionResult` · `DAGExecutor`
· `ContextSnapshot` · `PromptTemplate` · `Language` · `StepType` ·
`MemoryOperation` · `ChainFormatNewerError` · `ExecutionCancelledError` ·
`LLMTokenLimitError` →
[цепочки](/ru/carl/chains/overview/) · [управление прогоном](/ru/carl/chains/run-controls/)

## Шаги

Типизированные: `LLMStepDescription` · `ToolStepDescription` · `MemoryStepDescription`
· `TransformStepDescription` · `ConditionalStepDescription` ·
`StructuredOutputStepDescription` · `MCPStepDescription` ·
`MCPResourceStepDescription` · `AgentSkillStepDescription` ·
`AgentHandoffStepDescription` · `SupervisorStepDescription` ·
`DebateStepDescription` · `ParallelSamplingStepDescription` ·
`HumanInputStepDescription` · `ToolDiscoveryStepDescription` ·
`EvaluationStepDescription` · `AgentStepDescription` · `CodeStepDescription` ·
`WaitStepDescription` · `MapStepDescription` · `CommandPlanStepDescription` ·
`CommandStepDescription` · `ShellSessionStepDescription` ·
`ClaudeCodeStepDescription` · `CodexStepDescription` ·
`SelectionStepDescription` · `PlannerStepDescription` ·
`DecisionStepDescription` · `TerminateStepDescription`.
Базовые / legacy: `StepDescriptionBase` · `StepDescription` ·
`AnyStepDescription` · `StepConfig` · `create_step` →
[шаги](/ru/carl/steps/overview/)

## Конфигурации шагов

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
`CodexStepConfig` · `SelectionStepConfig` · `PlannerStepConfig` ·
`DecisionStepConfig` · `DecisionQuestion` · `DecisionChoice` · `DecisionLevel` ·
`TerminateStepConfig` · `LoopConfig` · `StepCache` · `StepGroup`

## Типизированные исходы шагов

`HumanInputRequest` · `HumanInputResponse` · `HumanInputOutcome` ·
`HumanInputStatus` · `CodeExecutionOutcome` · `CodeExecutionStatus` ·
`CodeSchemaError` · `CodeSourceError` · `WaitOutcome` · `MapOutcome` ·
`MapItemOutcome` · `MapItemStatus` · `ChainToolOutcome` · `ChainToolStatus`

## Chain tools

`ChainToolDefinition` · `ChainToolRuntime` · `ChainToolOutcome` ·
`ChainToolStatus` → [chain tools](/ru/carl/steps/chain-tools/)

## Полномочия хоста (команды, код, сеть)

`CommandPolicy` · `CommandDecision` · `CommandApprovalRequest` ·
`CommandCapability` · `CommandCapabilityRegistry` · `CommandPlanEnvelope` ·
`CommandPlanRecord` · `ValidatedCommandPlan` · `ResolvedCommandInvocation` ·
`CodeExecutionPolicy` · `CodeRuntimeProfile` · `NetworkPolicy` ·
`NetworkEnforcer` · `PreconfiguredNetworkEnforcer` · `ManagedNetworkProfile` ·
`NetworkEnforcementRequest` · `NetworkEnforcementPlan` ·
`NetworkEnforcementLease` · `NetworkEnforcerError` · `DockerNetworkBinding` ·
`FirejailNetworkBinding` · `resolve_network_policy` ·
`parse_network_allowlist_from_allowed_tools` · `ArtifactInput` ·
`ArtifactOutput` · `ArtifactRecord` → [шаг command](/ru/carl/steps/command/) ·
[шаг code](/ru/carl/steps/code/)

## Внешние агенты

`ClaudeCodeStepExecutor` · `ClaudeCodeCliStatus` · `check_claude_code_cli` ·
`CodexStepExecutor` · `CodexRuntimeStatus` · `check_codex_runtime` →
[шаг Claude Code](/ru/carl/steps/claude-code/) · [шаг Codex](/ru/carl/steps/codex/).
Обоим нужен `ReasoningContext.allow_local_agent_execution=True`.

## Decision-модели

`DecisionStepExecutor` (принимает `httpx`-транспорт для тестов) ·
`DecisionProviderError` → [шаг Decision](/ru/carl/steps/decision/). Разрешение
хоста задаётся в `ReasoningContext.decision_endpoints`.

## Извлечение контекста

`ContextSearchConfig` · `ContextQuery` · `SubstringSearchStrategy` ·
`VectorSearchStrategy` · `SearchStrategy` → [контекст и поиск](/ru/carl/search/overview/)

## Память

`LTMBase` · `InMemoryLTM` · `JsonFileLTM` · `LazyMemoryValue` · `unwrap_lazy` ·
`MemorySchemaError` → [память](/ru/carl/memory/overview/)

## LLM-клиенты

`LLMClientBase` · `ChatMessage` · `OpenAICompatibleClient` ·
`OpenAIClientConfig` · `create_openai_client` · `RetryPolicy` ·
`AnthropicClient` · `AnthropicClientConfig` · `AnthropicClientError` ·
`openai_tools_to_anthropic` · `RecordingLLMClient` · `PlayingLLMClient` ·
`CassetteMissError` → [LLM-клиенты](/ru/carl/llm/clients/)

## Оценка

`MetricBase` · `call_metric_async` · `MetricOutput` · `ExactMatchMetric` ·
`CaseInsensitiveMatchMetric` · `ContainsMetric` · `RegexMatchMetric` ·
`DatasetEvaluator` · `DataCase` · `SimpleDataset` · `DataFrameDataset` ·
`AbstractDataset` · `DatasetEvaluationReport` · `CaseEvaluationResult` ·
`SelectionStrategy` · `ThresholdStrategy` · `TopKWorstStrategy` · `EvalSuite`
· `EvalSuiteReport` · `EvalSuiteDiff` · `EvalCaseResult` · `MetricSummary` ·
`ReflectionOptions` · `SelfCriticDecision` · `SelfCriticEvaluatorBase` →
[оценка](/ru/carl/evaluation/metrics/)

## Эволюция

`ChainEvolver` · `ChainMutator` · `MutationKind` · `EvolutionResult` ·
`IndividualMetrics` · `EvolutionCostEstimate` · `GenerationStats` ·
`format_runs_pareto` → [эволюция](/ru/carl/evolution/overview/)

## Примитивы EvoC (0.5.0)

Каталог и проверка: `get_step_catalog` · `StepCatalog` · `StepTypeSpec` ·
`FieldSpec` · `ReferenceSpec` · `schema_for` · `config_class_names` ·
`reference_fields` · `validate_spec` · `validate_and_build` · `ValidationReport`
· `ValidationIssue` · `check_drift` · `DriftReport` ·
`auto_generate_minimal_step`. Мутации: `mutable_fields` · `mutable_targets` ·
`get_field_by_path` · `set_field_by_path` · `iter_mutable_values` ·
`expand_field_path` · `sample_field_value` · `mutate_content` ·
`insert_step_at` · `remove_step` · `rewire_dependencies` · `change_step_type`
· `apply_records` · `MutationRecord` · `MutationError` · `find_root_steps` ·
`find_leaf_steps` · `dependents_of` · `steps_of_type` · `deletable_steps` ·
`can_delete_step` · `frozen_step_numbers`. Возможности: `CapabilityLibrary` ·
`CapabilityEntry`. Инструменты как код: `CodeTool` · `CodeToolLibrary` ·
`CodeToolError` · `validate_code_tool` · `compile_code_tool` ·
`mutate_tool_code` · `TOOL_LIBRARY_KEY`. Запуски и датасеты: `RunDescriptor` ·
`ComplexityDescriptor` · `extract_run_descriptor` · `extract_complexity` ·
`pareto_front` · `pareto_rank` · `dominates` · `subsample` · `split` ·
`select_cases` · `CaseSplit` · `CaseDiff` →
[примитивы EvoC](/ru/carl/evolution/overview/#примитивы-evoc)

## Трассировка, стоимость и визуализация

`ExecutionTrace` · `TraceEvent` · `TraceAggregator` · `ChainVisualizer` ·
`CostEstimate` · `StepCostEstimate` · `StreamingBuffer` · логирование:
`set_log_level` / `get_logger` / `log_info` / `log_debug` / `log_warning` /
`log_error` / `log_chain_start` / `log_chain_complete` / `log_step_start` /
`log_step_complete` / `log_batch_start` · `langfuse_flush` ·
`is_langfuse_enabled` → [трассировка](/ru/carl/tracing/overview/)

## RE-PLAN

`ReplanPolicy` · `RuleBasedReplanCheckerConfig` · `LLMReplanCheckerConfig` ·
`RegisteredReplanCheckerConfig` · `ReplanCheckerSpec` · `ReplanCheckerBase` ·
`RuleBasedReplanChecker` · `LLMReplanChecker` · `ReplanCheckerInput` ·
`ReplanCheckerVote` · `ReplanAction` · `ReplanAggregationStrategy` ·
`ReplanAggregationConfig` · `ReplanAggregationOutcome` · `ReplanTriggerConfig`
· `ReplanBudgetConfig` · `ReplanRollbackTarget` · `ReplanTargetType` ·
`ReplanVerdict` · `ReplanEvent` → [RE-PLAN](/ru/carl/replan/overview/)

## Результаты оркестрации

`DebateTranscript` · `DebateTurn` · `ParallelSamples` · `SupervisorDecision` →
[оркестрация](/ru/carl/orchestration/overview/)

## Интеграция с Maestro

`PreflightReport` · `RunRecord` · `CareChainMetadata` · `CareContextFile` ·
`CARE_METADATA_NAMESPACE` → [интеграция с Maestro](/ru/carl/care-integration/overview/)

## Навыки и среды навыков

`resolve_skill` · `GithubResolver` · `LocalResolver` · `HttpsTarballResolver` ·
`ModuleResolver` · `SkillResolverRegistry` · `get_default_registry` ·
`ResolvedSkill` · `SkillIntegrityError` · `SkillResolveError` ·
`SkillNotFoundError` · `SkillParseError` · `SkillLoader` · `SkillManifest` ·
`SkillFrontmatterData` · `SkillOutput` · `SkillOutputSchemaError` ·
`parse_and_validate_skill_output` · `list_cached_skills` · среды:
`SkillRuntime` · `SkillRuntimeHandle` · `RuntimeRunResult` ·
`SkillRuntimeError` · `RuntimeCapabilities` · `EnforcementReport` ·
`assess_runtime_enforcement` · `get_runtime_capabilities` ·
`register_skill_runtime` · `get_skill_runtime` · `list_skill_runtimes` ·
`LocalSkillRuntime` / `DockerSkillRuntime` / `E2BSkillRuntime` /
`FirejailSkillRuntime` → [AgentSkills](/ru/carl/skills/overview/)

## Инструменты и расширяемость

`carl_tool` · `ToolDefinition` · `ToolSource` · `ModuleToolSource` ·
`CallableToolSource` · `DictToolSource` · `AsyncToolWrapper` · `get_executor`
· `register_executor` · `StepExecutorBase` · по одному классу `*StepExecutor` на
каждый тип шага (например `LLMStepExecutor`, `ToolStepExecutor`,
`MapStepExecutor`, `WaitStepExecutor`) → [шаги-инструменты](/ru/carl/steps/tool/).
`GitToolSource` с верхнего уровня не экспортируется, импортируйте его из
`mmar_carl.models.config`. `execute_eager_tools` лежит в `mmar_carl.eager_tools`.

## Тестирование и инфраструктура MCP

`ChainTestHarness` · `MCPSessionPool` → [MCP](/ru/carl/mcp/overview/)

## Имена контрактов хоста

Эти имена отмечают контракты входа хоста, на которые опирается Maestro. Они есть
и в 0.5.2, и в закреплённой сборке CARL в Maestro. Это атрибуты модуля, их нет
в `__all__`:

| Имя | Значение | Смысл |
| --- | --- | --- |
| `HOST_RUNTIME_INPUT_ABI` | `1` | Поддерживаются `ReasoningContext.runtime_input` и `$outer_context.<field>`. |
| `STRUCTURED_OUTPUT_SCOPED_INPUTS_ABI` | `1` | Поддерживается `StructuredOutputStepConfig.input_mapping`. |
| `HUMAN_INPUT_SCOPED_PROMPT_ABI` | `1` | Поддерживается `HumanInputStepConfig.prompt_input_mapping`. |

Хост проверяет их так: `getattr(mmar_carl, "HOST_RUNTIME_INPUT_ABI", 0) >= 1`,
и только потом полагается на контракт.

:::note
Внутренние модули содержат больше имён. Используйте импорты верхнего уровня
из этого списка.
:::
