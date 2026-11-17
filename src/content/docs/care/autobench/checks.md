---
title: Checks and verification
description: The autobench check methods and when to pick each, how every case is verified (deterministic checks, blind solve, judge), the verification levels shown in the app, and how a check becomes the evolution evaluator.
sidebar:
  order: 3
---

A check answers one question: does an agent's answer match the hidden
reference? You pick the method in the wizard (**Check method**, *Метод
проверки*). The same rule is used twice: first to verify the generated cases,
then, translated to the evolution platform's evaluator, to score candidate
chains.

## Check methods

| Method (app label) | Answer is correct when | Pick it for |
| --- | --- | --- |
| **Auto** (*Авто*) | The spec stage chooses one of the methods below. | You are unsure. If the model finds no reliable programmatic check, it picks the judge instead of forcing a pattern onto free text. |
| **Judge model** (*Судья-модель*) | A judge call decides against your criterion. | Free-form answers: explanations, summaries, reasoning. Write the **Criterion for the judge**. |
| **Exact match** (*Точное совпадение*) | The whole answer equals the reference (or an accepted alternative) after normalization: Unicode NFKC, case folding, punctuation to spaces. | Short canonical answers: a name, a code, a date in a fixed format. |
| **Label from a list** (*Метка из списка*) | The answer is one of a closed set of labels and equals the reference. | Classification. Give the labels, or leave the field empty and the model proposes them. |
| **Number** (*Число*) | The first number in the answer differs from the reference by at most the tolerance. Spaces and a decimal comma are tolerated. | Sums, counts, measurements. |
| **Regex** (*Регулярное выражение*) | Group 1 of your pattern in the answer equals group 1 in the reference (case-insensitive search). | An answer embedded in text with a marker, e.g. `Итого:\s*([\d.,]+)`. Read the caveat [below](#how-a-check-becomes-the-evolution-evaluator) before using it for evolution. |
| **JSON field** (*Поле JSON*) | The answer is JSON (a fenced block is fine) and one named field equals the reference's field. | Structured output where one field matters. One field only. |
| **Contains all parts** (*Содержит все части*) | The answer contains every part of the reference; parts are separated by `\|`. | Lists of required items in any order. |

Your choice overrides the model's. Some choices are corrected when the spec
cannot support them: **Label from a list** without labels becomes **Exact
match**; **JSON field** without a field and **Regex** without a pattern become
**Judge model** (the wizard requires a pattern for **Regex**).

**Description of a correct answer** (*Описание правильного ответа*) is always
optional. With a programmatic method it is a hint for the spec and goes into
the success criterion; with **Judge model** it is the rubric.

### Tolerance

Only the tolerance you enter is used. A tolerance the model proposes on its
own (for example 0.01 for money) is dropped, because a non-zero tolerance has
no exact counterpart on the evolution platform. If you enter one yourself, the
cases are still verified with it here, and the dataset is exported for
evolution with a judge rubric instead of an exact match. See
[How a check becomes the evolution evaluator](#how-a-check-becomes-the-evolution-evaluator).

## How a case is verified

When the model writes cases:

1. **Deterministic checks.** The input has exactly the contract fields (plus
   `file` for file runs), is not empty, has no field over 6,000 characters,
   does not leak words like "expected", "gold", "эталон", and does not contain
   the rationale. The reference is in the label set if there is one. The case
   is not a rename of an accepted case (same text with other names or numbers).
   The reference passes its own check, and deliberately wrong answers
   (including the empty answer) fail it.
2. **Blind solve.** The model solves the case again without seeing the
   reference or the rationale.
3. **Judge.** A separate call checks the reference against the task and the
   criterion. It runs for every case with **Judge model**, and for
   programmatic checks only where the blind solve disagreed.

With a generator program, references are computed by code, each case still
passes step 1, and the program as a whole is audited by a blind-solve sample
(see [Generator program](/care/autobench/generate/#generator-program)).

:::note
The blind solver and the judge are the same provider and model as the
generator. They catch many wrong references, but they are not independent of
the generator's own blind spots.
:::

## Verification levels

Every case shows a level in **Cases** and in the version's provenance.

| Level | App text | Meaning |
| --- | --- | --- |
| `cross_checked` | *подтверждён независимым решением* | The blind solve matched the reference. |
| `judged` | *решатель ошибся, судья подтвердил эталон* | The blind solve disagreed; the judge upheld the reference. |
| `llm_judge` | *проверен моделью-судьёй* | Judge method: the judge upheld the reference. |
| `program` | *эталон вычислен программой* | Computed by the generator program. |
| `manual` | *проверен вами* | You wrote, edited or accepted it. |
| `executable` | *без подтверждения эталона* | The check works, but the reference was not confirmed. Not accepted. |

Outcomes:

- **Accepted** (*Принятые*): confirmed; goes into versions.
- **Rejected** (*Отклонённые*): failed a check, or the judge said the
  reference is wrong. The reasons are shown on the case.
- **Unverified** (*Без проверки*): could not be confirmed (no solver answer,
  or the judge gave no verdict). Not in the dataset unless you accept it.
- **Stale** (*Устаревшие*): no longer fits a newer spec.
- **Excluded** (*Исключённые*): removed by you, kept for history.

## How a check becomes the evolution evaluator

| Check | Evolution evaluator |
| --- | --- |
| Exact match, Label from a list, Number with tolerance 0 | `binary_match`, `equality` |
| Regex | `binary_match`, `regexp` with your pattern |
| JSON field | `binary_match`, `regexp` that extracts that field |
| Judge model, Number with tolerance > 0, Contains all parts | rubric: `LLM judge (0..1)` with the exported rubric |

Things to know:

- With an equality evaluator the platform compares text, not numbers: a chain
  that prints `1105.0` where the reference is `1105` can fail. Fix the number
  format in **Answer format**.
- **Regex with a marker is risky for evolution** (from reading the code, not
  measured). Here the reference itself must match the pattern, so with
  `Итого:\s*([\d.,]+)` the reference is `Итого: 1105`. The platform extracts
  group 1 from the chain's answer (`1105`) but compares it with the whole
  reference, so such a dataset can score every candidate 0. Until this is
  fixed, prefer **Number** or **Exact match** with a fixed **Answer format**,
  or a pattern whose group 1 is the whole reference.
- A rubric evaluator calls a judge model on every sampled row of every
  evaluation, so evolution costs more. It needs an evolution platform build
  that supports the LLM judge; an older platform refuses the start with
  `llm_judge_unsupported`.
- Tasks with tools export as `stateful_env` and cannot be used for evolution
  yet.
