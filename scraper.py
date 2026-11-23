import os
import re
import time
from urllib.parse import urljoin, urlparse
import requests
from bs4 import BeautifulSoup

# --- CONFIGURATION ---
START_URL = "https://www.e2c92.fr/"  # Remplace par l'URL cible
OUTPUT_DIR = "site_local"
DELAY = 0.2  # Pause entre chaque requête (en secondes) pour éviter d'être bloqué

visited_urls = set()
domain = urlparse(START_URL).netloc

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})


def url_to_local_path(url, is_html=False):
    """Convertit une URL en chemin de fichier valide sous Windows."""
    parsed = urlparse(url)
    path = parsed.path

    if not path or path.endswith("/"):
        path += "index.html"
    elif is_html and not os.path.splitext(path)[1]:
        path += ".html"

    # Nettoie les caractères interdits par Windows (< > : " | ? *)
    segments = [re.sub(r'[<>:"|?*]', "_", seg) for seg in path.strip("/").split("/")]
    return os.path.join(OUTPUT_DIR, *segments)


def download_asset(url):
    """Télécharge une ressource statique (CSS, JS, image, video) et renvoie son chemin local."""
    if urlparse(url).netloc != domain:
        return None  # Ignore les ressources externes (CDN, Google Fonts, etc.)

    local_path = url_to_local_path(url, is_html=False)
    if os.path.exists(local_path):
        return local_path

    try:
        resp = session.get(url, timeout=10)
        if resp.status_code == 200:
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(resp.content)
            print(f"[ASSET] {url}")
            return local_path
    except Exception as e:
        print(f"[ERREUR ASSET] {url} : {e}")
    return None


def scrape_page(url):
    """Explore une page HTML, télécharge ses assets et suit ses liens internes."""
    # Supprime les ancres (#section)
    url = url.split("#")[0]
    if url in visited_urls or urlparse(url).netloc != domain:
        return
    visited_urls.add(url)

    try:
        resp = session.get(url, timeout=10)
        if resp.status_code != 200:
            return
        if "text/html" not in resp.headers.get("Content-Type", ""):
            download_asset(url)
            return
    except Exception as e:
        print(f"[ERREUR PAGE] {url} : {e}")
        return

    print(f"[PAGE]  {url}")
    local_html_path = url_to_local_path(url, is_html=True)
    os.makedirs(os.path.dirname(local_html_path), exist_ok=True)

    soup = BeautifulSoup(resp.text, "html.parser")
    links_to_follow = []

    # 1. Télécharger les assets (images, vidéos, scripts, feuilles de style)
    asset_tags = [
        ("img", "src"),
        ("script", "src"),
        ("link", "href"),
        ("video", "src"),     
        ("source", "src"),    
        ("audio", "src"),     
        ("iframe", "src")     
    ]
    
    for tag_name, attr in asset_tags:
        for tag in soup.find_all(tag_name):
            raw_link = tag.get(attr)
            
            # Suppression du srcset pour forcer le navigateur à utiliser le src local
            if tag.has_attr("srcset"):
                del tag["srcset"]
            if tag.has_attr("sizes"):
                del tag["sizes"]

            if not raw_link or raw_link.startswith(("data:", "about:")):
                continue

            full_url = urljoin(url, raw_link)
            if tag_name == "link" and "stylesheet" not in tag.get("rel", []) and "icon" not in tag.get("rel", []):
                continue

            saved_asset = download_asset(full_url)
            if saved_asset:
                tag[attr] = os.path.relpath(saved_asset, os.path.dirname(local_html_path)).replace("\\", "/")

    # 1.5 CORRECTION INLINE CSS (Background-image Elementor)
    for tag in soup.find_all(style=True):
        style_content = tag["style"]
        urls_in_style = re.findall(r'url\([\'"]?(.*?)[\'"]?\)', style_content)
        for bg_url in urls_in_style:
            if bg_url.startswith(("data:", "#")): continue
            full_bg_url = urljoin(url, bg_url)
            
            saved_bg = download_asset(full_bg_url)
            if saved_bg:
                local_bg_path = os.path.relpath(saved_bg, os.path.dirname(local_html_path)).replace("\\", "/")
                tag["style"] = tag["style"].replace(bg_url, local_bg_path)

    # 2. Traiter les liens <a href="..."> vers d'autres pages du site
    for a_tag in soup.find_all("a", href=True):
        raw_href = a_tag["href"]
        if raw_href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue

        full_url = urljoin(url, raw_href).split("#")[0]
        if urlparse(full_url).netloc == domain:
            target_local = url_to_local_path(full_url, is_html=True)
            a_tag["href"] = os.path.relpath(target_local, os.path.dirname(local_html_path)).replace("\\", "/")
            if full_url not in visited_urls:
                links_to_follow.append(full_url)

    # 3. Sauvegarder le fichier HTML avec encodage UTF-8
    with open(local_html_path, "w", encoding="utf-8") as f:
        f.write(str(soup))

    time.sleep(DELAY)

    # 4. Exploration récursive
    for next_url in links_to_follow:
        scrape_page(next_url)


if __name__ == "__main__":
    print(f"Démarrage de l'aspiration de {START_URL}...")
    scrape_page(START_URL)
    print(f"Terminé ! Le site est enregistré dans le dossier '{OUTPUT_DIR}'.")