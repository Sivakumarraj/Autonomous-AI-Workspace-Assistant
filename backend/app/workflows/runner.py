"""
Executes a planned workflow, step by step, in the background.

Progress is written to the database as each step finishes rather than at the
end, so the UI can poll and watch the run advance. A step failure stops the
run and is recorded on both the step and the workflow.
"""

from __future__ import annotations

import asyncio
from dataclasses import asdict
from functools import partial

from anyio import to_thread

from app.core.logging import get_logger
from app.database import workflow_db
from app.database.logs_db import add_log
from app.workflows.planner import plan_workflow
from app.workflows.step_catalog import run_step

logger = get_logger(__name__)

# Guards against the same workflow being started twice concurrently, which
# would interleave two runs writing to the same step rows.
_running: set[int] = set()

# How much of each step's output is carried into the next step's prompt.
CONTEXT_PER_STEP = 1500


class WorkflowRunner:
    async def run(self, workflow_id: int) -> None:
        """Plan and execute a workflow. Safe to call as a background task."""
        if workflow_id in _running:
            logger.info("Workflow %s is already running, ignoring", workflow_id)
            return

        _running.add(workflow_id)
        try:
            await self._run(workflow_id)
        except Exception as exc:
            logger.exception("Workflow %s crashed", workflow_id)
            await to_thread.run_sync(
                workflow_db.mark_finished, workflow_id, "failed", str(exc)
            )
        finally:
            _running.discard(workflow_id)

    async def _run(self, workflow_id: int) -> None:
        workflow = await to_thread.run_sync(workflow_db.get_workflow, workflow_id)
        if workflow is None:
            logger.warning("Workflow %s vanished before it could run", workflow_id)
            return

        name = workflow["name"]
        logger.info("Planning workflow %s (%s)", workflow_id, name)

        # to_thread.run_sync takes positional arguments only, hence partial.
        await to_thread.run_sync(
            partial(workflow_db.update_workflow, workflow_id, status="planning")
        )

        planned = await plan_workflow(name, workflow["description"])

        steps = await to_thread.run_sync(
            workflow_db.replace_steps,
            workflow_id,
            [asdict(step) for step in planned],
        )

        await to_thread.run_sync(workflow_db.mark_running, workflow_id)
        add_log("workflow", f"Started “{name}” ({len(steps)} steps)")

        context_parts: list[str] = []

        for step in steps:
            # A pause or delete mid-run should stop the loop.
            current = await to_thread.run_sync(workflow_db.get_workflow, workflow_id)
            if current is None:
                logger.info("Workflow %s deleted mid-run, stopping", workflow_id)
                return
            if current["status"] == "paused":
                add_log("workflow", f"“{name}” paused mid-run")
                return

            await to_thread.run_sync(workflow_db.start_step, step["id"])

            try:
                output = await run_step(
                    step["action"], step["params"], "\n\n".join(context_parts)
                )
            except KeyError:
                # Should be unreachable: the planner validates actions against
                # the catalog before they are stored.
                message = f"Unknown action “{step['action']}”"
                await to_thread.run_sync(workflow_db.finish_step, step["id"], "", message)
                await to_thread.run_sync(
                    workflow_db.mark_finished, workflow_id, "failed", message
                )
                add_log("workflow", f"“{name}” failed: {message}", "error")
                return
            except Exception as exc:
                message = str(exc)
                logger.exception("Step %s failed", step["action"])
                await to_thread.run_sync(workflow_db.finish_step, step["id"], "", message)
                await to_thread.run_sync(
                    workflow_db.mark_finished, workflow_id, "failed", message
                )
                add_log("workflow", f"“{name}” failed at {step['action']}", "error")
                return

            await to_thread.run_sync(workflow_db.finish_step, step["id"], output, "")
            await to_thread.run_sync(workflow_db.bump_steps_done, workflow_id)

            context_parts.append(f"[{step['title']}]\n{output[:CONTEXT_PER_STEP]}")

            # Yield so a polling request is served promptly between steps.
            await asyncio.sleep(0)

        await to_thread.run_sync(workflow_db.mark_finished, workflow_id, "completed")
        add_log("workflow", f"Completed “{name}”", "success")
        logger.info("Workflow %s completed", workflow_id)


workflow_runner = WorkflowRunner()
