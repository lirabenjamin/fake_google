from playwright.sync_api import sync_playwright

URL_TO_SCRAPE = "https://www.reddit.com/r/jobsearchhacks/comments/1hh7kb3/show_me_a_cover_letter_that_got_you_hired/"
PLACE_TO_SAVE = "redditcoverletter.html"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL_TO_SCRAPE)
    

    # Get the full rendered HTML
    html = page.content()
    
    with open(PLACE_TO_SAVE, "w", encoding="utf-8") as f:
        f.write(html)
    
    browser.close()
