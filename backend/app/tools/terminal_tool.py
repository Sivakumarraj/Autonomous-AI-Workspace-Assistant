"""Terminal tool - Execute shell commands"""

import subprocess
from typing import Dict, Any


class TerminalTool:
    async def execute(self, command: str, timeout: int = 30) -> Dict[str, Any]:
        """Execute a shell command (sandboxed)"""
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True, timeout=timeout
            )
            return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
        except subprocess.TimeoutExpired:
            return {"error": "Command timed out", "returncode": -1}
