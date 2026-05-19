import subprocess


ALLOWED_COMMANDS = [
    "dir",
    "ls",
    "pwd",
    "python",
    "pip"
]


def run_terminal_command(command: str):

    if not any(
        command.startswith(cmd)
        for cmd in ALLOWED_COMMANDS
    ):

        return "Command not allowed."

    try:

        result = subprocess.check_output(
            command,
            shell=True,
            text=True
        )

        return result

    except Exception as e:

        return str(e)