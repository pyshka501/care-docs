---
title: Шаг Terminate
description: Вернуть явный ответ и остановить цепочку, когда текущий батч закончится.
sidebar:
  order: 25
---

`TerminateStepDescription` (`step_type: "terminate"`, появился в 0.5.2)
досрочно завершает цепочку с явным ответом. Ставьте его на ветку, где готовый
результат уже есть: попадание в кэш или ответ, прошедший проверку. Цепочка
останавливается после текущего батча и отдаёт этот ответ через
`ReasoningResult.get_final_output()`.

## Пример

```python
from mmar_carl import (
    Language, LLMStepDescription, ReasoningChain, ReasoningContext,
    TerminateStepConfig, TerminateStepDescription, ToolStepConfig, ToolStepDescription,
)

def lookup(question):
    return {"answer": "42", "confident": True}

chain = ReasoningChain(steps=[
    ToolStepDescription(
        number=1,
        title="Look up",
        config=ToolStepConfig(tool_name="lookup", input_mapping={"question": "$outer_context"}),
    ),
    TerminateStepDescription(
        number=2,
        title="Return the cached answer",
        dependencies=[1],
        config=TerminateStepConfig(output_source="$steps.1.result_data", reason="Cache hit"),
    ),
    LLMStepDescription(number=3, title="Think harder", aim="Work the answer out.", dependencies=[2]),
])

context = ReasoningContext(outer_context="What is six times seven?", api=client,
                           language=Language.ENGLISH)
context.register_tool("lookup", lookup)

result = chain.execute(context)
result.get_final_output()      # '{"answer": "42", "confident": true}'
result.metadata["terminated"]  # {'step_number': 2, 'reason': 'Cache hit'}
# шаг 3 помечен skipped=True и модель не вызывает
```

На практике terminate-шаг стоит за веткой [условного шага](/ru/carl/steps/conditional/)
и срабатывает, только когда ранний ответ достаточно хорош.

## TerminateStepConfig

Неизвестные поля модель отклоняет. Нужно передать **ровно одно** из `output` и
`output_source`.

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `output` | JSON-значение | — | Литеральный ответ. `null` считается, если передан явно. |
| `output_source` | `str \| None` | `None` | [Ссылка](/ru/carl/chains/dynamic-references/) `$` на ответ. Неразрешимая ссылка валит шаг. |
| `reason` | `str` | `""` | Почему цепочка остановилась. Пишется в результат и трассу. |

Строки возвращаются текстом, остальные JSON-значения рендерятся как JSON.

## Что происходит с остальной цепочкой

- Сначала доходит до конца текущий батч. Соседи в нём всё равно выполняются,
  включая тех, кто ждал свободного воркера, и могут успеть сделать побочные
  эффекты. Если шаг с побочным эффектом не должен запускаться при раннем
  ответе, сделайте его зависимым от другой ветки.
- Если в одном батче успешно отработало несколько terminate-шагов, ответ
  выбирает шаг с меньшим номером.
- Все последующие шаги помечаются пропущенными. Новых действий планировщика,
  итераций циклов и работы RE-PLAN этот батч не запускает.
- Уже случившиеся сбои по-прежнему влияют на итог цепочки. Отмена хостом и
  [fail-fast](/ru/carl/chains/run-controls/) важнее остановки.
- `result.metadata["terminated"]` и метаданные трассы содержат номер шага и
  причину. `get_final_output()` возвращает выбранный ответ даже после обрезки
  истории.

## Продолжение

Снимок, в котором terminate-шаг уже выполнился, нельзя продолжить дальше него.
Пауза и возобновление внутри процесса до остановки работают как обычно.

## Сериализация

Тип шага появился в формате 15, старые форматы мигрируют без изменения
существующих шагов. Любая цепочка, сохранённая в 0.5.2, имеет формат 15, поэтому
читатели старше 0.5.2 отклоняют её с `ChainFormatNewerError`, есть в ней
terminate-шаг или нет.

## См. также

- [Условный шаг](/ru/carl/steps/conditional/) · [Управление запуском](/ru/carl/chains/run-controls/)
- [Шаг Decision](/ru/carl/steps/decision/): решить, достаточно ли хорош ранний ответ.
