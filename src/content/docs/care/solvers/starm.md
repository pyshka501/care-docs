---
title: STARM solvers
description: Hand sudoku, mazes, postfix arithmetic, Game of Life and ARC grids to small recursive reasoners served by STARM, with local answer checks.
sidebar:
  order: 2
---

Some sub-problems in a chain are algorithmic: fill a sudoku, find a path through a
maze, recover the operators of an arithmetic puzzle. An LLM step is unreliable at
these. Maestro can send them instead to small recursive reasoners (HRM, TRM and other
models trained with [STARM](https://github.com/ai-forever/STARM)) running on a GPU
server, and check the answer locally before the next step sees it.

The integration was ported from AIRI-MAESTRO/care#1 by Yuliana Shakhvalieva.

## The tools

Each task family is a separate builtin tool, so the chain generator picks one by
name. A tool exists only for a task that has a server port configured.

| Tool | `starm_ports` key | Input | Answer checked locally |
| --- | --- | --- | --- |
| `solve_sudoku(input_grid)` | `sudoku` | 81 cells; `.` or `0` for a blank | Yes: a full grid that keeps every given and has no repeat in any row, column or box |
| `solve_maze(input_maze)` | `maze` | Square grid of `#` (wall), space (open), one `S`, one `G` | Yes: a route from `S` to `G` through open cells, as short as the shortest one |
| `solve_arithmetic(input_expression)` | `arithmetic` | Postfix (RPN) expression with `?` for each unknown operator, then `=target` | Yes: the recovered operators, substituted back, reach the target |
| `solve_game_of_life(input_pattern, evolutions)` | `game_of_life` | Pattern in `o` / `b` / `$` (no run counts), or plaintext `.` / `O` rows | Yes: a B3/S23 simulation, up to translation (up to 10,000 evolutions) |
| `solve_arc_agi_1(input_grid, puzzle_id, few_shot)` | `arc_agi_1` | Grid rows, plus the task id or its demonstration pairs | Format only |
| `solve_arc_agi_2(input_grid, puzzle_id, few_shot)` | `arc_agi_2` | Same | Format only |

Arithmetic is **postfix**. An infix prompt such as `3?5=15` is rejected before any
request is sent.

## Connecting a STARM server

One STARM process serves one checkpoint, that is one task, so each task gets its own
port. STARM needs a CUDA GPU with `flash-attn` installed on the server.

```bash
# in a STARM checkout, on the GPU host
pip install -r api/requirements.txt
./host_model --path_directory checkpoints/sudoku/<run>     --device cuda:0 --port 8080 &
./host_model --path_directory checkpoints/arithmetic/<run> --device cuda:1 --port 8081 &
```

Public HRM checkpoints from the Hugging Face Hub also work, for example
`--path_directory sapientinc/HRM-checkpoint-sudoku-extreme --seq-len 81`.

Each server exposes two endpoints that Maestro uses:

- `GET /info` — which task the checkpoint serves, its architecture, the recursion
  step limit and, for mazes, the sequence length (grid size).
- `POST /generate` — one prompt in, one answer out.

### Configuration

In `~/.config/care/config.toml` (or `./care.toml`):

```toml
[tools]
starm_host = "http://gpu-01"   # no port: each task adds its own
starm_timeout = 120            # seconds per call (default 120)

[tools.starm_ports]
sudoku = 8080
arithmetic = 8081
```

Or with environment variables:

```bash
CARE_TOOLS__STARM_HOST=http://gpu-01
CARE_TOOLS__STARM_PORTS=sudoku=8080,arithmetic=8081    # a JSON object also works
CARE_TOOLS__STARM_TIMEOUT=120
```

- `starm_host` defaults to `http://localhost`.
- Valid keys: `sudoku`, `maze`, `arithmetic`, `game_of_life`, `arc_agi_1`,
  `arc_agi_2`. ARC-AGI-1 and ARC-AGI-2 are separate checkpoints on separate ports.
- An unknown key or an unusable port is dropped with a warning; Maestro still starts,
  that task just gets no tool.
- With `starm_ports` empty, no solver tool exists and nothing changes.
- The solvers are builtin tools: `tools.enable_builtins = false` turns them off
  together with the other builtins.

### Check the setup

```bash
maestro doctor
```

`doctor` calls `GET /info` on every configured server and prints `ok`, `misrouted`
(the server serves another task; usually swapped ports) or `unreachable` per tool.
See [Setup commands](/care/cli/setup/#maestro-doctor).

## What one call does

1. **Parses the arguments locally.** A malformed prompt fails here, before any
   request: an infix arithmetic expression, a maze without `S`, a sudoku that is not
   81 cells, a non-rectangular ARC grid.
2. **Sends one `POST /generate`** to the task's server.
3. **Checks the answer** where the task allows it (see the table above).
4. **Returns** the answer, then `Checked: …` or `Not checked: …`, and the number of
   recursion steps the model took.

### Failures

What a failure looks like depends on where the chain runs.

**In the desktop app** (native chain execution in strict mode), failures are typed
errors, so a chain step never succeeds on a missing or disproved answer:

| Error | When |
| --- | --- |
| `MAESTRO_STARM_INVALID_INPUT` | The arguments cannot be turned into a prompt, or the server rejected its format. |
| `MAESTRO_STARM_UNAVAILABLE` | No server, an HTTP error, or a server for another task. |
| `MAESTRO_STARM_ANSWER_REJECTED` | The server answered and the local check proved the answer wrong. |

**On the CLI and in the Python library**, the same failures come back as readable
text for the next LLM step. A disproved answer is returned with
`REJECTED by a local check: <reason>. Do not use this answer as correct.`

## Limits

- **ARC solves only tasks the checkpoint was trained on.** The checkpoint keeps each
  task in a learned puzzle embedding chosen by `puzzle_id`; a new task has none. A
  caller that has the demonstrations but not the id can pass them as `few_shot`, and
  Maestro looks the id up in bundled indexes (960 ARC-AGI-1 tasks including
  ConceptARC, 1,120 ARC-AGI-2 tasks). The lookup needs the complete set of a task's
  demonstrations. ARC answers cannot be checked, so treat them as proposals.
- **A maze checkpoint knows one grid size** (30×30 for the published one).
  `solve_maze` reads the size from `GET /info`, walls a smaller maze in to that size
  and crops the answer back. A larger maze is refused. Small mazes are still out of
  distribution: on the 30×30 checkpoint, 40 random mazes of 5×5 to 20×20 were solved
  0/40 when sent as-is and 20/40 when walled in.
- **Other tasks accept only their training formats:** 9×9 sudoku, single-digit
  postfix arithmetic, small Life patterns.
- **Deployed agents do not ship these tools.** The deploy gate flags a chain that
  needs them.

## Measured results

Measured on 2026-10-05: public HRM checkpoints served by STARM
(ai-forever/STARM@38c65c6) on one H200 GPU with flash-attn 2.8.3, called through
these tools, on seeded samples of the HRM test sets.

| Set | Sample | Model correct | Wrong answers caught by the check | Correct answers rejected |
| --- | --- | --- | --- | --- |
| sudoku-extreme | 1,000 | 51.9% | 481 / 481 | 0 |
| maze-30x30-hard | 200 | 77.5% | 45 / 45 | 0 |

For mazes, 68.5% matched the dataset's path exactly and 9% were another shortest
path. Median latency per call was 0.14 s (sudoku) and 0.07 s (maze).

The local check caught every wrong answer in both samples and rejected no correct
one. The model itself is wrong often on hard sudoku; the check is what keeps those
answers out of the chain.

End to end, the chain generator (OpenRouter, fast mode) turned Russian requests for a
sudoku and a maze into chains that called `solve_sudoku` / `solve_maze` with
correctly formatted inputs, and those chains ran 3/3 steps in the app's strict mode
against the H200 servers. That was one generation per task: it shows the path works,
not how often the generator gets it right.

**Not verified:** the arithmetic, Game of Life and ARC checkpoints have not been run
through these tools. Their parsers and checks are covered by unit tests only.
