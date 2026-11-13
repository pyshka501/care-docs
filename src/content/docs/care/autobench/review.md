---
title: Review, edit and compose
description: Working with a generated dataset in the Maestro app — reviewing and editing cases, adding your own, moving cases between search and holdout, composing family proportions, saving versions, generating missing cases, and editing a generator program.
sidebar:
  order: 4
---

Everything on this page except **generating missing cases** and **asking the
model to change a generator** works without model calls and costs nothing.
You can do it while a run is going or after it has finished.

## Cases

The **Cases** tab (*Примеры*) groups cases as **Accepted** (*Принятые*),
**Rejected** (*Отклонённые*), **Unverified** (*Без проверки*), **Excluded**
(*Исключённые*) and **Stale** (*Устаревшие*), with a family filter and a
search over input and reference. Each case shows its family, difficulty, part,
[verification level](/care/autobench/checks/#verification-levels), the
reference, the blind solver's answer when it differs, and the reasons for a
rejection.

Holdout cases are listed, but their references are hidden: *Эталон закрытой
части скрыт*.

| Button | Effect |
| --- | --- |
| **Edit** (*Изменить*) | Change the input fields, the reference and the accepted alternatives (one per line), or the part. **Save (checked by me)** (*Сохранить (проверено мной)*) makes the case accepted at level `manual`. A generated file itself cannot be edited. For a holdout case the old reference stays hidden; type a new one to replace it. |
| **Accept as is** (*Принять как есть*) | For rejected, unverified and stale cases. Level `manual`. |
| **Exclude** (*Исключить*) / **Restore** (*Вернуть*) | Remove from the dataset, kept for history. Restore runs the checks again. |
| **To holdout** / **To search** (*В закрытую часть* / *В поисковую часть*) | Move an accepted case between parts. |
| **Add case** (*Добавить пример*) | Write a case by hand: family, input fields, reference, alternatives, part. It is accepted at level `manual`. A duplicate of an existing case is refused. |

You are the verifier of what you write or accept: Maestro does not re-check a
manual case.

## Proportions

The **Proportions** tab (*Пропорции*) plans a dataset version from accepted
cases. For each family it shows the share (slider), how many cases exist
(*Есть*), how many are needed (*Нужно*), the deficit (*Не хватает*) and the
part (*Часть*: search or holdout).

- **Version size** (*Размер версии*): 0–5000; defaults to all accepted cases.
- **Equal** (*Поровну*) sets equal shares; **As is** (*Как есть*) restores
  the current distribution.
- Changing the part of a family here changes it only for the saved version.
- When only part of a family is taken, stronger evidence goes first: manual,
  then cross-checked, judged, judge-model.

The preview updates as you move sliders. **Save dataset version**
(*Сохранить версию набора*) stores it as a new version; its provenance notes
that the composition was set by hand.

### Generating missing cases

When a family falls short, the tab offers:

- **Generate missing N (paid)** (*Догенерировать недостающие N (платно)*) for
  model-written datasets. This *extends* the run: new batches only for the
  short families, up to 200 cases per family per request, and the target is
  raised to cover them. It is available for a run that is finished, stopped,
  failed, paused or waiting. Progress shows on **Overview**. The button does
  not raise the token budget: if the run has already spent it, the run ends
  again at once with *budget reached* (by code). In that case ask the agent to
  extend the run with extra tokens (`extra_tokens`).
- **Generate missing N (free)** (*Сгенерировать недостающие N (бесплатно)*)
  for generator programs. The program runs locally; no model calls.

From the screen this needs no dialog. When the agent extends a run, the app
asks first, because extending adds paid calls and can raise the budget. See
[Agent tools](/care/autobench/tools/).

## Versions

The **Versions** tab (*Версии*) lists dataset versions, newest first. Each
version shows its id (`bf_<16 hex>.v<N>`), date, number of search and holdout
cases, the check, the number of hand edits, whether the composition was set by
hand, and how many cases are at each verification level.

A version is saved automatically when a run ends, and by **Save dataset
version**. Saving the same content twice does not create a new version.

**Use for evolution** (*Использовать для эволюции*) appears when the version
can be evolved on. See [Use a dataset for evolution](/care/autobench/evolution/).

## Generator code

For datasets built with **Model writes a generator** the **Generator** tab
(*Генератор*) shows the program, its version and whether the model or you
wrote it.

| Action | Cost |
| --- | --- |
| Edit the code, **Check on 10 cases** (*Проверить на 10 примерах*) | Free: runs in the local sandbox and shows a preview table and problems. |
| **Save code** (*Сохранить код*) | Free: a new program version written by you. |
| Ask the model to change it, **Change (1 call)** (*Изменить (1 вызов)*) | One model call. The new code is shown with a preview; save it to keep it. |
| **How many cases to add** (*Сколько примеров добавить*) → **Generate** (*Сгенерировать*) | Free. Disabled while there are unsaved edits. |

Generated cases still go through the deterministic checks. Generating more is
not possible while the run is still working.
