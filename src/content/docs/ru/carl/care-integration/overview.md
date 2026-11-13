---
title: Интеграция с Maestro
description: Как Maestro запускает цепочки CARL — допуск, runtime_input и $outer_context, preflight, fail-fast, пауза и отмена, метаданные и записи прогонов.
sidebar:
  order: 1
---

[Maestro](/ru/care/getting-started/overview/) использует CARL как движок
выполнения цепочек. Здесь описан контракт между ними: что Maestro кладёт в
цепочку и контекст, какие API CARL вызывает и на какое поведение CARL
опирается. Любой другой хост может использовать те же части.

## Какой CARL запускает Maestro

Приложение Maestro пока **не** работает на CARL 0.5.x. Сейчас оно закрепляет
`mmar-carl 0.3.0+maestro.contracts.3`, собранную из коммита
`f0afe4620d72dbf13e59b372ec3e550195a19d61` в форке для разработки
`Glazkoff/carl` от 2026-10-05, примерно за месяц до релиза 0.5.0
(2026-11-09). Это CARL 0.3.0 плюс бэкпорт контрактов хоста, которые нужны
Maestro: `fail_fast`, подтверждённая пауза и возобновление, `runtime_input`,
ограниченные входы structured output и ввода человека и проверка
`CARL_TOOL_INPUT_UNRESOLVED`. `FORMAT_VERSION` у этой сборки `1`, типов шагов
она знает 16.

Поэтому вот чем из CARL Maestro пока не пользуется:

- типами шагов из 0.4.0 и новее: `agent`, `code`, `wait`, `map`,
  `command_plan`, `command`, `shell_session`, `claude_code`, `codex`,
  `selection`, `planner`, `decision`, `terminate`;
- встроенными [инструментами-цепочками](/ru/carl/steps/chain-tools/),
  [Git-источниками инструментов](/ru/carl/steps/tool-discovery/#инструменты-из-закреплённого-коммита-git),
  проверкой пиннинга навыков, ранним запуском инструментов и примитивами EvoC;
- изменениями поведения 0.5.0: сбой инструмента валит шаг, JSON-результаты
  инструментов раскладываются, `allow_local_agent_execution`, общий дедлайн
  цепочки;
- форматами цепочек выше 1. Сборка Maestro отклоняет любую цепочку,
  сохранённую в 0.5.x (форматы 13–15), с `ChainFormatNewerError`. В обратную
  сторону всё работает: 0.5.2 поднимает цепочки Maestro формата 1 и сохраняет
  их `fail_fast`.

Переход Maestro на релиз 0.5.x пока не сделан. До тех пор остальная часть
страницы описывает контракт так, как Maestro использует его со своей
закреплённой сборкой. Названные здесь API CARL есть и в 0.5.2.

| Часть | Для чего |
| --- | --- |
| [Preflight](/ru/carl/care-integration/preflight/) | Узнать, что нужно цепочке (инструменты, MCP-серверы, навыки, профили кода, внешние агенты) и чего не хватает в контексте. |
| [RunRecord](/ru/carl/care-integration/run-record/) | Долговечная запись одного прогона: снимок цепочки, вход, результат, время. |
| [Метаданные цепочки](/ru/carl/care-integration/metadata/) | Блок `metadata["care"]`: задача, файлы, теги и контракт входа Maestro. |

## Как Maestro запускает цепочку

Приложение запускает сохранённую цепочку через одну границу исполнения
(`care/harness_execution.py` в репозитории Maestro). По порядку:

1. **Строгий разбор.** Цепочка без явного `fail_fast` и без политики RE-PLAN
   получает на этот запуск `fail_fast: true`. Затем JSON загружается через
   `ReasoningChain.from_dict(data, use_typed_steps=True)`. Предупреждения
   CARL о неразрешимых ссылках `$history[...]` становятся ошибками.
2. **Контракт входа.** В цепочке лежит JSON Schema:
   `metadata["care"]["runtime_input_schema"]`, привязанная к хэшу содержимого
   цепочки. Maestro проверяет по ней вход пользователя до любого вызова
   провайдера.
3. **Контекст.** Maestro собирает `ReasoningContext` так:
   - `runtime_input` — проверенный объект входа;
   - `outer_context` — текст задачи и тот же вход в JSON внутри конверта
     `<untrusted_runtime_input>`, где `<` и `>` экранированы.
   LLM-шаги читают `outer_context`. Ссылки инструментов, map,
   structured output и других шагов читают `$outer_context.<field>` из
   `runtime_input`.
4. **Preflight.** `chain.preflight(context)` выполняется на заполненном
   контексте. Если не хватает инструмента, MCP-сервера или навыка, запуск
   отклоняется (`chain_admission_failed`).
5. **Запуск.** `chain.execute_async(context)` идёт как задача, которую можно
   отменить. Результат превращается в квитанцию с хешами цепочки и входа и
   ограниченным обезличенным превью по шагам.

```python
# Шаг 3 без помощника Maestro для конверта:
context = ReasoningContext(
    outer_context=task_text_with_input_envelope,
    runtime_input={"city": "Paris", "nights": 3},
    api=client,
)
# конфиг шага в цепочке:
ToolStepConfig(tool_name="find_hotels", input_mapping={"city": "$outer_context.city"})
```

`runtime_input` копируется в контекст каждого шага, поэтому
`$outer_context.<field>` работает внутри `chain.execute()`. Если обязательный
параметр инструмента разрешился в `None`, шаг падает до вызова инструмента с
`CARL_TOOL_INPUT_UNRESOLVED`. См.
[динамические ссылки](/ru/carl/chains/dynamic-references/).

## Какие средства управления использует Maestro

| Действие в Maestro | Вызов CARL | Заметки |
| --- | --- | --- |
| Пауза | `context.request_pause()` | Работающие шаги доходят до конца, новые из очереди не стартуют. |
| Статус «пауза запрошена» или «на паузе» | `context.is_pause_requested()`, `context.is_paused()` | Maestro показывает «на паузе», только когда `is_paused()` равен `True`: планировщик ждёт, активных шагов нет. |
| Продолжить | `context.clear_pause()` | Готовые шаги не перезапускаются. Повторного допуска нет. |
| Остановить | `context.cancel()` и отмена задачи | Будит приостановленный прогон. Не начатые шаги помечаются пропущенными. |
| Fail-fast | `ReasoningChain(fail_fast=True)` (из JSON цепочки) | После первого окончательного сбоя новые шаги не стартуют. Подробности в `result.metadata["fail_fast"]`. |

`timeout` цепочки считает только активное время, простой на паузе не
учитывается. В Maestro пауза живёт только внутри процесса и не переживает
перезапуск приложения. Подробнее: [управление прогоном](/ru/carl/chains/run-controls/)
и, со стороны приложения, [Прогоны](/ru/care/app/runs/).

## Проверка установленного CARL

Хост может проверить контракты, прежде чем на них полагаться:

```python
import mmar_carl
assert getattr(mmar_carl, "HOST_RUNTIME_INPUT_ABI", 0) >= 1
```

`STRUCTURED_OUTPUT_SCOPED_INPUTS_ABI` и `HUMAN_INPUT_SCOPED_PROMPT_ABI`
относятся к ограниченным input mapping у шагов structured output и ввода
человека.

## Известные ограничения

- Обёртка preflight в Maestro проверяет только `missing_tools`,
  `missing_mcp_servers` и `missing_skills`. В её закреплённом CARL списков для
  профилей кода, Claude Code, Codex и ключей decision-моделей нет.
- В 0.5.2 `ReasoningChain.set_care_metadata(...)` сохраняет ключи, которые не
  описаны в модели, например `runtime_input_schema`, но сбрасывает описанные
  поля, которые вы не передали. См.
  [метаданные цепочки](/ru/carl/care-integration/metadata/).
