import ipaddress
import tldextract
from urllib.parse import urlparse

# Curated list of common URL shorteners [cite: 93]
SHORTENER_DOMAINS = {
    "bit.ly", "t.co", "goo.gl", "is.gd", "buff.ly", "tinyurl.com"
}

# Blacklist of dangerous file extensions [cite: 98]
DANGEROUS_EXTENSIONS = {
    ".exe", ".apk", ".dmg", ".zip", ".rar", ".scr", ".bat", ".ps1"
}

def identify_link_type(url: str, hostname: str):
    results = {
        "is_ip_based": False,
        "is_shortened": False,
        "is_download": False,
        "is_app_deep_link": False,
        "tags": []
    }

    # 1. IP-Based Links Detection [cite: 85, 88]
    try:
        if ipaddress.ip_address(hostname):
            results["is_ip_based"] = True
            results["tags"].append("IP-Based Link")
    except ValueError:
        pass

    # 2. Shortened URL Detection [cite: 91, 94]
    ext = tldextract.extract(url)
    domain_only = f"{ext.domain}.{ext.suffix}"
    if domain_only in SHORTENER_DOMAINS:
        results["is_shortened"] = True
        results["tags"].append("Shortened URL")

    # 3. File Download Detection [cite: 95, 97, 109]
    parsed_path = urlparse(url).path.lower()
    # Check both path suffix and query parameters as a mitigation [cite: 109]
    if any(parsed_path.endswith(ext) for ext in DANGEROUS_EXTENSIONS) or \
       any(ext in url.lower() for ext in DANGEROUS_EXTENSIONS):
        results["is_download"] = True
        results["tags"].append("Direct Download")

    # 4. App Deep Links (Mobile Intents) [cite: 100, 103]
    scheme = urlparse(url).scheme.lower()
    if scheme not in ["http", "https", ""]:
        results["is_app_deep_link"] = True
        results["tags"].append(f"App Deep Link ({scheme})")

    return results