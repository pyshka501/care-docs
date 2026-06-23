# /// script
# requires-python = ">=3.9"
# dependencies = []
# ///
"""One-command installer for the **Maestro** agent skill.

Downloads the skill bundle and unpacks it into your agent's skills directory
(Claude Code: ~/.claude/skills, hermes: ~/.hermes/skills). Stdlib only.

Run it with uv (no clone, no manual unzip):

    uv run https://raw.githubusercontent.com/pyshka501/care-docs/main/public/install.py
    uv run https://raw.githubusercontent.com/pyshka501/care-docs/main/public/install.py -- --target both

Or without uv:

    curl -fsSL https://raw.githubusercontent.com/pyshka501/care-docs/main/public/install.py | python3 - --target claude

This installs the *skill* (so Claude Code / hermes can drive Maestro). The Maestro
CLI itself is set up separately with `uvx care-install`.
"""
from __future__ import annotations

import argparse
import io
import os
import shutil
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

NAME = "maestro"
DEFAULT_URL = "https://raw.githubusercontent.com/pyshka501/care-docs/main/public/maestro.skill"

CLAUDE = Path.home() / ".claude" / "skills"
HERMES = Path.home() / ".hermes" / "skills"


def resolve_targets(choice: str) -> list[Path]:
    if choice == "claude":
        return [CLAUDE]
    if choice == "hermes":
        return [HERMES]
    if choice == "both":
        return [CLAUDE, HERMES]
    if choice == "auto":
        hits = [p for p in (CLAUDE, HERMES) if p.parent.exists()]
        return hits or [CLAUDE]
    # otherwise treat as an explicit skills directory
    return [Path(choice).expanduser()]


def fetch(url: str) -> bytes:
    print(f"↓ downloading {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "maestro-skill-installer"})
    with urllib.request.urlopen(req, timeout=60) as r:  # noqa: S310 (trusted URL / user-supplied)
        return r.read()


def safe_members(zf: zipfile.ZipFile) -> list[str]:
    names = zf.namelist()
    top = {n.split("/", 1)[0] for n in names if n.strip()}
    if top != {NAME}:
        raise SystemExit(f"install: unexpected bundle layout (top-level {sorted(top)}, want '{NAME}/')")
    for n in names:
        if n.startswith("/") or ".." in Path(n).parts:
            raise SystemExit(f"install: refusing unsafe path in bundle: {n}")
    return names


def install_into(skills_dir: Path, data: bytes) -> Path:
    skills_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        safe_members(zf)
        dest = skills_dir / NAME
        if dest.exists():
            bak = skills_dir / f"{NAME}.bak"
            shutil.rmtree(bak, ignore_errors=True)
            dest.replace(bak)
            print(f"  • replaced existing {dest} (previous kept at {bak})")
        with tempfile.TemporaryDirectory() as tmp:
            zf.extractall(tmp)
            shutil.move(str(Path(tmp) / NAME), str(dest))
    return dest


def main() -> int:
    ap = argparse.ArgumentParser(description="Install the Maestro agent skill.")
    ap.add_argument("--target", default="auto",
                    help="claude | hermes | both | auto (default) | a skills directory path")
    ap.add_argument("--url", default=os.environ.get("MAESTRO_SKILL_URL", DEFAULT_URL),
                    help="Override the bundle URL.")
    args = ap.parse_args()

    targets = resolve_targets(args.target)
    try:
        data = fetch(args.url)
    except Exception as e:  # noqa: BLE001
        print(f"install: download failed: {e}", file=sys.stderr)
        return 1

    installed: list[Path] = []
    for sd in targets:
        try:
            installed.append(install_into(sd, data))
            print(f"✓ installed → {installed[-1]}")
        except SystemExit:
            raise
        except Exception as e:  # noqa: BLE001
            print(f"install: failed for {sd}: {e}", file=sys.stderr)

    if not installed:
        return 1

    print("\nDone. Maestro skill installed.")
    for d in installed:
        if ".hermes" in str(d):
            print(f"  • hermes: run `/skills` to confirm, invoke with `/maestro`.")
        elif ".claude" in str(d):
            print(f"  • Claude Code: the skill triggers automatically on Maestro tasks.")
    print("\nThe Maestro CLI itself (the `care` command) is set up separately:")
    print("  uvx care-install")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
