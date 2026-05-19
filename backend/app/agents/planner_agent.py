class PlannerAgent:

    async def create_plan(self, task: str):

        task = task.lower()

        # Resume analysis workflow
        if "resume" in task and "skills" in task:

            return [
                "find_uploaded_files",
                "retrieve_resume",
                "extract_skills",
                "save_skills_memory"
            ]

        # File listing workflow
        if "show uploaded files" in task:

            return [
                "list_files"
            ]

        # Terminal workflow
        if task.startswith("run command"):

            return [
                "execute_terminal"
            ]

        return [
            "general_chat"
        ]


planner_agent = PlannerAgent()