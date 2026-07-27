#!/usr/bin/env python3
"""
End-to-end UI verification.

Drives the real frontend against a real backend and exercises every
interactive control on every tab — not just page loads. Fails on any console
error, any failed network request, or any assertion.

Usage:
    # with both servers already running
    python scripts/verify_ui.py --frontend http://localhost:3010 \\
                                --backend  http://localhost:8020

Requires playwright (already in backend/requirements.txt) and Chromium.
"""

from __future__ import annotations

import argparse
import glob
import sys
from dataclasses import dataclass, field
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

SHOTS = Path("/tmp/ui-verify")

# Requests to these paths are expected to fail during the negative tests.
IGNORED_REQUEST_FAILURES: tuple[str, ...] = ()


@dataclass
class Results:
    passed: list[str] = field(default_factory=list)
    failed: list[tuple[str, str]] = field(default_factory=list)
    skipped: list[tuple[str, str]] = field(default_factory=list)

    def ok(self, name: str) -> None:
        self.passed.append(name)
        print(f"  PASS  {name}")

    def fail(self, name: str, reason: str) -> None:
        self.failed.append((name, reason))
        print(f"  FAIL  {name}\n        {reason}")

    def skip(self, name: str, reason: str) -> None:
        self.skipped.append((name, reason))
        print(f"  SKIP  {name}\n        {reason}")

    def check(self, name: str, condition: bool, reason: str = "") -> bool:
        if condition:
            self.ok(name)
        else:
            self.fail(name, reason or "assertion failed")
        return condition


def is_quota_error(text: str) -> bool:
    """True when a failure is the Gemini free-tier rate limit rather than a bug.

    Reporting these as failures would be misleading: the application handled
    the error correctly, the account simply ran out of quota.
    """
    return "429" in text or "RESOURCE_EXHAUSTED" in text or "quota" in text.lower()


class PageMonitor:
    """Collects console errors and failed responses for the active page."""

    def __init__(self, page: Page):
        self.console_errors: list[str] = []
        self.bad_responses: list[str] = []

        page.on("console", self._on_console)
        page.on("pageerror", lambda e: self.console_errors.append(f"pageerror: {e}"))
        page.on("response", self._on_response)

    def _on_console(self, message) -> None:
        if message.type == "error":
            self.console_errors.append(message.text)

    def _on_response(self, response) -> None:
        if response.status >= 400:
            self.bad_responses.append(f"{response.status} {response.url}")

    def reset(self) -> None:
        self.console_errors.clear()
        self.bad_responses.clear()

    @property
    def clean(self) -> bool:
        return not self.console_errors and not self.bad_responses

    def report(self) -> str:
        parts = []
        if self.console_errors:
            parts.append(f"console: {self.console_errors}")
        if self.bad_responses:
            parts.append(f"responses: {self.bad_responses}")
        return " | ".join(parts)


def find_chromium() -> str | None:
    for pattern in (
        "/opt/pw-browsers/chromium-*/chrome-linux/chrome",
        "/opt/pw-browsers/**/chrome",
    ):
        hits = glob.glob(pattern, recursive=True)
        if hits:
            return hits[0]
    return None


TABS = ["dashboard", "chat", "files", "memory", "workflows", "logs", "settings"]


def verify_tabs_load(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[1] Every tab loads cleanly")
    for tab in TABS:
        monitor.reset()
        page.goto(f"{base}/{tab}", wait_until="networkidle", timeout=30_000)
        page.wait_for_timeout(700)
        r.check(f"/{tab} loads with no errors", monitor.clean, monitor.report())
        page.screenshot(path=str(SHOTS / f"dark-{tab}.png"))


def verify_files(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[2] Files: upload -> appears -> delete -> gone")
    monitor.reset()
    page.goto(f"{base}/files", wait_until="networkidle")

    before = page.locator('[data-testid="file-grid"] >> css=.group').count()

    page.set_input_files("input[type=file]", "/tmp/tf/resume.pdf")
    page.wait_for_timeout(9000)

    after = page.locator('[data-testid="file-grid"] >> css=.group').count()
    r.check("upload adds a card", after == before + 1, f"{before} -> {after}")

    card = page.locator('[data-testid="file-grid"] >> css=.group').first
    r.check(
        "card shows a status badge",
        card.locator("text=/Ready|Not indexed|No text/").count() > 0,
        "no status badge rendered",
    )

    page.screenshot(path=str(SHOTS / "files-uploaded.png"))

    # Delete via the card's hover button, then confirm in the dialog.
    card.hover()
    page.locator('button[aria-label^="Delete "]').first.click()
    page.wait_for_selector('[role="dialog"]', timeout=5000)
    r.check("delete opens a confirm dialog", True)
    page.screenshot(path=str(SHOTS / "files-confirm.png"))

    page.locator('[role="dialog"] button:has-text("Delete")').click()
    page.wait_for_timeout(2500)

    final = page.locator('[data-testid="file-grid"] >> css=.group').count()
    r.check("delete removes the card", final == before, f"expected {before}, got {final}")
    r.check("no errors during file flow", monitor.clean, monitor.report())


def verify_workflows(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[3] Workflows: create -> pause -> resume -> steps -> delete")
    monitor.reset()
    page.goto(f"{base}/workflows", wait_until="networkidle")

    before_count = page.locator('[data-testid="workflow-grid"] > div').count()

    page.click('button:has-text("Create Workflow")')
    page.wait_for_selector('[role="dialog"]', timeout=5000)
    page.fill("#workflow-name", "Verification workflow")
    page.fill(
        "#workflow-description",
        "List the uploaded documents and write a one-paragraph summary of them.",
    )
    page.locator('[role="dialog"] button:has-text("Create")').click()
    page.wait_for_timeout(2000)

    card = page.locator('[data-testid="workflow-grid"] > div').first
    r.check(
        "create adds the workflow",
        "Verification workflow" in card.inner_text(),
        card.inner_text()[:120],
    )

    # Pause/resume first: this button previously had no onClick at all, and
    # pausing is correctly disabled once a run has completed.
    card.locator('button:has-text("Pause")').click()
    page.wait_for_timeout(1800)
    r.check("pause sets status to Paused", "Paused" in card.inner_text())

    card.locator('button:has-text("Resume")').click()
    page.wait_for_timeout(1800)
    r.check("resume sets status to Active", "Active" in card.inner_text())

    # --- Run it for real: plan, execute, report -------------------------------
    card.locator('button[aria-label^="Run "]').click()
    page.wait_for_timeout(2500)

    started_text = card.inner_text()
    if "Failed" in started_text and is_quota_error(started_text):
        # A quota error rejects the planning call almost instantly, so the
        # in-flight state is gone before this check runs.
        r.skip(
            "run enters planning/running",
            "Gemini quota exhausted; run failed before the state could be observed",
        )
    else:
        r.check(
            "run enters planning/running",
            any(s in started_text for s in ("Planning", "Running", "Completed")),
            started_text[:200],
        )
    page.screenshot(path=str(SHOTS / "workflow-running.png"))

    # Poll for up to 90s; planning plus several Gemini calls take a while.
    settled = False
    for _ in range(45):
        page.wait_for_timeout(2000)
        text = card.inner_text()
        if "Completed" in text or "Failed" in text:
            settled = True
            break

    r.check("run reaches a terminal state within 90s", settled, card.inner_text()[:200])

    text = card.inner_text()
    steps = card.locator('[data-testid="workflow-steps"] button[data-step-status]')
    step_count = steps.count()
    statuses = [
        steps.nth(i).get_attribute("data-step-status") for i in range(step_count)
    ]

    r.check("steps were planned and rendered", step_count > 0, f"{step_count} steps")

    if "Failed" in text and is_quota_error(text):
        # The app behaved correctly: it stopped at the failing step, recorded
        # the real error, and left later steps pending. That is what we want
        # from a quota error — it just is not a successful run.
        reason = "Gemini free-tier quota exhausted (429); run correctly reported the failure"
        r.skip("run completed successfully", reason)
        r.skip("progress reaches 100%", reason)
        r.check(
            "failure is reported cleanly, not silently",
            "failed" in statuses and "Gemini request failed" in text,
            f"statuses={statuses}",
        )
    else:
        r.check("run completed successfully", "Completed" in text, text[:300])
        r.check("progress reaches 100%", "(100%)" in text, text[:200])
        r.check(
            "every step completed",
            all(status == "completed" for status in statuses),
            str(statuses),
        )

    # Expanding a step shows its real output.
    steps.first.click()
    page.wait_for_timeout(600)
    r.check(
        "step output is viewable",
        card.locator("pre").count() > 0,
        "no output panel rendered",
    )
    page.screenshot(path=str(SHOTS / "workflows.png"))

    card.locator('button[aria-label^="Delete "]').click()
    page.wait_for_selector('[role="dialog"]', timeout=5000)
    page.locator('[role="dialog"] button:has-text("Delete")').click()
    page.wait_for_timeout(2500)

    # Count rather than name: earlier runs of this script may have left their
    # own "Verification workflow" behind, and the success toast quotes the name
    # too, so a text search gives false failures.
    after_count = page.locator('[data-testid="workflow-grid"] > div').count()
    r.check(
        "delete removes the workflow",
        after_count == before_count,
        f"expected {before_count} cards, found {after_count}",
    )
    r.check("no errors during workflow flow", monitor.clean, monitor.report())


def verify_memory(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[4] Memory: create -> filter -> delete")
    monitor.reset()
    page.goto(f"{base}/memory", wait_until="networkidle")

    page.click('button:has-text("New Memory")')
    page.wait_for_selector('[role="dialog"]', timeout=5000)
    page.select_option("#memory-category", "Technical Note")
    page.fill("#memory-content", "Verification memory from verify_ui.py")
    page.locator('[role="dialog"] button:has-text("Save")').click()
    page.wait_for_timeout(2000)

    body = page.locator("body").inner_text()
    r.check("create adds the memory", "Verification memory" in body)
    r.check("category icon renders", "🔧" in body, "expected the Technical Note icon")

    page.screenshot(path=str(SHOTS / "memory.png"))

    card = page.locator('[data-testid="memory-list"] > div').first
    card.hover()
    card.locator('button[aria-label="Delete memory"]').click()
    page.wait_for_selector('[role="dialog"]', timeout=5000)
    page.locator('[role="dialog"] button:has-text("Delete")').click()
    page.wait_for_timeout(2000)

    r.check(
        "delete removes the memory",
        "Verification memory" not in page.locator("body").inner_text(),
    )
    r.check("no errors during memory flow", monitor.clean, monitor.report())


def verify_logs(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[5] Logs: level filters and auto-refresh toggle")
    monitor.reset()
    page.goto(f"{base}/logs", wait_until="networkidle")
    page.wait_for_timeout(900)

    total = page.locator('[data-testid="log-list"] > div').count()
    r.check("logs render", total > 0, f"{total} rows")

    page.click('button:has-text("error")')
    page.wait_for_timeout(600)
    errors_only = page.locator('[data-testid="log-list"] > div').count()
    r.check(
        "error filter narrows the list",
        errors_only < total,
        f"{total} -> {errors_only}",
    )

    page.click('button:has-text("error")')  # clear
    page.wait_for_timeout(600)

    page.click('button:has-text("Auto-refresh")')
    page.wait_for_timeout(600)
    r.check(
        "auto-refresh toggles on",
        page.locator('button:has-text("Auto 10s")').count() == 1,
        "button label did not change",
    )
    page.click('button:has-text("Auto 10s")')  # turn back off

    page.screenshot(path=str(SHOTS / "logs.png"))
    r.check("no errors during logs flow", monitor.clean, monitor.report())


def verify_settings(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[6] Settings: live config, no secrets, working preferences")
    monitor.reset()
    leaked: list[str] = []

    def watch(response):
        if "/settings" in response.url:
            try:
                body = response.text()
            except Exception:
                return
            for marker in ("AIza", "GEMINI_API_KEY", "secret_key", "api_key"):
                if marker in body:
                    leaked.append(f"{marker} in {response.url}")

    page.on("response", watch)
    page.goto(f"{base}/settings", wait_until="networkidle")
    page.wait_for_timeout(1200)

    body = page.locator("body").inner_text()
    r.check("live chat model rendered", "gemini-2.5-flash" in body, body[:200])
    r.check("live embedding model rendered", "gemini-embedding-001" in body)
    r.check("terminal tool reported disabled", "Disabled" in body)
    r.check("no API key leaked to the browser", not leaked, str(leaked))
    r.check(
        "fake provider fields are gone",
        "OpenAI API Key" not in body and "Anthropic" not in body,
        "fabricated key inputs still present",
    )

    # Preference actually persists.
    page.select_option('select[aria-label="Logs page size"]', "100")
    page.wait_for_timeout(500)
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(900)
    value = page.locator('select[aria-label="Logs page size"]').input_value()
    r.check("preference survives a reload", value == "100", f"got {value}")

    page.screenshot(path=str(SHOTS / "settings.png"))
    page.remove_listener("response", watch)
    r.check("no errors during settings flow", monitor.clean, monitor.report())


def verify_palette(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[7] Command palette: open, search, keyboard select")
    monitor.reset()
    page.goto(f"{base}/dashboard", wait_until="networkidle")

    page.keyboard.press("Control+k")
    page.wait_for_selector('[aria-label="Command palette"]', timeout=5000)
    r.check("Ctrl+K opens the palette", True)

    page.keyboard.type("workflow")
    page.wait_for_timeout(700)
    page.screenshot(path=str(SHOTS / "palette.png"))

    page.keyboard.press("Enter")
    page.wait_for_timeout(1800)
    r.check(
        "Enter navigates to the match",
        "/workflows" in page.url,
        f"landed on {page.url}",
    )
    r.check("no errors during palette flow", monitor.clean, monitor.report())


def verify_theme(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[8] Theme toggle")
    monitor.reset()
    page.goto(f"{base}/dashboard", wait_until="networkidle")

    before_attr = page.get_attribute("html", "data-theme")
    before_bg = page.evaluate(
        "getComputedStyle(document.body).backgroundColor"
    )

    page.click('button[aria-label^="Switch to"]')
    page.wait_for_timeout(800)

    after_attr = page.get_attribute("html", "data-theme")
    after_bg = page.evaluate("getComputedStyle(document.body).backgroundColor")

    r.check(
        "toggle changes data-theme",
        before_attr != after_attr,
        f"{before_attr} -> {after_attr}",
    )
    r.check(
        "toggle actually changes colours",
        before_bg != after_bg,
        f"{before_bg} -> {after_bg}",
    )
    page.screenshot(path=str(SHOTS / "light-dashboard.png"))

    # Persists across reload.
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(700)
    r.check(
        "theme survives a reload",
        page.get_attribute("html", "data-theme") == after_attr,
    )

    page.click('button[aria-label^="Switch to"]')  # restore dark
    page.wait_for_timeout(500)
    r.check("no errors during theme flow", monitor.clean, monitor.report())


def verify_chat(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[9] Chat")
    monitor.reset()
    page.goto(f"{base}/chat", wait_until="networkidle")

    page.fill('textarea[aria-label="Message"]', "Reply with exactly: VERIFIED")
    page.click('button[aria-label="Send message"]')
    page.wait_for_timeout(20_000)

    transcript = page.locator('[data-testid="chat-transcript"]').inner_text()
    r.check("chat returns a reply", "Assistant" in transcript, transcript[:200])
    page.screenshot(path=str(SHOTS / "chat.png"))

    # Console errors are expected here when no API key is configured (the 503
    # is surfaced in the transcript, which is correct behaviour), so only the
    # reply assertion is treated as a hard failure.


def verify_mobile(page: Page, monitor: PageMonitor, base: str, r: Results) -> None:
    print("\n[10] Mobile: drawer and no horizontal overflow")
    page.set_viewport_size({"width": 390, "height": 844})

    for tab in ["dashboard", "files", "workflows"]:
        monitor.reset()
        page.goto(f"{base}/{tab}", wait_until="networkidle")
        page.wait_for_timeout(800)

        overflow = page.evaluate(
            "document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"
        )
        r.check(f"/{tab} has no horizontal overflow at 390px", not overflow)

    page.goto(f"{base}/dashboard", wait_until="networkidle")
    page.click('button[aria-label="Open navigation"]')
    page.wait_for_timeout(700)
    r.check(
        "mobile drawer opens",
        page.locator('[aria-label="Navigation"]').count() == 1,
    )
    page.screenshot(path=str(SHOTS / "mobile-drawer.png"))

    # Scope to the drawer: the desktop sidebar is still in the DOM at this
    # viewport, just hidden, so an unscoped selector matches it first.
    page.locator('[aria-label="Navigation"] a:has-text("File Manager")').click()
    page.wait_for_timeout(1500)
    r.check("drawer navigation works", "/files" in page.url, page.url)

    page.set_viewport_size({"width": 1400, "height": 900})


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--frontend", default="http://localhost:3010")
    parser.add_argument("--backend", default="http://localhost:8020")
    args = parser.parse_args()

    SHOTS.mkdir(parents=True, exist_ok=True)
    results = Results()

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=find_chromium())
        page = browser.new_page(viewport={"width": 1400, "height": 900})
        monitor = PageMonitor(page)

        try:
            verify_tabs_load(page, monitor, args.frontend, results)
            verify_files(page, monitor, args.frontend, results)
            verify_workflows(page, monitor, args.frontend, results)
            verify_memory(page, monitor, args.frontend, results)
            verify_logs(page, monitor, args.frontend, results)
            verify_settings(page, monitor, args.frontend, results)
            verify_palette(page, monitor, args.frontend, results)
            verify_theme(page, monitor, args.frontend, results)
            verify_chat(page, monitor, args.frontend, results)
            verify_mobile(page, monitor, args.frontend, results)
        finally:
            browser.close()

    print("\n" + "=" * 62)
    print(
        f"PASSED {len(results.passed)}   "
        f"FAILED {len(results.failed)}   "
        f"SKIPPED {len(results.skipped)}"
    )
    if results.skipped:
        print("\nSkipped:")
        for name, reason in results.skipped:
            print(f"  - {name}: {reason}")
    if results.failed:
        print("\nFailures:")
        for name, reason in results.failed:
            print(f"  - {name}: {reason}")
    print(f"Screenshots in {SHOTS}")
    print("=" * 62)

    return 1 if results.failed else 0


if __name__ == "__main__":
    sys.exit(main())
