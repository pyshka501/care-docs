---
title: Быстрый старт
description: Запустить IdeaL локально через Docker Compose, выпустить API-ключ, войти в веб-интерфейс, затем создать, найти и архивировать идею и сообщить результат через REST API.
sidebar:
  order: 2
---

IdeaL входит в репозиторий `gigaevo-memory` (ветка `dev`). Поддерживаемый
способ запуска — Docker Compose через `Makefile` в корне.

:::caution[Используйте Compose, а не start.sh]
`start.sh` и цели `make local-*` — личные скрипты разработчика. На `dev` они
не дают рабочий стек. `start.sh` жёстко ссылается на путь на чужой машине.
Локальные цели берут образ Postgres без `pgvector`, ищут `alembic.ini` не там
и задают переменную, которую API не читает. Запускайте `make up`.
:::

## 1. Запустить стек

Нужны Docker с Compose и GNU Make.

```bash
git clone -b dev https://github.com/Glazkoff/gigaevo-memory.git gigaevo-memory
cd gigaevo-memory
cp deploy/.env.example deploy/.env   # без него Compose не стартует
make up
```

`make up` собирает образы, запускает `memory-migrate` (миграции Alembic,
затем засев) и поднимает пять сервисов: `nginx`, `memory-api`, `web-ui`,
`postgres` (pgvector) и `redis`.

| Что | Адрес |
| --- | --- |
| Веб-интерфейс | `http://localhost:8000/` |
| API | `http://localhost:8000/api/v1/...` |
| Swagger UI | `http://localhost:8000/api/docs` |
| Актуальная схема OpenAPI | `http://localhost:8000/api/openapi.json` |
| Прямой порт API (только loopback, без префикса `/api`) | `http://127.0.0.1:8002` |

Проверка:

```bash
curl -s http://localhost:8000/api/health
# {"status":"ok","postgres":"ok","redis":"ok",...,"auth":"open"}
```

В примере `.env` задано `IDEAL_SEED_NAMESPACE=demo`. Поэтому при первом
запуске в пространство `demo` попадают 40 начальных идей и одна стартовая
цепочка. Засев идемпотентен: повторный запуск ничего не дублирует.

`"auth":"open"` означает `AUTH_REQUIRED=false`: запросы без ключа
обслуживаются как анонимные. На ноутбуке это нормально. Открывать такой стек
наружу нельзя. Подробнее: [Эксплуатация](/ru/ideal/api/operations/).

## 2. Выпустить ключ и войти

Веб-интерфейс всегда просит личный API-ключ, даже если API открыт.

```bash
make create-key OWNER=alice LABEL="alice laptop"
# ключ печатается один раз, сразу скопируйте его
```

Ключ может читать и писать пространство `alice` (своего владельца). Чтобы
дать ему другие пространства или выпустить ключ администратора, используйте
вкладку Admin или admin API (см. [Пространства и ключи](/ru/ideal/concepts/namespaces-and-keys/)).
Ключ администратора для своего стека:

```bash
make create-key OWNER=admin SCOPES=admin:keys,read:any,write:any LABEL=admin
```

Откройте `http://localhost:8000/`, вставьте ключ в поле **API-ключ** и
нажмите **Войти**. Вкладки: Chains, Agent Skills, Memory Cards, **IdeaL**,
Search, Showcase, Maintenance и **Admin** для ключей с `admin:keys`. Кроме
формы входа, интерфейс на английском.

## 3. Создать идею

Идея — это карточка памяти с `content.status = "active"`. Пишите
`when_to_use` и в `meta`, и в `content`: ответ retrieve берёт его из `meta`.

```bash
API=http://localhost:8000/api
KEY=<ваш ключ>

curl -s -X POST $API/v1/memory-cards \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -d '{
  "meta": {
    "name": "verify_total_against_line_items",
    "namespace": "alice",
    "tags": ["verification"],
    "when_to_use": "The answer is a sum or total reported in a table."
  },
  "content": {
    "name": "verify_total_against_line_items",
    "description": "Add a step after extraction that recomputes the total from the line items and flags a mismatch before answering.",
    "when_to_use": "The answer is a sum or total reported in a table.",
    "status": "active",
    "origin": "manual"
  }
}'
```

В ответе есть `entity_id`, `version_id`, `version_number` (0 у первой версии)
и `etag`.

Этот эндпоинт не проверяет дубликаты. Форма идеи в Maestro и сценарии засева
делают это до записи. Подробнее: [Идеи](/ru/ideal/concepts/ideas/).

## 4. Найти её

`mode=catalog` — это чтение, которым пользуется генерация. Оно ничего не
записывает.

```bash
curl -s -X POST $API/v1/retrieve \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -d '{
  "mode": "catalog",
  "namespace": "alice",
  "context": {"task_description": "recompute the total from line items"},
  "k": 3
}'
```

У каждого элемента есть `entity_type` (`memory_card`, `tool` или `chain`),
`id`, `relevance` и `content`. `relevance: null` значит, что элемент не
совпал с запросом и добавлен для полноты выдачи по имени.

Попробуйте тот же запрос по-русски: придут только такие элементы, с
`relevance: null`. Это и есть ограничение поиска только по-английски.

## 5. Отправить в архив

Архивирование — это новая версия со `status: "archived"`. Архивные идеи
`retrieve` никогда не возвращает, история сохраняется. Передайте текущий
`etag` в `If-Match`, чтобы не затереть чужую правку (при изменении будет 412).

```bash
ID=<entity_id>
ETAG=$(curl -s -H "X-API-Key: $KEY" $API/v1/memory-cards/$ID | python3 -c 'import json,sys; print(json.load(sys.stdin)["etag"])')

curl -s -X PUT $API/v1/memory-cards/$ID \
  -H "X-API-Key: $KEY" -H "If-Match: $ETAG" -H 'Content-Type: application/json' -d '{
  "content": {
    "name": "verify_total_against_line_items",
    "description": "Add a step after extraction that recomputes the total from the line items and flags a mismatch before answering.",
    "when_to_use": "The answer is a sum or total reported in a table.",
    "status": "archived",
    "origin": "manual"
  },
  "change_summary": "archive"
}'
```

`PUT` заменяет весь `content`. Передавайте все поля, а не только `status`.

## 6. Необязательно: маленький цикл эволюции вручную

Так сервис эволюции работает с каждой мутацией. Возьмите одноразовое
пространство: эти события останутся в статистике озера.

```bash
# перед мутацией: запросить подборку
curl -s -X POST $API/v1/retrieve -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -d '{
  "mode": "evolution", "namespace": "alice", "task_key": "demo-task",
  "run_id": "demo-run-1", "candidate_id": "m1",
  "context": {"task_description": "Answer numeric questions over financial tables",
              "focus": "units and scale of numbers"},
  "k": 2
}'
# -> {"items": [...], "run_url": "http://.../v1/ideal/run/alice/demo-run-1?sig=...", ...}

# после оценки потомка: сообщить результат
curl -s -X POST $API/v1/outcome -H "X-API-Key: $KEY" -H 'Content-Type: application/json' -d '{
  "kind": "mutation", "run_id": "demo-run-1", "candidate_id": "m1",
  "delta": 0.04, "parent_score": 0.61,
  "cited_idea_ids": ["<id из подборки, который реально применили>"],
  "metric": {"name": "accuracy", "higher_is_better": true,
             "lower_bound": 0, "upper_bound": 1, "min_delta": 0.01}
}'
# -> 201 {"recorded": true, "created": true}; повтор того же вызова -> 200, created false
```

Откройте `run_url` в браузере: там живая страница прогона с радаром.
Подборка может оказаться пустой. Это контрольная группа, так и должно быть.

## Остановить

```bash
make stop    # остановить, контейнеры и данные остаются
make down    # удалить контейнеры; том Postgres остаётся
```

## Дальше

- [Идеи](/ru/ideal/concepts/ideas/), [Рейтинг и результаты](/ru/ideal/concepts/rating/)
- [Подключить Maestro к IdeaL](/ru/ideal/maestro/connect/)
- [Справочник API](/ru/ideal/api/reference/)
