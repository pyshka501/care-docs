---
title: Launching interfaces
description: Open the Maestro desktop app, the terminal UI or the local browser interface from the command line.
sidebar:
  order: 1.5
---

Maestro has three interactive front ends. All of them read the same config and the
same Memory, so a chain saved in one is visible in the others.

| Command | Opens | Status |
| --- | --- | --- |
| `maestro` or `maestro app` | Desktop app built around the Maestro harness | Primary interface |
| `maestro tui` | Textual terminal UI | Supported secondary interface |
| `maestro web` | Local browser interface | Developer tool, loopback only |

The `maestro-app` console script is the same as `maestro app`.

## `maestro app`

Opens the desktop app in a native window and runs until you close it. With no
subcommand at all, `maestro` does the same. Inside the app the Maestro harness drives
generation, execution, evolution, Memory, IdeaL and the STARM solvers through its own
tools; see the Desktop App section of these docs.

```bash
maestro app
maestro app --width 1440 --height 900
maestro app --debug                 # WebView developer diagnostics
maestro app --legacy-workbench      # the previous workbench UI
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--width N` | `1280` | Initial window width in logical pixels. |
| `--height N` | `820` | Initial window height in logical pixels. |
| `--debug` | off | Enable native WebView developer diagnostics. |
| `--legacy-workbench` | off | Launch the previous workbench instead of the harness. |
| `--port N` | `0` | Loopback port, **only** with `--legacy-workbench`. The harness always picks a private ephemeral port; any other value without `--legacy-workbench` exits `2`. |

The window must be at least 920×620; a smaller `--width` / `--height` fails to start.
The app needs the `desktop` extra (it is included in the packaged macOS app).

### Developer flags for the harness

By default the app finds the harness that ships with it and checks that its version
is the pinned one. Three developer flags change that. They are meant for people
building Maestro itself:

```bash
maestro app --dsh-executable /path/to/harness-binary   # use this executable
maestro app --dsh-source /path/to/built-checkout       # or a built source checkout
maestro app --dsh-home /path/to/private-state-dir      # private state directory
maestro app --allow-dsh-version-drift                  # run an unpinned version
```

`--dsh-executable` and `--dsh-source` are mutually exclusive. With
`--allow-dsh-version-drift` compatibility is not guaranteed.

Exit codes: `0` after a normal close, `2` when the app cannot load or start, `130`
on Ctrl+C.

## `maestro tui`

Opens the Textual terminal UI in the current terminal. It takes no flags. See
[The TUI](/care/tui/overview/).

```bash
maestro tui
```

## `maestro web`

Serves the local browser interface and opens a browser tab. It is a developer
launcher, not a replacement for the desktop app, and binds only to a loopback
address.

```bash
maestro web                          # http://127.0.0.1:8787
maestro web --port 0 --no-open       # any free port, no browser tab
```

| Flag | Default | Purpose |
| --- | --- | --- |
| `--host` | `127.0.0.1` | Loopback address: `127.0.0.1`, `localhost` or `::1`. |
| `--port` | `8787` | TCP port; `0` picks a free one. Must be 0–65535. |
| `--no-open` | off | Start the server without opening a browser tab. |

Stop it with Ctrl+C (exit code `130`).
