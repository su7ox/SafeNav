import requests
import tldextract
import asyncio

CATEGORY_LABELS = {
    "Gambling":           "🎰 Gambling",
    "Phishing":           "🎣 Phishing",
    "Malware":            "☠️ Malware",
    "Scam":               "🚨 Scam",
    "Spam":               "📧 Spam",
    "Adult Content":      "🔞 Adult Content",
    "Newly Seen Domains": "🆕 Newly Seen Domain",
    "Cryptocurrency":     "💰 Crypto",
    "Peer-to-Peer":       "🔄 P2P / Torrents",
    "Search Engines":     "🔍 Search Engine",
    "Social Networks":    "💬 Social Media",
    "News":               "📰 News",
    "Shopping":           "🛒 Shopping",
    "Technology":         "💻 Technology",
    "Financial Services": "🏦 Finance",
    "Government":         "🏛️ Government",
    "Education":          "🎓 Education",
    "Healthcare":         "🏥 Healthcare",
    "Entertainment":      "🎬 Entertainment",
    "Streaming":          "📺 Streaming",
}

def _get_label(category: str) -> str:
    for key, label in CATEGORY_LABELS.items():
        if key.lower() in category.lower():
            return label
    return f"🌐 {category}"

def _fetch_cloudflare_category(domain: str) -> dict:
    """Synchronous fetch separated so it can run in a background thread."""
    try:
        resp = requests.get(
            f"https://radar.cloudflare.com/api/v0/domains/details?domain={domain}",
            headers={
                # Crucial: Pretend to be a browser so Cloudflare doesn't block the request
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json"
            },
            timeout=5
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return {}

async def classify_content(url: str) -> dict:
    result = {
        "primary_category": "Unknown",
        "category_label": "❓ Unknown",
        "all_categories": [],
    }

    try:
        extracted = tldextract.extract(url)
        domain = f"{extracted.domain}.{extracted.suffix}"
        
        if not domain.replace(".", ""): 
            return result

        # Run blocking request in a background thread to keep FastAPI fast
        data = await asyncio.to_thread(_fetch_cloudflare_category, domain)

        cats = data.get("result", {}).get("contentCategories", [])
        names = [c.get("name") for c in cats if c.get("name")]
        
        if names:
            result["all_categories"]   = names
            result["primary_category"] = names[0]
            result["category_label"]   = _get_label(names[0])

    except Exception as e:
        print(f"Classification error: {e}")

    return result