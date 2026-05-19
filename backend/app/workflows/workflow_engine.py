from app.tools.file_tool import list_uploaded_files
from app.tools.terminal_tool import run_terminal_command
from app.agents.planner_agent import planner_agent


class WorkflowEngine:

    async def execute(self, task: str):

        plan = await planner_agent.create_plan(
            task
        )

        results = []

        for step in plan:

            # FILE LISTING
            if step == "list_files":

                files = list_uploaded_files()

                results.append({
                    "step": step,
                    "output": files
                })

            # TERMINAL
            elif step == "execute_terminal":

                command = task.replace(
                    "run command",
                    ""
                ).strip()

                result = run_terminal_command(
                    command
                )

                results.append({
                    "step": step,
                    "output": result
                })

            # GENERAL CHAT
            elif step == "general_chat":

                return {
                    "workflow": "unknown",
                    "result": None
                }

        return {
            "workflow": "planned_execution",
            "result": results
        }


workflow_engine = WorkflowEngine()