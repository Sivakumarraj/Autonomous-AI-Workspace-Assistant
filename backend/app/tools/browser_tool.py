"""Browser automation tool using async Playwright."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from playwright.async_api import async_playwright


@dataclass
class BrowserConfig:
    headless: bool = True
    timeout_ms: int = 15000
    max_results: int = 5


class BrowserTool:
    def __init__(self, config: Optional[BrowserConfig] = None) -> None:
        self.config = config or BrowserConfig()

    async def google_search(self, query: str, max_results: Optional[int] = None) -> List[Dict[str, str]]:
        """Search Google and return lightweight structured search results."""
        limit = max_results or self.config.max_results

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.config.headless)
            page = await browser.new_page()
            try:
                await page.goto("https://www.google.com", timeout=self.config.timeout_ms)
                await page.fill('textarea[name="q"]', query)
                await page.keyboard.press("Enter")
                await page.wait_for_selector("div#search", timeout=self.config.timeout_ms)

                cards = page.locator("div#search div.g")
                count = await cards.count()
                results: List[Dict[str, str]] = []

                for idx in range(count):
                    if len(results) >= limit:
                        break

                    card = cards.nth(idx)
                    title = (await card.locator("h3").first.text_content() or "").strip()
                    link = await card.locator("a").first.get_attribute("href")
                    snippet = (await card.locator("div.VwiC3b, span.aCOpRe").first.text_content() or "").strip()

                    if title and link:
                        results.append({"title": title, "url": link, "snippet": snippet})

                return results
            finally:
                await browser.close()

    async def extract_webpage(self, url: str) -> Dict[str, Any]:
        """Extract clean webpage metadata and visible text."""
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=self.config.headless)
            page = await browser.new_page()
            try:
                await page.goto(url, timeout=self.config.timeout_ms, wait_until="domcontentloaded")
                title = await page.title()
                text = await page.locator("body").inner_text()
                text = " ".join(text.split())

                return {
                    "url": url,
                    "title": title,
                    "content": text[:12000],
                    "content_length": len(text),
                }
            finally:
                await browser.close()

    async def summarize_webpage(self, url: str, max_chars: int = 1000) -> Dict[str, Any]:
        """Produce simple extractive summary from a webpage."""
        page_data = await self.extract_webpage(url)
        content = page_data.get("content", "")

        summary = content[:max_chars]
        if len(content) > max_chars:
            summary += "..."

        return {
            "url": url,
            "title": page_data.get("title", ""),
            "summary": summary,
            "source_length": page_data.get("content_length", 0),
        }

    async def safe_open_website(self, url: str) -> str:
        """Backwards-compatible open website action."""
        try:
            await self.extract_webpage(url)
            return f"Opened website: {url}"
        except PlaywrightTimeoutError:
            return f"Browser timeout while opening: {url}"
        except Exception as exc:  # pragma: no cover - defensive fallback
            return f"Browser error: {str(exc)}"


browser_tool = BrowserTool()


async def open_website(url: str) -> str:
    return await browser_tool.safe_open_website(url)
