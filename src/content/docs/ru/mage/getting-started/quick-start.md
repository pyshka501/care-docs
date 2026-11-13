---
title: Быстрый старт
description: Установить MAGE (выпущенный 0.1.3, кандидат 0.2.0 или ветку разработки, которую закрепляет Maestro), получить первую цепочку из Python и из CLI стратегией legacy или v3 (она по умолчанию в 0.2.0) и проверить результат.
sidebar:
  order: 2
---

Нужен Python 3.12 или 3.13 и OpenAI-совместимый эндпоинт с ключом (OpenAI,
OpenRouter, локальный vLLM или Ollama). MAGE делает настоящие вызовы модели.
У стратегии legacy в режиме `fast` вызов один, в `deep` минимум четыре. v3,
стратегия по умолчанию в 0.2.0, делает больше: план, вызов автора, починки и
сухой прогон.

## Установка

### Выпущено: 0.1.3 с PyPI

```bash
pip install mmar-mage==0.1.3
pip install 'mmar-mage[memory]==0.1.3'   # + gigaevo-client для GigaEvo Memory
```

В 0.1.3 есть генерация `fast` и `deep`, `edit`, `evolve`, `validate` и работа
с памятью. Типизированных запросов (`GenerationRequest`), допуска рантаймом и
семантического компилятора нет. Требование к CARL открытое (`mmar-carl>=0.2`),
поэтому pip поставит самый новый CARL; с CARL 0.5.0 это сочетание не
проверялось.

### Кандидат 0.2.0: на PyPI пока нет

Кандидат в релиз лежит на ветке `prep/mage-0.2.0` (черновик PR
`Glazkoff/carl-mage#21`). Ему нужен опубликованный `mmar-carl>=0.5.2,<0.6`,
так что из git ставится только сам MAGE:

```bash
pip install "mmar-mage @ git+https://github.com/Glazkoff/carl-mage@5a38672648d97ed825562b0da572546e221dea64"
```

[Стратегия v3](#стратегия-v3) есть только в этой линии, и здесь она по
умолчанию. Для конвейера fast/deep нужно `generation_strategy="legacy"`.

### Ветка разработки: то, что закрепляет Maestro

Ревизии, которые закрепляет Maestro, старше кандидата. Им нужна сборка CARL
(`mmar-carl==0.3.0+maestro.contracts.3.ideal.20261005.1`), которую не отдаёт
ни один индекс пакетов, поэтому проект закрепляет обе зависимости по
git-ревизии. Так это сделано в Maestro, через `uv`:

```toml
# pyproject.toml
[project]
dependencies = ["mmar-mage"]

[tool.uv.sources]
mmar-mage = { git = "https://github.com/Glazkoff/carl-mage", rev = "b7a6e273f365729ae7af02b83885cf774da3ff72" }

[tool.uv]
# Заменить невыпущенный пин CARL из MAGE на ревизию CARL, которую вы реально запускаете.
override-dependencies = ["mmar-carl @ git+https://github.com/Glazkoff/carl.git@f0afe4620d72dbf13e59b372ec3e550195a19d61"]
```

Extras этой линии: `memory` (`gigaevo-client`), `web` (поиск DuckDuckGo без
ключа через `ddgs`), `all`.

Из клона репозитория разработки:

```bash
uv sync --group dev          # проект + инструменты разработки
uv sync --group dev --all-extras
uv run mage version          # mmar-mage 0.2.0
```

## Цепочка из Python

Пример на стратегии legacy, работает на всех трёх линиях.

```python
import asyncio
from mmar_mage import MAGEConfig, generate_chain

config = MAGEConfig(
    generation_strategy="legacy",   # нужно в 0.2.0, где по умолчанию "v3"
    mode="fast",            # один вызов модели; режим по умолчанию "deep"
    api_key="sk-...",
    model="gpt-4o",
    enable_memory=False,    # не пытаться сохранить в GigaEvo Memory
)

result = asyncio.run(generate_chain(
    "Analyze customer feedback and identify the top 3 issues",
    config,
))
print(result.chain_json)                       # JSON цепочки CARL
print(result.metadata.num_steps, result.metadata.suggested_display_name)
```

В 0.2.0 без `generation_strategy="legacy"` этот конфиг запустит v3, а v3
`mode` не читает. В ревизиях, которые закрепляет Maestro, `legacy` и так по
умолчанию. В 0.1.3 поля `generation_strategy` нет; её `MAGEConfig` не
запрещает лишние ключи, так что строка там просто отбрасывается (по
исходникам `v0.1.3`, не запускалось).

`enable_memory` по умолчанию `True`: для задачи-строки MAGE пробует сохранить
цепочку в сервис памяти по адресу `memory_base_url`
(`http://localhost:8002`). Неудачное сохранение генерацию не роняет, но стоит
таймаута.

Другие эндпоинты:

```python
MAGEConfig.for_openrouter(api_key="sk-or-...", model="anthropic/claude-3.5-sonnet")
MAGEConfig.for_local(base_url="http://localhost:8000/v1")   # модель "__auto__": берётся из /v1/models
MAGEConfig.from_toml("configs/fast.toml")                    # все поля в секции [mage]; пресеты 0.2.0 задают "legacy"
MAGEConfig.from_env()                                        # переменные MAGE_*; в 0.2.0 v3, если не задан MAGE_GENERATION_STRATEGY
```

## Типизированный запрос

Только ветка разработки. `GenerationRequest` нужен, когда у цепочки
фиксированный вход или она должна вернуть точный JSON-объект.

```python
import asyncio
from mmar_mage import (
    DataEgressPolicy, GenerationOutputContract, GenerationRequest,
    MAGEConfig, MAGEGenerator, PersistencePolicy,
)

schema = {
    "type": "object",
    "properties": {
        "total": {"type": "number"},
        "top_issues": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["total", "top_issues"],
    "additionalProperties": False,
}

request = GenerationRequest(
    current_task="Count the reported issues and name the top three",
    runtime_input_schema={
        "type": "object",
        "properties": {"reviews": {"type": "string"}},
        "required": ["reviews"],
        "additionalProperties": False,
    },
    output_contract=GenerationOutputContract(schema_name="feedback_issues", json_schema=schema),
    data_egress_policy=DataEgressPolicy(external_research="deny"),
    persistence_policy=PersistencePolicy(mode="deny"),
)

generator = MAGEGenerator(MAGEConfig(generation_strategy="legacy", mode="fast", api_key="sk-..."))
result = asyncio.run(generator.generate(request))
print([s["step_type"] for s in result.chain_dict["steps"]])   # последний: "structured_output"
```

С `output_contract` единственным финальным шагом должен быть
`structured_output` с тем же именем схемы, полями и типами. Если модель
написала иначе, MAGE сообщает о несовпадении, делает одну попытку починки, а
дальше выбрасывает `MAGEValidationError`. При запуске цепочка получает объект
входа как `$outer_context` (здесь `$outer_context.reviews`).

## Стратегия v3

Только кандидат 0.2.0, и там v3 стоит по умолчанию: его запускает любой
`MAGEConfig` без `generation_strategy`. Он планирует поток данных, даёт
модели написать CARL, чинит цепочку по замечаниям допуска и прогоняет её
всухую в CARL, имитируя объявленные инструменты. См.
[Генератор v3](/ru/mage/concepts/v3-generator/).

```python
import asyncio
from mmar_mage import (
    CapabilityContext, GenerationOutputContract, GenerationRequest,
    MAGEConfig, MAGEGenerator, RuntimeEnvironmentFeatures,
)

station_tool = {
    "name": "station_coordinates",
    "description": "Coordinates of a weather station by its id.",
    "required_args": ["station"],
    "input_schema": {
        "type": "object",
        "properties": {"station": {"type": "string"}},
        "required": ["station"],
        "additionalProperties": False,
    },
    "output_schema": {
        "type": "object",
        "properties": {"latitude": {"type": "number"}, "longitude": {"type": "number"}},
        "required": ["latitude", "longitude"],
    },
}

request = GenerationRequest(
    current_task="Return the coordinates of the weather station named in the request.",
    runtime_input_schema={
        "type": "object",
        "properties": {"request": {"type": "string"}},
        "required": ["request"],
    },
    output_contract=GenerationOutputContract(
        schema_name="coords",
        json_schema={
            "type": "object",
            "properties": {"latitude": {"type": "number"}, "longitude": {"type": "number"}},
            "required": ["latitude", "longitude"],
            "additionalProperties": False,
        },
    ),
)

config = MAGEConfig(          # без generation_strategy: в 0.2.0 по умолчанию "v3"
    api_key="sk-...",
    model="gpt-4o",
    enable_memory=False,
)
result = asyncio.run(MAGEGenerator(config).generate(
    request,
    capabilities=CapabilityContext(tools=[station_tool]),   # другие инструменты v3 недоступны
    runtime_features=RuntimeEnvironmentFeatures(human_input_callback_available=False),
))
print([s["step_type"] for s in result.chain_dict["steps"]])  # например, structured_output, tool, structured_output
print(result.metadata.verification_passed)                   # True, если последний сухой прогон прошёл
print(result.intermediate_artifacts["v3"]["attempts"])        # попытки автора и починки
```

- `capabilities` задаёт закрытый мир. Без него инструментов у цепочки нет.
- Сухой прогон никогда не вызывает `station_coordinates`: его имитирует
  модель по схемам. Это лишние вызовы модели; `v3_dry_run_rounds=0`
  выключает прогон.
- При проваленном сухом прогоне всё равно возвращается последняя допущенная
  цепочка с `verification_passed=False`. Если цепочка так и не прошла
  допуск, выбрасывается `MAGEValidationError`.
- Если в `runtime_input_schema` есть приватное поле, v3 отклоняет любой шаг
  `llm`. Для таких задач берите `generation_strategy="legacy"`.

## Цепочка из CLI

```bash
export MAGE_API_KEY=sk-...
mage generate "Classify support tickets by urgency" --no-memory -o chain.json    # 0.2.0: v3
mage generate "Classify support tickets by urgency" --strategy legacy --mode fast --no-memory -o chain.json
mage generate "Summarise a quarterly report" --base-url http://localhost:8000/v1 --model my-model
mage validate chain.json
```

`--strategy` есть только в кандидате 0.2.0. В 0.1.3 и в ревизиях, которые
закрепляет Maestro, его не пишите: там и так `legacy`. В 0.2.0 `--mode`
что-то значит только вместе с `--strategy legacy`, а
`MAGE_GENERATION_STRATEGY` CLI не читает.

`mage validate` запускает структурную проверку MAGE, строгую проверку типов
CARL и `ReasoningChain.from_json`. Это не полный допуск: линт и
`validate_runtime_chain` не выполняются. См. [CLI](/ru/mage/integration/cli/).

## Что проверено

Все три примера на Python запускались на `prep/mage-0.2.0` (5a38672) с
`mmar-carl` 0.5.2 на Python 3.13, вместо клиента OpenAI были заготовленные
ответы: без сети и без ключа. Оба примера legacy вернули
`metadata.generation_strategy == "legacy"`, типизированный закончился шагом
`structured_output`. Пример v3 без заданной стратегии пошёл через v3 (ответы
как в `tests/test_v3_strategy.py`): цепочка прошла допуск, сухой прогон
прошёл. `mage generate --strategy` с неизвестным значением завершается
ошибкой. Раньше `mage validate` и примеры legacy так же запускались на
`feat/v3-ideal-loop` (acf7091). Настоящий эндпоинт не вызывался,
`pip install` из git выше не запускался.

## Дальше

- [Конвейер генерации](/ru/mage/concepts/pipeline/)
- [Типизированные запросы и допуск](/ru/mage/concepts/typed-authoring/)
- [Запустить цепочку в CARL](/ru/carl/getting-started/quick-start/)
