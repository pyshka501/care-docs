# 📚 CARE & CARL — Документация · Master TODO

> Большой план работ по созданию документации для **CARE** (TUI + CLI) и **CARL**
> (библиотека reasoning-цепочек). Документ — единый источник правды по структуре,
> приоритетам и прогрессу. Отмечаем `- [x]` по мере выполнения.

---

## 0. Решения и соглашения

| Параметр | Решение | Обоснование |
| --- | --- | --- |
| **Фреймворк** | **Astro Starlight** | Open-source, красивый дефолт, встроенный поиск (Pagefind), Expressive Code, лёгкий деплой, нативный i18n. |
| **Язык** | **Двуязычная: EN (root) + RU** | Весь исходник на EN; RU — для русскоязычной аудитории и методичек CARL. |
| **Структура** | Лендинг-сплит → две независимые доки `care/` и `carl/` | Требование: «сразу встречает раздел и там два выбора care и carl». |
| **Деплой** | GitHub Pages через GitHub Actions (запасной — Vercel) | Бесплатно, рядом с репо. Уточнить домен. |
| **Репозиторий** | `github.com/pyshka501/care-docs` (private, branch `main`) | Работаем здесь. |
| **Источник CARL** | `carl-experiments/` — **v0.3.0** (последняя) | По прямому указанию: берём последнюю версию из Carl-experiments. |
| **Источник CARE** | `care/` (+ уже готовые `care/docs/cli/*` и `care/docs/screens/*`) | Заготовки экранов/команд переиспользуем. |
| **Бренд / стиль** | `github.com/Glazkoff/care-landing` (склонирован в `../care-landing`) | Канонический источник палитры, шрифтов, маскота EVOC и «терминального» стиля. Доки должны выглядеть как продолжение лендинга. |

**Статусы задач:** `- [ ]` не начато · `- [~]` в процессе · `- [x]` готово · `- [!]` заблокировано/вопрос.

**Источник правды (source-of-truth):** при написании каждой страницы сверяемся
с кодом/README указанного модуля, а не с памятью. CARL — только `carl-experiments`
(не `mmar_carl` из site-packages: установлен может быть 0.2.0, в исходнике 0.3.0).

**Принцип наполнения:** допускается «скелет сейчас, мясо потом» — заводим страницу
со структурой и TODO-врезкой, чтобы навигация была полной с первого дня
(особенно для CARE, где многое ещё не финализировано).

---

## Фаза 1 — Каркас проекта (Starlight + i18n + деплой)

> **Статус (2026-06-09): каркас поднят и ЗАДЕПЛОЕН → https://pyshka501.github.io/care-docs/**
> `npm run build` зелёный (15 страниц), проверено визуально, CI на GitHub Pages зелёный.
> Репозиторий сделан public, Pages включён (source = GitHub Actions), Node 22 в CI.
> Готово: Starlight (Astro 6.3 / Starlight 0.39.3) + i18n (EN root / RU) + `starlight-sidebar-topics`
> (раздельные сайдбары CARE/CARL) + лендинг-сплит с EVOC + бренд-палитра/шрифты (Manrope/JetBrains Mono) +
> Pagefind-поиск + favicon/mascot + CI-workflow (черновик) + README. Контент: getting-started/quick-start
> для CARE и CARL на EN и RU, обзор CLI, базовые концепции.
> Осталось по фазе: OG-картинки, asciinema, Mermaid, кастомный `<ProductChooser>`/404,
> CONTRIBUTING, финал деплоя (site/base + приватность репо), полное терминальное тема-оформление Expressive Code.

### 1.1 Инициализация
- [ ] `npm create astro@latest -- --template starlight` в корне репо (или ручной scaffold, чтобы не затереть `todo.md`/`.git`).
- [ ] Зафиксировать версии: `astro`, `@astrojs/starlight` в `package.json`.
- [ ] Добавить Node-секцию в `.gitignore` (`node_modules/`, `dist/`, `.astro/`, `.vercel/`, `.DS_Store`).
- [ ] `tsconfig.json` (strict), `.editorconfig`, `.nvmrc` (Node 20+).
- [ ] Проверить локальный запуск: `npm run dev` поднимается без ошибок.

### 1.2 i18n
- [ ] `astro.config.mjs`: `defaultLocale: 'root'` (`en`) + `locales: { root: {label:'English', lang:'en'}, ru: {label:'Русский', lang:'ru'} }`.
- [ ] Раскладка контента: EN в `src/content/docs/...`, RU — зеркально в `src/content/docs/ru/...`.
- [ ] Перевести UI-строки Starlight (`src/content/i18n/`), если нужны кастомные.
- [ ] Языковой переключатель в шапке (встроенный) — проверить.

### 1.3 Навигация и разделение на два продукта
- [ ] Подключить плагин **`starlight-sidebar-topics`** — чтобы у CARE и CARL были **разные сайдбары** (в разделе CARE видно только дерево CARE, в CARL — только CARL). Это и есть «две документации».
- [ ] Топик-свитчер: CARE ↔ CARL (вверху сайдбара).
- [ ] Сконфигурировать сайдбары обоих топиков (см. Фазы 2 и 3).

### 1.4 Лендинг (сплит-страница выбора) — в стиле `care-landing`
- [ ] `src/content/docs/index.mdx` — splash hero в эстетике лендинга: `hero-aurora` фон, маскот EVOC, краткий питч экосистемы + **две большие карточки** «CARE — TUI/CLI» и «CARL — reasoning library» со ссылками на их getting-started.
- [ ] Компонент `ProductChooser` (две карточки в стиле `.benefit-card` лендинга: иконка/EVOC, описание, кнопка `.btn-primary`) + краткое «что выбрать».
- [ ] Переиспользовать паттерны лендинга: `.section-eyebrow` + заголовок, glow-кнопки, терминальный демо-блок (опц. — мини-демо `care` чата).
- [ ] Блок «как они связаны» (CARE использует CARL + MAGE + Memory + Platform) — Mermaid-диаграмма стека.
- [ ] RU-версия лендинга (`ru/index.mdx`) — синхронно с i18n лендинга (там RU/EN с авто-детектом).

### 1.5 Брендинг и тема — источник: `care-landing` (AIRI-эстетика, маскот EVOC)
> Доки должны выглядеть как продолжение лендинга. Все токены ниже — из `care-landing/styles.css`.

- [ ] **Шрифты** (Google Fonts): sans = **Manrope** (400/500/600/700/800), mono = **JetBrains Mono** (400/600). Подключить в Starlight (`<head>` или self-host для офлайна).
- [ ] **Палитра → темы Starlight**: маппинг `Aqua Bloom → light`, `Deep Crystal → dark`. Ключевые токены:
  - Light (Aqua Bloom): `--accent #2ebfae`, `--accent-2 #1a9a8c`, `--bg #f0faf8`, `--surface #fff`, `--text #13242e`, `--text-muted #4a6570`, `--crystal #7ef0dd`, `--cream #f4e6c8`.
  - Dark (Deep Crystal): `--accent #33d9b2`, `--accent-2 #2ebfae`, `--bg #0f1115`, `--surface #1f242c`, `--text #e6e6e6`, `--text-muted #a0a8b4`.
  - (Опц.) третья тема **Warm Sand** (`--accent #2a7d6f`, `--bg #faf6ef`) — лендинг переключает 3 темы через `?theme=aqua|crystal|warm`; в Starlight можно оставить light/dark, а Warm Sand рассмотреть как доп. свитчер позже.
- [ ] **Дизайн-токены**: радиусы `8/14/22`, `--shadow-sm/md`, `--shadow-glow` (свечение акцентом), `--transition .25s`, `--max-w 1180px`. Перенести в `src/styles/custom.css` и привязать к переменным Starlight (`--sl-color-accent`, и т.д.).
- [ ] **Терминальный стиль**: код-блоки/демо TUI оформить как `.terminal` лендинга — bg `#13242e`, mint-текст `#e6f7f4`, mac-точки, заголовок + бейдж режима (Production/Ad-Hoc). Настроить тему Expressive Code под эту палитру.
- [ ] **Маскот EVOC**: переиспользовать ассеты из `care-landing/assets/` (webp-эмоции: think/work/coffee/cheers/evolve/generate/start/surprised; gif: hero-mascot, evo-strips) — на лендинге доков, в пустых состояниях, в hero разделов. Скопировать нужные в `public/`.
- [ ] **Лого/фавикон**: `care-landing/assets/favicon.png` (AIRI-кристалл) + `mascot.webp` → `public/`.
- [ ] **OG-изображения** для лендинга и двух разделов (в стиле лендинга, можно с EVOC).
- [ ] Проверить контраст кода и читаемость в обеих темах.

### 1.6 Контент-компоненты (переиспользуемые)
- [ ] Включить Starlight `<Tabs>`, `<Card>`, `<CardGrid>`, `<Steps>`, `<FileTree>`, `<Aside>`, `<Badge>`.
- [ ] Компонент **Asciinema-плеер** для записей TUI (`care/examples/asciicast/`).
- [ ] Компонент «Mermaid» (диаграммы DAG/архитектуры) — `astro` интеграция или rehype-mermaid.
- [ ] Сниппет-валидатор: примеры кода CARL должны быть рабочими (см. 4.4).

### 1.7 Поиск
- [ ] Pagefind (встроен в Starlight) — проверить индексацию обоих языков и топиков.

### 1.8 Деплой / CI
- [ ] `.github/workflows/deploy.yml` — сборка + публикация на GitHub Pages (`withastro/action`).
- [ ] `astro.config.mjs`: `site` + `base` под Pages (или кастомный домен).
- [ ] Бейдж статуса сборки в `README.md`.
- [ ] (Опц.) Превью-деплой Vercel/Netlify на PR.
- [ ] `lychee`/link-checker в CI (битые ссылки).

### 1.9 Документация для контрибьюторов
- [ ] `README.md` репо: как поднять локально, структура, как добавить страницу, как переводить, как деплоится.
- [ ] `CONTRIBUTING.md` (стиль, чек-лист страницы, соглашения по примерам).

---

## Фаза 2 — Документация CARE (TUI + CLI)

> Источники: `care/README.md`, `care/CLAUDE.md`, `care/docs/cli/*.md`,
> `care/docs/screens/*.md`, `care/care/cli.py`, `care/care/screens/chat.py`,
> `care/.env.example`, `care/docs/ARCHITECTURE.md`, `care/docs/DEMO.md`.

### 2.1 Getting Started + Quick Start
- [ ] **Quick Start** (5 минут): `uv sync` → `uv run care init` → `uv run care` → первый промпт в чате → результат. Скринкаст.
- [ ] **Getting Started** (плавный ввод): что такое CARE, зачем, первая генерация агента, что происходит под капотом, куда дальше.
- [ ] «Первый запуск» (first-run wizard, SettingsScreen, `~/.config/care/config.toml`).
- [ ] `/tour` — 5-шаговый walkthrough (описать).

### 2.2 Concepts / Обзор
- [ ] Что такое CARE (Collaborative Agent Reasoning Ecosystem).
- [ ] Четырёхмодульный стек: **MAGE** (генерация), **CARL** (исполнение), **GigaEvo Memory** (хранение), **GigaEvo Platform** (эволюция) + ссылка на доки CARL.
- [ ] Архитектура (по `docs/ARCHITECTURE.md`): generation / execution / persistence / evolution. Диаграмма.
- [ ] **Режимы чата**: Ad-Hoc vs Production (таблица различий, когда что, fallback при отсутствии Memory).
- [ ] Канонический user-flow (generate A → save → B, C → re-run → evolve → accept).

### 2.3 Установка и конфигурация
- [ ] Установка (`uv sync`, экстры `care[carl]`, требования).
- [ ] `care init` (интерактивно и `--non-interactive`, флаги, `--toml`, `--probe`).
- [ ] **Конфигурация**: 4 слоя precedence (defaults → `~/.config/care/config.toml` → `./care.toml` → `CARE_*` env).
- [ ] Полная таблица секций (`mage`, `memory`, `platform`, `upload`, `sandbox`, `tools`, `telemetry`, `defaults`, `chat`, `context`, `artifacts`) — из README + `.env.example`.
- [ ] Маппинг TOML ↔ env (`__` вложенность).
- [ ] Секреты: `care migrate-secrets`, keychain.
- [ ] `care doctor` — health-check.

### 2.4 TUI Guide — обзор интерфейса
- [ ] Введение в TUI (чат-поверхность как центр, prompt снизу, mode-toggle).
- [ ] **Глобальные клавиши** (Ctrl+P/Ctrl+B/Ctrl+K/Ctrl+S/Ctrl+R/?/Esc/Ctrl+Q) — таблица.
- [ ] Stage-trail / стриминг шагов / токен-счётчик в статус-баре.
- [ ] `@<path>` файловые ссылки (pdf/изображения), контекст-инъекция (CARE.md, LTM digest).

### 2.5 Экраны (Screens reference)
> Переиспользуем `care/docs/screens/*.md` (≈50 готовых заготовок) + сводную `screens/README.md`.
- [ ] Сводная таблица всех экранов (cмысл + slash-команда + статус M0/M1) — из `screens/README.md`.
- [ ] Чат (`ChatScreen`) — главный экран, ~75% поведения (отдельная большая страница).
- [ ] Library / Query / Generation / Inspection / EditAgent / Execution.
- [ ] Evolution (Screen / Dashboard / Launch / Compare).
- [ ] Replay / Catalog / Marketplace / Settings / Help.
- [ ] Модалки: CommandPalette, Diff, Lineage, Conflict, Import, Export(+Chain), SaveAgent, SaveReport, RunContext, Resume, HumanInput, TagEditor, UseItNow, FirstChain.
- [ ] Прочие: Artifacts, Cost, Datasets, Demo, Logs, Onboarding, Profile, Runs, SandboxTrust, Skills(Authoring), MultiCompose, TaskListDrawer, Welcome.
- [ ] К каждому экрану: назначение, как попасть, ключевые действия/клавиши, скрин/asciicast.

### 2.6 CLI Reference (headless `care`)
> Переиспструем `care/docs/cli/*.md`. Формат страницы команды: синопсис, флаги, примеры, типовой вывод, связанный экран.
- [ ] Обзорная страница CLI + общие правила (`care <sub> --help`, общий CareConfig).
- [ ] **Setup**: `care init`, `care doctor`, `care migrate-secrets`.
- [ ] **Discovery/validation**: `care catalog`, `care validate`, `care import`.
- [ ] **Generate/run/replay**: `care generate`, `care run`, `care replay`.
- [ ] **Memory browse**: `care memory ls|show|history`, `care search`, `care diff`, `care lineage`, `care favourite`.
- [ ] **Capabilities/evolution**: `care marketplace`, `care evolve`.
- [ ] **UX**: `care help`.
- [ ] Таблица «команда ↔ её TUI-двойник (экран)».

### 2.7 Slash-команды (внутри чата)
> Источник: `care/care/screens/chat.py` (`_cmd_*`, ~42 шт.) + `_HELP_COMMON_COMMANDS` / `_HELP_PRODUCTION_COMMANDS`.
- [ ] Обзор: что такое slash-команды, чем отличаются от обычного промпта (всё не-`/` идёт в MAGE).
- [ ] **Общие**: `/help`, `/tour`, `/mode`, `/artifacts`, `/library`, `/evolution`, `/settings`, `/run`, `/resume`, `/theme`, `/log`, `/multi`, `/edit`, `/history`, `/blocks`, `/branch`, `/imgpreview`, `/subagents`, `/voice`, `/export`, `/clear`, `/new`, `/quit`.
- [ ] **Доп.**: `/marketplace`, `/profile`, `/skills`, `/logs`, `/cost`, `/sandbox`, `/runs`, `/memory`, `/remember`, `/forget`, `/status`, `/onboard`, `/note`, `/upload`, `/datasets`.
- [ ] **Production-only**: `/dataset list|add|run|export`, `/evolution snapshot|watch|accept`.
- [ ] Таблица-шпаргалка (команда · аргументы · режим · что делает).

### 2.8 Возможности / Capabilities
- [ ] **Tools**: `@carl_tool` реестр, встроенные (web_search…), синтез на лету (`tool_synthesis`, `tool_planning`, `builtin_tools.py`).
- [ ] **AgentSkills**: каталог, sandbox-бэкенды (local/docker/e2b/firejail), `skill_enforcement`, авторинг.
- [ ] **Sandbox**: лимиты, trust, `CARE_SANDBOX__*`.
- [ ] **Telemetry**: opt-in event-stream (Langfuse).
- [ ] **Context**: CARE.md + long-term memory digest (`context_md.py`, `memory_ltm.py`).

### 2.9 Примеры и сценарии
> Источник: `care/examples/` (weather, financier, asciicast, datasets), `care/docs/DEMO.md`.
- [ ] Пример: Weather-агент (MCP servers + chain.json).
- [ ] Пример: Financier (chain + skills/pdf-extractor).
- [ ] Сценарии демо: cold-start ≤3 мин, Ad-Hoc, Production, Evolution, offline/hermetic, failure-modes (из `DEMO.md`).
- [ ] Запись asciicast (`scripts/record_demo.sh`, `examples/asciicast/recording_script.md`).

### 2.10 Reference / Прочее
- [ ] Полный справочник ключей конфигурации (генерим из `.env.example`).
- [ ] Шпаргалка клавиш (по экранам).
- [ ] Интеграция (`docs/INTEGRATION.md`).
- [ ] FAQ / Troubleshooting (нет Memory → fallback, провайдеры, частые ошибки).
- [ ] Глоссарий (chain, agent, agent_skill, memory_card, fitness, lineage…).

---

## Фаза 3 — Документация CARL (reasoning library)

> Источники: `carl-experiments/README.md`, `carl-experiments/CLAUDE.md`,
> `carl-experiments/RELEASE.md`, `carl-experiments/docs/*`,
> `carl-experiments/src/mmar_carl/**`, `carl-experiments/examples/**`.
> **Версия 0.3.0.**
>
> **Прогресс (2026-06-09):** готовы EN-страницы §3.1 (getting-started/quick-start),
> §3.2 (концепции), §3.3 (Steps), §3.4 (Building Chains), §3.5 (Search), §3.6 (Async), §3.7 (Memory):
> Steps — overview + LLM/Tool/Memory/Transform/Conditional/StructuredOutput + loops/caching + advanced(все 16 типов);
> Chains — ReasoningChain/ChainBuilder/from_description/dynamic-references; Search — extraction + vector;
> Memory — overview + COW + LTM + schema; Async — execution + streaming.
> Все примеры сверены с исходником 0.3.0 (точные поля/импорты). RU-зеркало этих страниц — следующим заходом
> (сейчас Starlight отдаёт EN как фолбэк). **Осталось (по порядку):** §3.8 RE-PLAN, §3.9 Evaluation/Metrics,
> §3.10 Evolution, §3.11 Tracing/Cost, §3.12 LLM-clients, §3.13 Orchestration, §3.14 Skills, §3.15 MCP,
> §3.16 Serialization, §3.17 Cookbook, §3.18 API ref, §3.19 Changelog.

### 3.1 Getting Started + Quick Start
- [ ] **Quick Start** (5 минут): установка → минимальная цепочка из 2 шагов → `chain.execute(context)` → вывод (на базе README Quick Start, но проверенный против 0.3.0).
- [ ] **Getting Started**: идея CoT-цепочек, зачем DAG/RAG, первый шаг, первый запуск, куда дальше.
- [ ] Установка: `pip install mmar-carl` + экстры (`[vector-search]`, `[mcp]`, `[openai]`, `[langfuse]`, `[skills]`/`[pdf]`/`[pptx]`, `[viz]`, `[all]`). Требования (Python 3.12+, mmar-llm, pydantic).
- [ ] Выбор стратегии поиска (substring vs vector) на старте.

### 3.2 Core Concepts / Формат
- [ ] **Что такое CARL** и философия (универсальные экспертные reasoning-цепочки).
- [ ] **Формат цепочки**: `ReasoningChain` (steps, max_workers, search_config, metrics, replan policy, timeout).
- [ ] **`ReasoningContext`**: outer_context, api/LLM, language, system_prompt, history, memory, callbacks, tool registry.
- [ ] **`ReasoningResult`** / `StepExecutionResult`: success, get_final_output, partial_outputs, failed steps, trace, token usage.
- [ ] **DAG-исполнение**: зависимости → батчи → параллелизм (диаграмма).
- [ ] **RAG-извлечение контекста**: `step_context_queries`, как формируется промпт.
- [ ] **Multi-language**: `Language.ENGLISH/RUSSIAN`, формат system-prompt.
- [ ] Перенести/адаптировать методички `docs/REASONING.md` и `docs/REASONING+.md` (RU) — отлично лягут в RU-локаль.

### 3.3 Steps Reference (все типы шагов)
> Источник: `models/steps.py`, `models/config.py`, `step_executors.py`, `CLAUDE.md`.
> Формат страницы шага: назначение, поля/конфиг, минимальный пример, продвинутый пример, типичные ошибки.
- [ ] Обзор: типизированный API vs legacy `StepDescription`; общие поля (`number`, `title`, `dependencies`, `metrics`, `llm_config`, `retry_max`, `timeout`, `cache`, `loop_config`, `replan_enabled`).
- [ ] `LLMStepDescription` (aim, reasoning_questions, stage_action, example_reasoning, context queries; режимы FAST/SELF_CRITIC).
- [ ] `ToolStepDescription` (`ToolStepConfig`, input_mapping, `ToolErrorRecovery`: RAISE/SKIP/RETRY/FALLBACK).
- [ ] `MemoryStepDescription` (`MemoryStepConfig`, operations read/write/append/delete/list, namespace).
- [ ] `TransformStepDescription` (трансформации без LLM).
- [ ] `ConditionalStepDescription` (branches, default_step, поведение «true routing»).
- [ ] `StructuredOutputStepDescription` (JSON schema / Pydantic).
- [ ] `MCPStepDescription` + `MCPResourceStepDescription` (stdio/SSE/streamable_http; experimental-заметка).
- [ ] `AgentSkillStepDescription` (режимы LLM/SCRIPT/HYBRID/SUBAGENT/LLM_AGENT; URI skill; sandbox).
- [ ] `AgentHandoffStepDescription` (делегирование sub-chain, input/output mapping).
- [ ] `SupervisorStepDescription` (иерархическая маршрутизация).
- [ ] `DebateStepDescription` (round-robin + judge).
- [ ] `ParallelSamplingStepDescription` (N-sample voting / LLM-judge).
- [ ] `HumanInputStepDescription` (in-process / webhook).
- [ ] `ToolDiscoveryStepDescription` (Module/Callable/Dict tool sources).
- [ ] `EvaluationStepDescription` (инлайн-метрика как гейт).
- [ ] **Loop support** (`loop_config` while/until, max_iterations) — кросс-режущая фича шагов.

### 3.4 Building Chains (как строить)
- [ ] **`ReasoningChain`** напрямую (списком step-описаний).
- [ ] **`ChainBuilder`** (fluent: `.add_step`/`.add_tool_step`/`.add_memory_step`/`.with_max_workers`/`.with_search_config`/`.build`).
- [ ] **`ChainBuilder.from_description(...)`** — генерация цепочки из NL (meta-agent, max_retries, provenance в metadata).
- [ ] Регистрация инструментов (`context.register_tool`), требование stateless для параллели.
- [ ] **Dynamic references**: `$history[-1]`, `$memory.ns.key`, `$metadata.*`, `$outer_context`, `$ltm.key`, `$event.name`, строковые литералы. Где используются (input_mapping, value_source, condition).
- [ ] Pre-execution валидация `$memory.*` ссылок (предупреждения).

### 3.5 Context Extraction / Search (RAG)
- [ ] `ContextSearchConfig` (chain-level), стратегии `substring` / `vector`.
- [ ] Substring: case_sensitive, min_word_length, max_matches_per_query.
- [ ] Vector (FAISS + fastembed): embedding_model, index_type, similarity_threshold, max_results; что ставить.
- [ ] **Per-query override**: `ContextQuery` (mixed strategies в одном шаге).
- [ ] `ChainBuilder.with_search_config`.

### 3.6 Async-исполнение и стриминг
> Прямое требование пользователя — отдельный заметный раздел.
- [ ] `chain.execute()` (sync) vs `chain.execute_async()` (async) — когда что.
- [ ] DAG-параллелизм: батчи, `max_workers`, пул воркеров.
- [ ] **`chain.stream_async(ctx)`** — итерация `StepExecutionResult` … терминальный `ReasoningResult` (пример).
- [ ] Callbacks: `on_step_start`, `on_step_complete`, `on_progress`, `on_llm_chunk` (сохраняются в stream).
- [ ] Память при параллели: COW-изоляция, видимость записей только в следующих батчах, требование stateless tools.
- [ ] Отмена/таймауты (chain-level timeout, per-step timeout), `streaming.py` StreamingBuffer.

### 3.7 Memory & State
- [ ] Три слоя: namespaced short-term, session metadata, optional LTM.
- [ ] COW-память (`cow_memory.py`), профайлинг bytes-saved.
- [ ] LTM (`ltm.py`): `LTMBase`, `InMemoryLTM`, `JsonFileLTM`, `$ltm.*`.
- [ ] `memory_schema` (валидация записи, `MemorySchemaError`).
- [ ] `LazyMemoryValue` / `unwrap_lazy`.
- [ ] History: `max_history_entries`, `history_truncation_strategy` (recency/token-budget).

### 3.8 RE-PLAN (рантайм-перепланирование)
- [ ] Идея: checkpoint rollback + повторное планирование.
- [ ] `RuleBasedReplanChecker`, `LLMReplanChecker`.
- [ ] `ReplanPolicy` (chain-level + per-step override), агрегация (unanimous/majority).
- [ ] Budget guards (защита от бесконечного цикла, cost tracking).
- [ ] Примеры: deterministic / llm / voting / checkpoint / budget (из `examples/replan/`).

### 3.9 Evaluation, Metrics & Datasets
- [ ] `MetricBase`, `compute_async`, case-aware dispatch, `call_metric_async`.
- [ ] Встроенные метрики: ExactMatch, CaseInsensitive, Contains, Regex, WordCount, LLMJudge.
- [ ] Привязка метрик к шагу/цепочке.
- [ ] `DatasetEvaluator` + `DataCase` → `DatasetEvaluationReport`.
- [ ] Форматтеры отчёта: failure_heatmap, step_metric_heatmap, score_distribution, latency_histogram, cost_trend.
- [ ] `EvalSuite` (golden-output регрессии).
- [ ] `SelectionStrategy` (Threshold / TopKWorst) для reflection.
- [ ] Reflection (анализ результатов цепочки), `extra_feedback`.

### 3.10 Evolution (эволюция цепочек)
- [ ] `ChainEvolver` (population, elitism, generations, concurrent eval, smoke-check, checkpoint/resume).
- [ ] Multi-objective: `metric: list[...]` + `fitness_fn`.
- [ ] `ChainMutator` (model/temperature swap, prompt rewrite, max-workers, structural INSERT/DELETE step).
- [ ] `IndividualMetrics`, `EvolutionResult` + форматтеры (score_evolution, pareto, spend_vs_quality, mutation_effectiveness, to_lineage_mermaid).
- [ ] `format_runs_pareto`, `EvolutionCostEstimate`.

### 3.11 Tracing, Observability & Visualization
- [ ] `ExecutionTrace` (auto, `result.trace`, to_json/from_json, diff, replay).
- [ ] `TraceAggregator` (p50/p95/p99 латентность, токены по N трейсам).
- [ ] `format_gantt` (text/mermaid), `to_html` (анимированный playback).
- [ ] `ReasoningResult` форматтеры (token_pie, prompt_completion_breakdown, profiling_table, cost_by_model, heatmaps).
- [ ] `ReasoningChain.to_mermaid()` / critical_path / heatmap.
- [ ] `ChainVisualizer` (fluent-фасад).
- [ ] Jupyter `_repr_markdown_` (rich display).
- [ ] Langfuse-интеграция (`tracing.py`).
- [ ] Логирование: `set_log_level`, `get_logger`, уровни.

### 3.12 LLM Clients & Configuration
- [ ] `LLMClientBase` (get_response, _with_retries, _with_system, _with_usage, _with_messages, _with_tools, stream_response; introspection).
- [ ] `OpenAICompatibleClient` (OpenRouter, Azure, Ollama/vLLM/LM Studio), tool calls, streaming, message history.
- [ ] `ChatMessage` (multi-turn).
- [ ] `AnthropicClient` (нативный, `anthropic_client.py`).
- [ ] `RetryPolicy` (transient-only, backoff+jitter, retry_on_status; 401/403/404/422 не ретраятся).
- [ ] Авто-детект клиента (LLMHub / LLMHubAPI / OpenAICompatible / mock / duck-typing).
- [ ] Per-step `llm_config=LLMStepConfig(model=...)`.
- [ ] **Record/Replay**: `RecordingLLMClient` / `PlayingLLMClient`, кассеты JSONL, ключ кассеты, `CassetteMissError`.
- [ ] **Cost estimation**: `chain.estimate_cost(pricing=...)`, `CostEstimate`/`StepCostEstimate`, `format_table`.

### 3.13 Multi-Agent Orchestration
> Отдельный раздел-витрина (фича 0.3.0). Источник: `examples/agents/`.
- [ ] Обзор паттернов: handoff, supervisor, debate, parallel sampling, human-in-the-loop, LLM council.
- [ ] Примеры: supervisor_routing, llm_council, human_in_the_loop, agent_skill.
- [ ] Event bus (`event_bus.py`): `emit_event`, `event_dependencies`, `on_event`, `$event.*`, fan-out.

### 3.14 AgentSkills
- [ ] Что такое AgentSkill (SKILL.md, портативные папки навыков).
- [ ] Режимы исполнения (LLM/SCRIPT/HYBRID/SUBAGENT/LLM_AGENT) — таблица + LLM_AGENT подробно (tool-loop, workspace, in/out).
- [ ] `AgentSkillStepConfig` (skill URI, task, input_mapping, output_capture, trust_policy, skill_sha256, extra_pip).
- [ ] **SkillResolver** (URI-схемы: github/local/https/module/plain), кэш, SHA-pinning, `SkillIntegrityError`.
- [ ] `SkillLoader.catalog_all`, манифест, `allowed-tools`, security-фильтр.
- [ ] Sandbox-рантаймы (`docker_/e2b_/firejail_skill_runtime.py`).
- [ ] Заметка про source-available skills Anthropic (pdf/pptx).

### 3.15 MCP (Model Context Protocol)
- [ ] Обзор + статус (в 0.3.0 graduated из experimental).
- [ ] `MCPStepConfig` / `MCPServerConfig`, транспорты stdio/SSE/streamable_http.
- [ ] `MCPResourceStepDescription` (fetch ресурсов).
- [ ] `mcp_pool.py` (пул соединений), pause/resume, cancellation, streaming, lossless serialization.
- [ ] Рекомендация: для прод — регистрировать как обычные python-tools.

### 3.16 Serialization & Migration
- [ ] JSON-сериализация: `save/load`, `to_dict/from_dict`, `to_json/from_json`.
- [ ] Совместимость (`docs/SERIALIZATION_COMPAT.md`).
- [ ] Миграция legacy `StepDescription` → typed (`docs/MIGRATION_legacy_to_typed_steps.md`, `to_typed_step()`).

### 3.17 Cookbook (примеры цепочек)
> Прямое требование: «примеры цепочек», «примеры со всеми шагами». Источник: `examples/**` (все топики).
- [ ] **orchestration**: basic_chain, parallel_branches, conditions, loop_until, execution_modes (mock/pipeline).
- [ ] **tool_calling**: tool_steps, structured_output.
- [ ] **agents**: llm_council, supervisor_routing, human_in_the_loop, agent_skill.
- [ ] **evaluation**: metrics, dataset_evaluator, reflection, reflection_metrics.
- [ ] **replan**: deterministic, llm_checker, voting, checkpoint_rollback, budget_guard.
- [ ] **skills**: chain_from_description, skill_resolver.
- [ ] **llm_inference**: openrouter, token_usage.
- [ ] Каждый пример: цель → код (рабочий) → пояснение по шагам → ожидаемый вывод → «попробуй сам».
- [ ] «End-to-end tutorial»: построить нетривиального агента с нуля (LLM + tool + memory + conditional + eval), пошагово.

### 3.18 API Reference
> Источник: публичные экспорты `src/mmar_carl/__init__.py` + `models/__init__.py`.
- [ ] Решить способ: ручные страницы по модулям ИЛИ автоген из docstrings (рассмотреть `starlight-typedoc` неприменим к Python → возможно генератор из Python docstrings или ручной curated reference).
- [ ] Модули: chain, chain_evolution, executor, step_executors, llm, record_replay, metrics, dataset_evaluator, eval_suite, replan, cost, tracing, execution_trace, visualizer, streaming, cow_memory, lazy_memory, ltm, memory_schema, event_bus, testing, skill_loader, skill_resolver, tool_definition, anthropic_client, mcp_pool.
- [ ] Модели: steps, config, context, results, search, prompts, enums, base, agent_skill, replan, dataset, llm_client_base, preflight, run_record, result_data.
- [ ] Таблица «все публичные классы/функции» с кратким описанием и ссылкой на пример.

### 3.19 Release Notes / Changelog
- [ ] Перенести `RELEASE.md` (0.1.0 → 0.2.0 → 0.3.0) в раздел Changelog.

---

## Фаза 4 — Качество, полировка, запуск

### 4.1 Контент-полировка
- [ ] Сквозная перелинковка (concepts ↔ steps ↔ examples ↔ api).
- [ ] Единый стиль заголовков/фронтматтера, описания для SEO/превью.
- [ ] Aside-врезки (tip/caution/note) для подводных камней (память-параллель, MCP-experimental, ret- ретраи).
- [ ] Проверка терминов EN↔RU (глоссарий-консистентность).

### 4.2 Двуязычность
- [ ] Зеркальная RU-версия всех страниц (или поэтапно: сначала EN полностью, затем RU-приоритетные: getting-started, concepts, REASONING).
- [ ] Фолбэк на EN для непереведённых (встроено в Starlight) — настроить.

### 4.3 Визуал
- [ ] Asciinema-записи ключевых TUI-сценариев (CARE).
- [ ] Mermaid-диаграммы: архитектура CARE-стека, DAG CARL, lifecycle цепочки, multi-agent паттерны.
- [ ] Скриншоты экранов CARE (light/dark).

### 4.4 Достоверность примеров
- [ ] Прогон CARL-примеров против `carl-experiments` 0.3.0 (mock-клиент, без API-ключа где можно) — чтобы код в доках был рабочим.
- [ ] (Опц.) CI-job, исполняющий сниппеты/`examples` в hermetic-режиме.

### 4.5 Запуск
- [ ] Финальная сборка `npm run build` без ошибок/битых ссылок.
- [ ] Деплой на GitHub Pages, проверка обоих языков + поиска + топик-свитчера.
- [ ] Анонс/ссылка в README репозиториев `care` и `carl-experiments`.

---

## 📌 Открытые вопросы / решить с пользователем

- [x] ~~**Домен и хостинг**~~: РЕШЕНО → GitHub Pages на `pyshka501.github.io/care-docs` (`base: '/care-docs'`). Кастомный домен — при желании позже (тогда убрать `base`).
- [!] **Глубина RU на старте**: переводить всё сразу или сначала EN целиком + RU для getting-started/concepts? (предлагаю второе).
- [!] **API Reference CARL**: ручной curated или автоген из docstrings? (нужно глянуть качество docstrings — по умолчанию начинаю с curated по модулям).
- [!] **Версионирование доков**: нужно ли (CARL ещё 0.x, CARE early)? (по умолчанию — без версий, latest).
- [x] ~~**Приватность репо**~~: РЕШЕНО → репозиторий сделан **public**, GitHub Pages через Actions.

---

## 🗂️ Целевая структура репозитория (Starlight + i18n + topics)

```
care-docs/
├── astro.config.mjs            # Starlight, i18n (root=en, ru), topics-плагин, site/base
├── package.json / tsconfig.json / .nvmrc
├── .github/workflows/deploy.yml
├── README.md  CONTRIBUTING.md  todo.md
├── public/                      # logo, favicon, og, asciicasts
└── src/
    ├── content/
    │   └── docs/
    │       ├── index.mdx                 # EN лендинг (сплит care/carl)
    │       ├── care/                      # EN — топик CARE
    │       │   ├── getting-started/ (quick-start, getting-started, first-run, tour)
    │       │   ├── concepts/ (overview, stack, modes, architecture, flow)
    │       │   ├── install-config/ (install, init, configuration, doctor, secrets)
    │       │   ├── tui/ (overview, keys, screens/*)
    │       │   ├── cli/ (overview + по командам)
    │       │   ├── slash-commands/ (overview + reference)
    │       │   ├── capabilities/ (tools, skills, sandbox, telemetry, context)
    │       │   ├── examples/ (weather, financier, demo-scenarios)
    │       │   └── reference/ (config-keys, keybindings, faq, glossary)
    │       ├── carl/                      # EN — топик CARL
    │       │   ├── getting-started/ (quick-start, getting-started, install)
    │       │   ├── concepts/ (what-is, chain-format, context, result, dag, rag, i18n)
    │       │   ├── steps/ (overview + страница на каждый тип шага)
    │       │   ├── chains/ (builder, from-description, dynamic-refs, search)
    │       │   ├── async/ (execution, streaming, callbacks, cancellation)
    │       │   ├── memory/ (layers, cow, ltm, schema, history)
    │       │   ├── replan/  evolution/  evaluation/  tracing/  llm/
    │       │   ├── orchestration/  skills/  mcp/  serialization/
    │       │   ├── cookbook/ (примеры по топикам)
    │       │   └── reference/ (api по модулям, changelog)
    │       └── ru/                         # RU-зеркало (index + care/ + carl/)
    ├── components/ (ProductChooser, Asciinema, ...)
    ├── styles/custom.css
    └── assets/
```

---

_Последнее обновление плана: 2026-06-09._
