from playwright.sync_api import sync_playwright

URL_TO_SCRAPE = "https://www.quora.com/What-is-the-best-cover-letter-you-have-ever-read-or-written"
PLACE_TO_SAVE = "scraped_version.html"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL_TO_SCRAPE)
    

    # Get the full rendered HTML
    html = page.content()
    
    with open(PLACE_TO_SAVE, "w", encoding="utf-8") as f:
        f.write(html)
    
    browser.close()
