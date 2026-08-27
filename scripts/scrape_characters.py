import asyncio
import os
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests
from playwright.async_api import async_playwright


def sanitize_filename(name):
    """Clean image names for safe filesystem saving."""
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()


async def scrape_dynamic_page(url, output_folder):
    os.makedirs(output_folder, exist_ok=True)

    print(f"Opening browser for: {url}")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Load page and wait for initial network activity to finish
        await page.goto(url, wait_until="networkidle")

        # Scroll dynamically to force lazy-loaded images to pop into the DOM
        print("Scrolling page to trigger lazy loading...")
        for _ in range(12):
            await page.mouse.wheel(0, 2500)
            await page.wait_for_timeout(400)

        # Retrieve fully rendered HTML
        content = await page.content()
        await browser.close()

    soup = BeautifulSoup(content, "html.parser")
    images = soup.find_all("img")

    print(f"Found {len(images)} rendered `<img>` elements.")

    download_count = 0
    skipped_count = 0

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }

    for idx, img in enumerate(images):
        img_src = (
            img.get("src")
            or img.get("data-src")
            or img.get("data-lazy-src")
            or img.get("srcset", "").split(" ")[0]
        )

        if not img_src:
            continue

        img_url = urljoin(url, img_src)

        # Filter out UI icons, logos, and SVGs
        if any(
            x in img_url.lower()
            for x in ["logo", "icon", "placeholder", "avatar"]
        ) or img_url.endswith(".svg"):
            continue

        alt_text = img.get("alt")
        if alt_text and len(alt_text.strip()) > 0:
            filename = f"{sanitize_filename(alt_text)}.jpg"
        else:
            filename = img_url.split("/")[-1].split("?")[0]
            if not filename.endswith(
                (".jpg", ".jpeg", ".png", ".webp", ".gif")
            ):
                filename = f"character_{idx}.jpg"

        filepath = os.path.join(output_folder, filename)

        # Skip existing files
        if os.path.exists(filepath):
            skipped_count += 1
            print(f"[Skipped] Already on disk: {filename}")
            continue

        try:
            res = requests.get(img_url, headers=headers, timeout=10)
            if res.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(res.content)
                download_count += 1
                print(f"[{download_count}] Downloaded: {filename}")
        except Exception as e:
            print(f"Failed to download {img_url}: {e}")

    print(
        f"\nDone! Downloaded {download_count} new images, skipped {skipped_count} existing files in '{output_folder}'."
    )


if __name__ == "__main__":
    asyncio.run(
        scrape_dynamic_page(
            "https://ahnaldt101.com/swgoh/characters",
            os.path.join("..", "public", "assets", "characters"),
        )
    )