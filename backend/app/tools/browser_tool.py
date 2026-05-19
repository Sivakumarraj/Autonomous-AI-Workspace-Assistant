from playwright.async_api import async_playwright


async def open_website(url: str):

    try:

        async with async_playwright() as p:

            browser = await p.chromium.launch(
                headless=False
            )

            page = await browser.new_page()

            await page.goto(url)

            return f"Opened website: {url}"

    except Exception as e:

        return f"Browser error: {str(e)}"