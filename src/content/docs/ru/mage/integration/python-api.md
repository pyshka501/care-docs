---
title: Python API
description: MAGEGenerator и его методы generate, compile и edit, обратные вызовы прогресса, отмена, MAGEResult, исключения и функции допуска, которые хост импортирует напрямую.
sidebar:
  order: 1
---

Сигнатуры даны по ветке разработки (0.2.0). Пометка **0.2** значит, что в
выпущенном 0.1.3 этого нет.

## Точки входа

```python
from mmar_mage import MAGEConfig, MAGEGenerator

generator = MAGEGenerator(
    config,                              # MAGEConfig | None (по умолчанию deep, gpt-4o)
    progress,                            # MAGEProgressCallback | None
    capability_discovery_sources=None,   # 0.2: одобренные источники возможностей
    capability_runtime_probe=None,       # 0.2: проба без побочных эффектов
)

result = await generator.generate(
    query,                    # str или GenerationRequest (0.2)
    context_files=None,       # только для строковой формы
    user_context="",          # только для строковой формы
    safe_task=None,           # только для строковой формы
    cancel=None,              # asyncio.Event
    capabilities=None,        # CapabilityContext: закрытый каталог инструментов
    runtime_features=None,    # 0.2: RuntimeEnvironmentFeatures, нужен семантической стратегии
    return_candidates=False,  # deep: по MAGEResult на каждую выбранную топологию
)

outcome = await generator.compile(query, ...)   # 0.2: ReadyChain | NeedsUserInput | Unsupported
edited = await generator.edit(instruction, chain=None, entity_id=None, save=False)
```

MAGE сам создаёт OpenAI-совместимый клиент из `MAGEConfig` (`base_url`,
`api_key`, `model`, `provider`). Объект клиента он не принимает; хост,
который хочет пустить вызовы через свою модель, направляет `base_url` на
прокси.

Короткие функции:

```python
from mmar_mage import edit_chain, generate_chain

result = await generate_chain("Classify reviews by sentiment", config)
edited = await edit_chain("Rename to 'Invoice QA'", chain=chain_dict, config=config)
```

`edit` и `edit_chain` принимают `entity_id` (загрузить из памяти) или
`chain` (словарь). Без них MAGE ищет в памяти цепочку, названную в
инструкции, и при равенстве кандидатов возвращает `needs_disambiguation` со
списком. Правка планируется как минимальный набор операций, применяется к
копии, проходит допуск и сохраняется новой версией только при `save=True`.

Обёртки отдельных стадий для отладки: `analyze_domain`, `plan_steps`,
`build_dag`, `describe_steps`, `critique_steps`, `verify_chain`, `refine`. Они
ничего не сохраняют и не заворачивают результат в `MAGEResult`.

## Прогресс и отмена

```python
class Progress:
    def on_stage_start(self, stage: str) -> None: ...
    def on_stage_complete(self, stage: str, result) -> None: ...
    def on_error(self, stage: str, error: Exception) -> None: ...
    # необязательные, проверяются через getattr:
    def on_llm_chunk(self, stage: str, delta: str) -> None: ...      # enable_streaming, только step_describing
    def on_retry(self, stage: str, attempt: int, error: Exception) -> None: ...
    def on_cost_estimate(self, estimate) -> None: ...                # enable_preflight_cost_estimate
    def on_chain_preview(self, preview: dict) -> None: ...           # после DAG, до описаний шагов
```

Имена стадий: `fast_generation` в fast; в deep `domain_analysis`,
`step_planning`, `dag_building`, `step_describing` и необязательные стадии из
[Конвейера генерации](/ru/mage/concepts/pipeline/); `chain_edit` для правок;
стадии `semantic_*` для семантической стратегии.

Чтобы остановить, выставьте событие `cancel`. Его проверяют между стадиями и
перед вызовами модели; текущий вызов доходит до конца, его результат
отбрасывается. MAGE бросает `MAGECancelledError` с `.stage`.

## Результат

`MAGEResult`:

| Поле | Содержимое |
| --- | --- |
| `chain_json`, `chain_dict` | Допущенная цепочка CARL. |
| `code` | Python-код `ChainBuilder` для цепочки, если сгенерирован. |
| `memory_key`, `memory_keys` | Id сохранённого, если что-то сохранялось. |
| `mode` | `fast` или `deep`. |
| `metadata` | `MAGEMetadata`: область, число шагов, время, модель, пройденные стадии, использованные находки в памяти и вебе, предложенные имя, описание и теги, токены по стадиям, попытки провайдера. |
| `intermediate_artifacts` | Дампы отработавших стадий: `domain_analysis`, `step_plan`, `dag`, `described_steps` и другие. |
| `quality_report` | Отчёт обратной связи исполнения или режима бенчмарка, если включены. |

`to_care_dict()` и `from_care_dict()` сериализуют пакет для повтора;
`replay_from(stage)` перегенерирует цепочку начиная со стадии deep.

## Исключения

Все наследуют `MAGEError`.

| Исключение | Когда |
| --- | --- |
| `MAGEValidationError` | Цепочка не прошла структуру, линт или допуск рантаймом. В `.raw_output` ответ модели. |
| `MAGELLMError` | Вызов провайдера упал после повторов. |
| `MAGEProviderContractError` | 0.2. Ответ провайдера нарушил ожидаемый формат. |
| `MAGEBudgetError` | 0.2. Бюджет `max_*` соблюсти нельзя. Окончательная ошибка. |
| `MAGECancelledError` | Выставлен `cancel`. |
| `MAGERequirementsError` | 0.2. Семантический `generate()` получил неготовый исход (`.outcome`). |
| `MAGEMemoryError` | Низкоуровневый сбой памяти; `generate()` его не бросает. |

## Функции допуска для хоста

**0.2.** Maestro импортирует их напрямую, так что они входят в контракт
хоста.

| Символ | Модуль | Назначение |
| --- | --- | --- |
| `lint_chain(chain, *, known_tools, resolved_capabilities, runtime_input_schema, output_contract)` | `mmar_mage.chain_repair` | Детерминированные замечания списком строк. |
| `validate_runtime_chain(chain, *, ...те же ключи)` | `mmar_mage.chain_repair` | Полный допуск финальной цепочки; бросает `MAGEValidationError`. Ожидает уже переиндексированные `$history`. |
| `reindex_history_refs(chain)` | `mmar_mage.carl_export` | Переписывает `$history[N]` на позиции рантайма. |
| `validate_carl_json(chain, *, strict_carl=False)` | `mmar_mage` | Структура, номера шагов, цели зависимостей, циклы; `strict_carl=True` отвергает типы шагов, известные только MAGE. |
| `to_carl_compat(chain)` | `mmar_mage` | Переводит поля MAGE в `step_config` CARL. |
| `carl_loadable_step_types()` | `mmar_mage.carl_export` | Типы шагов, которые умеет загружать установленный CARL. |
| `compose_chains(chains, mode="sequential" или "parallel")` | `mmar_mage` | Детерминированная сборка допущенных цепочек в одну. |
| `VALID_STEP_TYPES`, `CARL_VALID_STEP_TYPES` | `mmar_mage.schemas` | Типы шагов при написании и при экспорте. |

```python
from mmar_mage.chain_repair import lint_chain, validate_runtime_chain

findings = lint_chain(chain_dict)          # [] если всё чисто
validate_runtime_chain(chain_dict)         # MAGEValidationError при провале
```

Эти два вызова запускались офлайн на сгенерированной цепочке на
`feat/v3-ideal-loop`.

## См. также

- [Типизированные запросы и допуск](/ru/mage/concepts/typed-authoring/)
- [Настройки](/ru/mage/integration/configuration/)
- [Maestro как хост](/ru/mage/integration/maestro-host/)
