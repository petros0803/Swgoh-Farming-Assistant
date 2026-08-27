import os
import re
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup


def sanitize_filename(name):
    """Clean image names for safe filesystem saving."""
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()


def scrape_swgoh_page(url, output_folder):
    os.makedirs(output_folder, exist_ok=True)

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }

    print(f"Fetching page: {url}")
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Failed to fetch {url}: {e}")
        return

    soup = BeautifulSoup(response.text, "html.parser")
    images = soup.find_all("img")

    print(f"Found {len(images)} `<img>` tags on page.")

    download_count = 0
    skipped_count = 0

    for idx, img in enumerate(images):
        img_src = (
            img.get("src")
            or img.get("data-src")
            or img.get("data-lazy-src")
            or img.get("data-original")
            or img.get("srcset", "").split(" ")[0]
        )

        if not img_src:
            continue

        img_url = urljoin(url, img_src)

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

        # Check if file already exists on disk
        if os.path.exists(filepath):
            skipped_count += 1
            print(f"[Skipped] Already exists: {filename}")
            continue

        # Download image if missing
        try:
            img_resp = requests.get(img_url, headers=headers, timeout=10)
            if img_resp.status_code == 200:
                with open(filepath, "wb") as f:
                    f.write(img_resp.content)
                download_count += 1
                print(f"[{download_count}] Downloaded: {filename}")
        except Exception as e:
            print(f"Failed to download {img_url}: {e}")

    print(
        f"\nDone! Downloaded {download_count} new images, skipped {skipped_count} existing files in '{output_folder}'."
    )


if __name__ == "__main__":
    scrape_swgoh_page(
        "https://ahnaldt101.com/swgoh/characters",
        os.path.join("..", "public", "assets", "characters"),
    )
    scrape_swgoh_page(
        "https://ahnaldt101.com/swgoh/ships",
        os.path.join("..", "public", "assets", "ships"),
    )