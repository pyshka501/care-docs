---
title: Быстрый старт
description: Установить MAGE (выпущенный 0.1.3 или ветку разработки, которую закрепляет Maestro), получить первую цепочку из Python и из CLI и проверить её.
sidebar:
  order: 2
---

Нужен Python 3.12 или 3.13 и OpenAI-совместимый эндпоинт с ключом (OpenAI,
OpenRouter, локальный vLLM или Ollama). MAGE делает настоящие вызовы модели:
`fast` один, `deep` минимум четыре.

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

### Ветка разработки: то, что закрепляет Maestro

Линии 0.2.0 на PyPI нет. Она требует сборку CARL
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

Работает на обеих линиях.

```python
import asyncio
from mmar_mage import MAGEConfig, generate_chain

config = MAGEConfig(
    mode="fast",            # один вызов модели; по умолчанию "deep"
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

`enable_memory` по умолчанию `True`: для задачи-строки MAGE пробует сохранить
цепочку в сервис памяти по адресу `memory_base_url`
(`http://localhost:8002`). Неудачное сохранение генерацию не роняет, но стоит
таймаута.

Другие эндпоинты:

```python
MAGEConfig.for_openrouter(api_key="sk-or-...", model="anthropic/claude-3.5-sonnet")
MAGEConfig.for_local(base_url="http://localhost:8000/v1")   # модель "__auto__": берётся из /v1/models
MAGEConfig.from_toml("configs/fast.toml")                    # все поля в секции [mage]
MAGEConfig.from_env()                                        # переменные MAGE_*
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

generator = MAGEGenerator(MAGEConfig(mode="fast", api_key="sk-..."))
result = asyncio.run(generator.generate(request))
print([s["step_type"] for s in result.chain_dict["steps"]])   # последний: "structured_output"
```

С `output_contract` единственным финальным шагом должен быть
`structured_output` с тем же именем схемы, полями и типами. Если модель
написала иначе, MAGE сообщает о несовпадении, делает одну попытку починки, а
дальше выбрасывает `MAGEValidationError`. При запуске цепочка получает объект
входа как `$outer_context` (здесь `$outer_context.reviews`).

## Цепочка из CLI

```bash
export MAGE_API_KEY=sk-...
mage generate "Classify support tickets by urgency" --mode fast --no-memory -o chain.json
mage generate "Summarise a quarterly report" --base-url http://localhost:8000/v1 --model my-model
mage validate chain.json
```

`mage validate` запускает структурную проверку MAGE, строгую проверку типов
CARL и `ReasoningChain.from_json`. Это не полный допуск: линт и
`validate_runtime_chain` не выполняются. См. [CLI](/ru/mage/integration/cli/).

## Что проверено

Оба примера на Python и `mage validate` запускались на ветке разработки
`feat/v3-ideal-loop` (acf7091), клиент OpenAI был заменён заглушкой с
фиксированной цепочкой: без сети и без ключа. Цепочки загрузились в CARL.
Настоящий эндпоинт не вызывался.

## Дальше

- [Конвейер генерации](/ru/mage/concepts/pipeline/)
- [Типизированные запросы и допуск](/ru/mage/concepts/typed-authoring/)
- [Запустить цепочку в CARL](/ru/carl/getting-started/quick-start/)
