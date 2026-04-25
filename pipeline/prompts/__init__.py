"""
Prompt loader.

Each prompt lives in `pipeline/prompts/<name>.<version>.md` (e.g.
`daily_digest.v1.md`). The filename without `.md` is the version string
that gets stored alongside the digest record.

Iterating on a prompt: copy `<name>.v1.md` → `<name>.v2.md`, edit, change
the loader argument in the processor, deploy. The old version stays on
disk for diff / rollback.
"""
from pathlib import Path

_PROMPT_DIR = Path(__file__).parent


def load_prompt(name: str) -> tuple[str, str]:
    """Return (text, version_string). `name` is the filename without `.md`."""
    path = _PROMPT_DIR / f"{name}.md"
    return path.read_text(), name
