from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("https://www.canva.com/letters/templates/cover-letters/")
    

    # Get the full rendered HTML
    html = page.content()
    
    with open("canva.html", "w", encoding="utf-8") as f:
        f.write(html)
    
    browser.close()
