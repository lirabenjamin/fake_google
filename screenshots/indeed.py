#!/usr/bin/env python3
"""
scrape_indeed_playwright.py
"""
import asyncio, random, time, re
from pathlib import Path
from bs4 import BeautifulSoup
from slugify import slugify
from fake_useragent import UserAgent
from playwright.async_api import async_playwright
from tqdm import tqdm

HTML_FILE   = "test.html"
OUTPUT_DIR  = Path("indeed")
MAX_RETRIES = 3
MIN_DELAY   = 2.0   # politeness window (sec)
MAX_DELAY   = 5.0

def extract_links(path):
    soup = BeautifulSoup(Path(path).read_text(), "html.parser")
    out, seen = [], set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "indeed.com" not in href:
            continue
        if href not in seen:
            seen.add(href)
            out.append(href)
    return out

def safe_slug(text, idx):
    try:
        return slugify(text)[:60] or f"job-{idx}"
    except Exception:
        return re.sub(r"[^\w-]+", "-", text.lower())[:60] or f"job-{idx}"

async def fetch_page(playwright, url, idx):
    ua = UserAgent().chrome
    browser = await playwright.chromium.launch(headless=True)
    context = await browser.new_context(
        user_agent=ua,
        viewport={"width": random.randint(1200, 1920), "height": random.randint(800, 1080)},
        java_script_enabled=True,
    )
    page = await context.new_page()

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = await page.goto(url, wait_until="networkidle", timeout=30000)
            if resp.status == 403:
                raise ValueError("403 Forbidden")
            html = await page.content()
            title = (await page.title()) or f"job-{idx}"
            filename = OUTPUT_DIR / f"{idx:03d}-{safe_slug(title, idx)}.html"
            filename.write_text(html, encoding="utf-8")
            break
        except Exception as e:
            if attempt == MAX_RETRIES:
                print(f"🚫  [{idx}] {url} – giving up after {attempt} tries ({e})")
            else:
                wait = 2 ** attempt + random.random()
                print(f"⚠️  [{idx}] {url} – {e} (retry {attempt}/{MAX_RETRIES}, wait {wait:.1f}s)")
                await asyncio.sleep(wait)
    await context.close()
    await browser.close()

async def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    urls = extract_links(HTML_FILE)
    print(f"📝 Found {len(urls)} Indeed links. Starting headless crawl…")

    async with async_playwright() as pw:
        for idx, url in enumerate(tqdm(urls, unit="page"), 1):
            await fetch_page(pw, url, idx)
            await asyncio.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

if __name__ == "__main__":
    asyncio.run(main())