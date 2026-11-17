---
title: Справочник API
description: HTTP API IdeaL в ветке dev репозитория gigaevo-memory. Авторизация, CRUD идей и инструментов, retrieve и outcome, страницы прогонов, засев, ключи администратора и MCP.
sidebar:
  order: 1
---

Все пути ниже указаны относительно базы API: `http://localhost:8000/api` за
nginx из Compose или прямой порт API без `/api`. Актуальная схема лежит по
адресу `{api}/openapi.json`, Swagger UI — `{api}/docs`.

:::note[openapi.yaml в репозитории отстаёт]
Закоммиченный `openapi.yaml` в `dev` старше admin API, `/v1/auth/me`, ссылок
на прогоны, предложений со страницы прогона и эндпоинтов моделей LLM. Схема
`/openapi.json` работающего сервера полная. Эта страница описывает код.
:::

## Авторизация

Передавайте `X-API-Key: <ключ>`. Токены OIDC (`Authorization: Bearer <jwt>`)
принимаются при `OIDC_ENABLED=true`. Если переданы оба, побеждает bearer.

| Ситуация | Результат |
| --- | --- |
| Без ключа, авторизация открыта (`AUTH_REQUIRED=false`, по умолчанию) | Анонимный вызов, без ограничений по пространствам. |
| Без ключа, авторизация обязательна | 401. |
| Неверный, отозванный или просроченный ключ | 401 в обоих режимах. |
| Пространство не разрешено ключу | 403. |

Правила пространств: [Пространства и ключи](/ru/ideal/concepts/namespaces-and-keys/).

## Идеи (карточки памяти)

| Метод и путь | Что делает |
| --- | --- |
| `POST /v1/memory-cards` | Создать идею. Тело: `{meta: {name, namespace, tags, when_to_use}, content: {...}}`. 201 с `entity_id`, `version_id`, `version_number`, `etag`. Дубликаты не проверяются. |
| `GET /v1/memory-cards?namespace=&limit=&cursor=` | Список с курсорной пагинацией (`limit` до 200). Без `namespace` ключ видит пространство владельца, если у него нет `read:any`. |
| `GET /v1/memory-cards/{id}` | Текущая версия. |
| `PUT /v1/memory-cards/{id}` | Новая версия. Заменяет весь `content`. С `If-Match: <etag>` при параллельной правке будет 412. Необязательный `change_summary`. |
| `DELETE /v1/memory-cards/{id}` | Мягкое удаление. Лучше ставить `status: "archived"`. |
| `GET /v1/memory-cards/{id}/versions` | История версий. |
| `GET /v1/memory-cards/{id}/versions/{version_id}` | Одна версия. |
| `GET /v1/memory_cards/duplicates?threshold=0.95&namespace=` | Пары почти дубликатов по косинусной близости эмбеддингов. Без векторного поиска 503. |

`retrieve` выдаёт только идеи с `content.status == "active"`. Поля описаны в
разделе [Идеи](/ru/ideal/concepts/ideas/).

## Инструменты

Та же форма по адресу `/v1/tools` (`POST`, список `GET`, `GET`/`PUT`/`DELETE`
по id). `content` проверяется: обязательны `tool_key`, `name`, `runtime` и
`status`; `description`, `input_schema`, `output_schema`,
`implementation_ref`, `implementation_hash`, `tags` и `origin` необязательны.

## Retrieve

`POST /v1/retrieve`

| Поле | Примечание |
| --- | --- |
| `mode` | `evolution` или `catalog`. Обязательно. |
| `namespace` | Обязательно. |
| `run_id`, `candidate_id` | Обязательны в `evolution`. Вместе обозначают одно решение о мутации. |
| `task_key` | Необязательно. В `catalog` возвращает цепочки этой задачи по оценке. В `evolution` включает опыт уровня задачи; в одном прогоне менять нельзя (422). |
| `context.task_description` | Обязательно. 1–2 предложения по-английски. Используется для поиска, если нет фокуса. |
| `context.focus` | Что улучшаем: строка или список до 4 слабых мест. Главный сигнал поиска в `evolution`. |
| `context.extra` | Свободный словарь; строковые значения добавляются в запрос. |
| `k` | Сколько идей вернуть; по умолчанию `RETRIEVE_DEFAULT_K` (3). |
| `exclude_ids` | Никогда не возвращаются. В `catalog` передавайте уже полученные, чтобы получить ещё. |

Ответ: `{"items": [...], "hints": [...], "run_url": ...}`. У каждого элемента
есть `entity_type` (`memory_card`, `tool`, `chain`; неизвестные типы
пропускайте), `id`, `relevance` (`null` для добивки и цепочек задачи) и
`content`. В `catalog` элементы также несут `efficacy`, в `evolution` нет.
`run_url` в `evolution` — подписанная живая страница, в `catalog` — `null`.
`hints` в `catalog` может содержать `{"kind": "more", "remaining": N, "label": ...}`.

Пустой `items` — нормальный ответ (контрольная подборка или ничего
подходящего). Повторный вызов `evolution` с теми же `run_id` и
`candidate_id` возвращает записанную подборку.

## Outcome

`POST /v1/outcome`, вид задаёт поле `kind`.

**Мутация:**

| Поле | Примечание |
| --- | --- |
| `run_id`, `candidate_id` | Тот retrieve, который выдал подборку. |
| `delta` | Оценка потомка минус оценка родителя; `null` для невалидного потомка. |
| `parent_score` | Необязательно; включает силу относительно диапазона. |
| `metric` | Необязательно: `{name, higher_is_better=true, lower_bound, upper_bound, min_delta=0}`. |
| `cited_idea_ids` | Идеи из этой подборки, которые реально применены. |
| `change` | Необязательно: `{diff, rationale}` для извлечения. Обрезается до 20000 / 4000 символов. |

Ответ `201 {"recorded": true, "created": true}` или `200` с
`created: false` на точном повторе. Пространство и задачу результат мутации
берёт из соответствующего retrieve. Без предшествующего retrieve он
принимается, но не имеет области и не влияет на рейтинг идей.

**Прогон:**

| Поле | Примечание |
| --- | --- |
| `namespace`, `task_key`, `run_id` | Обязательны. |
| `best_chain` | Итоговое решение в JSON. Сохраняется как `chain` с тегом `task:<task_key>`. |
| `best_fitness` | Его оценка. |
| `metric` | Необязательно, как выше. |
| `path_idea_ids` | Идеи в родословной лучшей цепочки. |

Ответ `201 {"chain_id": "..."}`, на повторе `200`.

## Страницы прогонов

| Метод и путь | Доступ | Что делает |
| --- | --- | --- |
| `GET /v1/ideal/run/{ns}/{run}/link` | Ключ с чтением `ns` | `{run_url, data_url}` любого прогона пространства. |
| `GET /v1/ideal/run/{ns}/{run}?sig=` | Подпись | Живая HTML-страница: радар, лучшая оценка, группы, лента. Обновляется каждые 5 с. |
| `GET /v1/ideal/run/{ns}/{run}/data?sig=` | Подпись | Данные страницы в JSON: `run`, `curve`, `radar`, `radar_sectors`, `mutations`. |
| `POST`/`DELETE /v1/ideal/run/{ns}/{run}/force?sig=` | Подпись | `{"idea_id": ...}`: подсовывать идею в каждую следующую подборку до применения или перестать. |
| `POST /v1/ideal/run/{ns}/{run}/propose?sig=` | Подпись | `{"task_description": ...}`: черновики идей с переводом для показа. Без LLM озера 503. |
| `POST /v1/ideal/run/{ns}/{run}/ideas?sig=` | Подпись | `{"ideas": [{name, description, when_to_use, tags}]}` (1–10): создать и подсунуть. Точные дубликаты возвращаются, а не создаются. |

Маршруты с подписью отвечают 404 на неверную подпись и 409 для завершённого
прогона (для `propose` и `ideas`).

## Служебные эндпоинты озера

Ими пользуются встроенный веб-интерфейс и Maestro. Это не стабильный
клиентский контракт.

| Метод и путь | Что делает |
| --- | --- |
| `GET /v1/ideal/overview?namespace=` | Итоги (выдача против контроля), задачи, идеи с `gain_rate`, `strength`, `efficacy`, прогоны со статусом `running`/`stalled`/`finished`. |
| `GET /v1/ideal/graph?namespace=&limit=` | Узлы и рёбра, см. [граф](/ru/ideal/concepts/tools-and-graph/). |
| `GET /v1/ideal/runs/{run_id}/mutations` | Мутации одного прогона по порядку. |
| `GET /v1/ideal/seed/status` | Настроена ли LLM озера. |
| `POST /v1/ideal/seed/propose` | `{namespace, task_description, k=6}` (k ≤ 20): кандидаты с вердиктами `keep`/`rewrite`/`drop`. Ничего не пишет. |
| `GET`/`PUT /v1/ideal/llm` | Доступные модели и выбранные основная и быстрая; сохранённый выбор важнее окружения. |

## Публичные руководства

Ключ не нужен, даже когда авторизация обязательна:

| Путь | Содержимое |
| --- | --- |
| `GET /v1/ideal/AGENTS.md` | Руководство для агентов, не зависящее от харнесса (Markdown). |
| `GET /v1/ideal/skill/SKILL.md`, `GET /v1/ideal/skill/scripts/lake.py` | Навык засева. |

## Администрирование и учётная запись

| Метод и путь | Право | Что делает |
| --- | --- | --- |
| `GET /v1/auth/me` | Любой настоящий ключ | `{key_id, owner, namespaces, scopes}`. Для анонима 401. |
| `POST /v1/admin/keys` | `admin:keys` | `{owner, label, namespaces, scopes, expires_days}` → метаданные ключа и `plaintext`. |
| `GET /v1/admin/keys` | `admin:keys` | Все ключи с `last_used_at`, `request_count`, `viewable`, `namespace_activity`. |
| `GET /v1/admin/keys/{key_id}/plaintext` | `admin:keys` | `{plaintext}`; 404, если ключ выпущен без зашифрованной копии. |
| `PATCH /v1/admin/keys/{key_id}` | `admin:keys` | `{label, namespaces}`. |
| `POST /v1/admin/keys/{key_id}/revoke` | `admin:keys` | Отозвать сразу. |
| `GET`/`PUT /v1/admin/settings` | `admin:keys` | `{auth_required}`; важнее `AUTH_REQUIRED`. |

## MCP

API отдаёт MCP без состояния (Streamable HTTP) по адресу `{api}/mcp`, с тем же
`X-API-Key` и правилами пространств.

```bash
claude mcp add --transport http ideal {api}/mcp --header "X-API-Key: <ключ>"
```

| Инструмент | Что делает |
| --- | --- |
| `ideal_namespaces` | Пространства, доступные ключу, с числом сущностей. |
| `ideal_catalog` | Компактные цепочки, идеи и инструменты для задачи. |
| `ideal_start_run` | Читаемый id прогона и его подписанный `run_url`. |
| `ideal_ideas` | Следующий id кандидата (`m<N>`) и подборка эволюции. |
| `ideal_report_change` | Оценки родителя и потомка (`null` для невалидного), метрика, id применённых идей из этой подборки, обоснование, необязательный дифф. |
| `ideal_report_run` | Полное лучшее решение и его оценка. |

Ресурсы: `ideal://AGENTS.md`, `ideal://skill/SKILL.md`,
`ideal://skill/scripts/lake.py`.

## Другие эндпоинты памяти

IdeaL делит API с остальной GigaEvo Memory: цепочки, шаги, агенты, навыки
агентов, версии и каналы, общий поиск, события SSE, `/health` и `/metrics`.
Они за рамками этого раздела.
