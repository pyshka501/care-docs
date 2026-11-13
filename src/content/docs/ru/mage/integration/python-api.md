---
title: Python API
description: MAGEGenerator и его методы generate, compile и edit, стратегия v3 (по умолчанию в 0.2.0) и build_v3_contract, обратные вызовы прогресса, отмена, MAGEResult, исключения и функции допуска, которые хост импортирует напрямую.
sidebar:
  order: 1
---

Сигнатуры даны по ветке разработки (0.2.0). Пометка **0.2** значит, что в
выпущенном 0.1.3 этого нет.

## Точки входа

```python
from mmar_mage import MAGEConfig, MAGEGenerator

generator = MAGEGenerator(
    config,                              # MAGEConfig | None (None = MAGEConfig(): в 0.2.0 v3, gpt-4o)
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
    capabilities=None,        # CapabilityContext: закрытый каталог инструментов (для v3 это весь набор)
    runtime_features=None,    # 0.2: RuntimeEnvironmentFeatures, нужен семантической стратегии и v3
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

## Стратегия v3

**Кандидат 0.2.0, там она по умолчанию.** С обычным `MAGEConfig()` (или с
`generation_strategy="v3"`) `generate()` запускает
[генератор v3](/ru/mage/concepts/v3-generator/) и по-прежнему возвращает
`MAGEResult`. Для конвейера fast/deep передайте
`generation_strategy="legacy"`; `mode`, `return_candidates` по топологиям и
обёртки стадий выше относятся к нему. Инструменты передайте в `capabilities`
(без них у цепочки инструментов нет), а в `runtime_features` объявите
`human_input_callback_available` (без объявления считается, что на
`human_input` ответить некому).

```python
from mmar_mage import MAGEConfig, MAGEGenerator, build_v3_contract

generator = MAGEGenerator(MAGEConfig(api_key="sk-..."))   # v3, по умолчанию в 0.2.0
result = await generator.generate(request, capabilities=caps, runtime_features=features)

contract = build_v3_contract(request, caps, features)   # что прочитает модель v3; без вызова модели
```

| Символ | Назначение |
| --- | --- |
| `build_v3_contract(request, capabilities=None, runtime_features=None, *, resolved=None)` | JSON-контракт, который читает v3. Строится из `GenerationRequest` (или строки) с учётом его политики выдачи данных: `generation_view`, `current_turn_constraints`, `retrieved_untrusted_context`, `input_manifest`, `runtime_input_schema`, `output_contract`, `capability_fixture`, `environment`. Приватные поля схемы, локальные пути и секреты в описаниях инструментов туда не попадают. Его вызывает `generate()`; хост может вызвать его сам и посмотреть, что увидит модель. |
| `V3Result` | Исход функции процесса `mmar_mage.authoring.generate_v3`: `chain`, `admitted`, `plan`, `attempts`, `dry_runs`, `dry_run_passed`, `trace()`. `generate()` упаковывает его в `MAGEResult`; адаптер бенчмарка в `evaluation/` работает с ним напрямую. |

Остальное из `mmar_mage.authoring` (`generate_v3`, `V3Settings`, `V3Hooks`,
функции сухого прогона) импортируется, но описано только в коде. Через
`V3Hooks` подключаются исследовательские расширения из `evaluation/`.

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
стадии `semantic_*` для семантической стратегии; `v3_plan`, `v3_author`,
`v3_dry_run` для стратегии v3.

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
| `mode` | `fast` или `deep`. Результат v3 просто копирует `MAGEConfig.mode`, которым v3 не пользуется; стратегия лежит в `metadata.generation_strategy`. |
| `metadata` | `MAGEMetadata`: область, число шагов, время, модель, пройденные стадии, использованные находки в памяти и вебе, предложенные имя, описание и теги, токены по стадиям, попытки провайдера. |
| `intermediate_artifacts` | Дампы отработавших стадий: `domain_analysis`, `step_plan`, `dag`, `described_steps` и другие. У v3 одна запись `v3`: трасса процесса (план, действия компилятора, попытки, сухие прогоны). |
| `quality_report` | Отчёт обратной связи исполнения или режима бенчмарка, если включены. |

`to_care_dict()` и `from_care_dict()` сериализуют пакет для повтора;
`replay_from(stage)` перегенерирует цепочку начиная со стадии deep.

## Исключения

Все наследуют `MAGEError`.

| Исключение | Когда |
| --- | --- |
| `MAGEValidationError` | Цепочка не прошла структуру, линт или допуск рантаймом; у v3 ни одна попытка автора не прошла допуск. В `.raw_output` ответ модели. |
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
