---
title: Типизированные запросы и допуск
description: GenerationRequest, его политики данных, возможностей и сохранения, типизированные привязки инструментов, точные контракты выхода, закрытые каталоги инструментов и допуск, который проходит цепочка.
sidebar:
  order: 2
---

**Ветка разработки.** Всё на этой странице есть в линии 0.2.0, которую
закрепляет Maestro (впервые появилось в незатеганной фиксации 0.1.4). В
выпущенном 0.1.3 этого нет: там `generate()` принимает только строку.

Задача-строка смешивает три разные вещи: что цепочка должна делать,
приватные данные, которые помогают планировать, и как должен выглядеть
результат. `GenerationRequest` держит их раздельно, и хост решает, что видит
модель, что может уйти наружу и что можно сохранить.

## Запрос

| Поле | Значение |
| --- | --- |
| `current_task` | Задача. Единственный текст, который может попасть в поиск по вебу или памяти и в `task_description` сохранённой цепочки. Содержимого файлов здесь быть не должно. |
| `current_turn_constraints` | Ограничения с тем же приоритетом, что и задача («Верни JSON»). |
| `project_instructions`, `personal_preferences` | Текст с меньшим приоритетом, только для планирования. |
| `retrieved_untrusted_context` | `RetrievedUntrustedContext(context_id, source, content, media_type, private=True)`: тела файлов, найденные цепочки, подсказки IdeaL. Показывается как помеченные данные, а не как инструкции. |
| `input_manifest` | `GenerationInputManifestEntry` на каждый приложенный вход: `input_id`, `name`, `kind`, `media_type`, `size_bytes`, `sha256`, `profile`, `available`, `error`. |
| `runtime_input_schema` | JSON-схема объекта, который цепочка получит как `$outer_context` при запуске. |
| `output_contract` | `GenerationOutputContract(schema_name, json_schema, ...)`: точный финальный ответ. |
| `execution_budget` | `ChainExecutionBudget`: лимиты самой цепочки (шаги, параллелизм, вызовы, время, деньги). Это не бюджет генерации. |
| `data_egress_policy`, `capability_access_policy`, `persistence_policy` | См. ниже. |

Запрос нельзя смешивать со старыми аргументами `generate()`:
`context_files`, `user_context` и `safe_task`. Это даёт `ValueError`.

## Политики

**`DataEgressPolicy`**

- `external_research`: `"safe_task_only"` (по умолчанию) или `"deny"`. Поиск
  по вебу видит только `current_task`; с `deny` он пропускается.
- `generation_model_context`: что видит модель генерации.
  `"safe_contract_only"` (по умолчанию), `"allow_private_planning_context"`
  или `"allow_selected_retrieved_context"`: показываются только элементы из
  списка `generation_retrieved_context_ids` (от 1 до 8 id), а вложения идут
  под непрозрачными метками. Последний режим Maestro использует, чтобы
  передать подсказки IdeaL.

:::caution[Известное ограничение]
Стратегия по умолчанию `legacy` не полностью соблюдает
`generation_model_context`: в режиме `safe_contract_only` её промпт
планирования всё равно включает инструкции проекта, предпочтения и тела
найденного контекста. Фильтрует только выборочный режим. Семантическая
стратегия соблюдает все три режима.
:::

**`CapabilityAccessPolicy`**: `discovery` (`approved_only`, `deny`,
`network_candidates`), `sandbox_probe`, `artifact_install` (по умолчанию
запрещено), `credential_access` (по умолчанию `names_only`: MAGE работает с
именами учётных данных, никогда со значениями), `side_effect_execution` (по
умолчанию запрещено: право на запись MAGE из текста задачи не выводит),
`execution_grants`.

**`PersistencePolicy`**: `mode="deny"`, `"explicit_only"` (по умолчанию: MAGE
ничего не сохраняет, сохраняет хост) или `"safe_projection_only"`.

## Типизированные привязки инструментов

Аргументы инструментов в цепочке задаются явными привязками, а не
свободными строками:

```json
{"kind": "literal", "value": "customer-sales"}
{"kind": "input_field", "path": "request.city"}
{"kind": "context_ref", "path": "$outer_context"}
{"kind": "step_output", "step_number": 2}
```

- `literal`: константа, её никогда не принимают за ключ поиска.
- `input_field`: путь через точку относительно `$outer_context`,
  компилируется в `$outer_context.request.city`.
- `context_ref`: ссылка рантайма целиком: `$outer_context` или путь
  `$memory`, `$ltm`, `$metadata`, `$steps`, `$event`.
- `step_output`: сырой текстовый результат объявленной зависимости (или
  `"previous"`).

Временные сбои инструмента повторяются на том же шаге:
`ToolRetryPolicy(max_attempts=2, retry_on=("timeout",))`, это компилируется в
`error_recovery` CARL.

## Точные контракты выхода

С `output_contract` у цепочки ровно один финальный шаг, `structured_output`,
и его имя схемы, поля и типы равны контракту. Это проверяет линт и ещё раз
допуск. Сообщение линта называет ожидаемую схему, так что раунд починки
знает, что писать.

## Закрытые каталоги инструментов

Передайте в `generate()` `capabilities=CapabilityContext(...)`, и MAGE не
будет искать возможности сам. Каталог превращается в неизменяемый снимок
`ResolvedCapabilities`, и шаг `tool`, который называет что-то вне его, не
проходит линт и допуск. Пустой контекст значит «инструментов нет». Навыки
агента остаются, только если привязаны к рантайму
(`trust_state=RUNTIME_BOUND` и подходящая привязка); найденные, но
непроверенные отбрасываются.

## Допуск

Цепочка возвращается только после того, как её принял
`validate_runtime_chain()`:

1. строгая схема финальной цепочки в формате CARL;
2. линт (инструменты, привязки, ссылки, преобразования, контракт выхода);
3. типизированная загрузка установленным `mmar_carl`
   (`ReasoningChain.from_json`);
4. предупреждения о неразрешённых `$history` становятся ошибками.

Путь правки (`MAGEGenerator.edit`) меняет глубокую копию и проходит тот же
допуск; при провале исходная цепочка не трогается.

Maestro ещё раз вызывает `validate_runtime_chain()` для каждой полученной
цепочки, со схемой её входа, прежде чем положить её в артефакты. См.
[Maestro как хост](/ru/mage/integration/maestro-host/) и
[предпроверку CARL](/ru/carl/care-integration/preflight/).

## См. также

- [Конвейер генерации](/ru/mage/concepts/pipeline/)
- [Python API](/ru/mage/integration/python-api/)
