---
title: Команды Production
description: Команды для датасета, эволюции и публикации, доступные в режиме Production.
sidebar:
  order: 2
---

Эти команды появляются, когда вы находитесь в режиме **Production** (где цепочки
сохраняются в Memory под стабильным `chain_id`). Они управляют потоком датасет →
эволюция → публикация. Разницу между режимами см. в [режимах чата](/ru/care/getting-started/overview/).

## Датасеты

| Команда | Что делает |
| --- | --- |
| `/dataset list <chain_id>` | Показать записи датасета для цепочки. |
| `/dataset add <chain_id> "<task>" --expected "<out>" [--rubric "<prompt>"]` | Добавить случай в датасет. |
| `/dataset run <chain_id>` | Воспроизвести + оценить записи датасета. |
| `/dataset export <chain_id> <path>` | Записать записи как JSONL. |

## Эволюция

| Команда | Что делает |
| --- | --- |
| `/evolution <run_id>` | Отрисовать состояние эволюции инлайн. |
| `/evolution watch <run_id>` | Стримить события эволюции в реальном времени. |
| `/evolution accept <run_id> <individual_id>` | Продвинуть победившую особь в стабильный канал. |

## Публикация и жизненный цикл

| Команда | Что делает |
| --- | --- |
| `/deploy <ref> [--channel X] [--name Y]` | Развернуть сохранённую цепочку в [agent hub](/ru/care/workflows/deploy/) как HTTP-агента (канал по умолчанию: `stable`). |
| `/promote <chain_id> <version>` | Продвинуть версию (или принятого победителя эволюции) в **stable**-канал. |
| `/upload <chain_id>` | POST цепочки на `CARE_UPLOAD__URL`. |
| `/forget <chain_id> [--force]` | Мягкое удаление цепочки + её датасета. |

:::note
Production требует `CARE_MEMORY__BASE_URL`. Без настроенной Memory выбор Production
автоматически откатывается в Ad-Hoc — эти команды не будут применяться.
:::
