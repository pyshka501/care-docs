---
title: Solvers overview
description: Specialised solver tools that take algorithmic sub-problems off the LLM and check their own answers.
sidebar:
  order: 1
---

A **solver** is a builtin tool that hands one narrow, algorithmic sub-problem to a
specialised model instead of an LLM step, and checks the answer before the chain uses
it. Solvers fit tasks where an LLM is unreliable but a correct answer is easy to
verify: logic puzzles, path finding, operator recovery, cellular automata.

Maestro ships one solver family:

| Family | Tools | Runs on | Page |
| --- | --- | --- | --- |
| STARM | `solve_sudoku`, `solve_maze`, `solve_arithmetic`, `solve_game_of_life`, `solve_arc_agi_1`, `solve_arc_agi_2` | Your STARM servers (CUDA GPU) | [STARM solvers](/care/solvers/starm/) |

## How solvers fit into a chain

- **Opt-in per task.** A solver tool exists only when you configure a server for its
  task. With nothing configured, chains, generation and runs behave exactly as
  without solvers.
- **Chosen by the generator.** Configured solvers are advertised to the chain
  generator like other builtin tools, so a request such as "solve this sudoku"
  can produce a chain with a `solve_sudoku` step. You can also reference the tool in
  a chain you write by hand.
- **Checked answers.** Where the task allows it, the tool verifies the answer locally
  and says so (`Checked: …`). In the desktop app a disproved or missing answer is a
  typed error that fails the step; on the CLI it is returned as text marked
  `REJECTED by a local check`.
- **Diagnosed by `maestro doctor`.** It probes every configured solver server and
  reports whether it is up and serving the right task.
- **Not deployed.** Agents deployed to the agent hub do not include solver tools.

## Where to go next

- [STARM solvers](/care/solvers/starm/) — tools, server setup, configuration, error
  codes, limits and measured accuracy.
- [Setup commands](/care/cli/setup/#maestro-doctor) — the `doctor` probe output.
