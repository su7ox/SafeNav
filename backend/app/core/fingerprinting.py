import ipaddress
import tldextract
import re
from urllib.parse import urlparse, parse_qs

SHORTENER_DOMAINS = {"bit.ly", "t.co", "goo.gl", "is.gd", "buff.ly", "tinyurl.com", "ow.ly"}
DANGEROUS_EXTENSIONS = {".exe", ".apk", ".dmg", ".zip", ".rar", ".scr", ".bat", ".ps1"}

# --- NEW: Advanced Threat Intel Lists ---
DDNS_DOMAINS = {
    "duckdns.org", "ngrok.io", "no-ip.com", "no-ip.org", "dyndns.org", 
    "ddns.net", "serveo.net", "localtunnel.me"
}

CLOUD_STORAGE_DOMAINS = {
    "raw.githubusercontent.com", "s3.amazonaws.com", "drive.google.com", 
    "dl.dropboxusercontent.com", "firebasestorage.googleapis.com"
}

def check_obfuscated_ip(hostname: str):
    # (Keep your existing check_obfuscated_ip logic here)
    try: return ipaddress.ip_address(hostname)
    except ValueError: pass
    try:
        if hostname.startswith('0x') or hostname.startswith('0X'): ip_int = int(hostname, 16)
        elif hostname.startswith('0') and not hostname.isdigit():
            try: ip_int = int(hostname, 8) 
            except ValueError: ip_int = int(hostname)
        else: ip_int = int(hostname)
        return ipaddress.ip_address(ip_int)
    except (ValueError, OverflowError): return None

def identify_link_type(url: str, hostname: str):
    results = {
        "is_ip_based": False,
        "is_shortened": False,
        "is_download": False,
        "is_app_deep_link": False,
        "has_embedded_credentials": False, # NEW
        "tags": []
    }

    parsed_url = urlparse(url)
    ext = tldextract.extract(url)
    domain_only = f"{ext.domain}.{ext.suffix}"

    # --- ADVANCED: Dangerous Schemes (Data/JS) ---
    scheme = parsed_url.scheme.lower()
    if scheme in ["data", "javascript", "vbscript"]:
        results["tags"].append(f"Dangerous Scheme ({scheme})")
        return results # Fast return, network checks don't apply here

    # --- ADVANCED: Embedded Credentials ---
    if parsed_url.username or parsed_url.password:
        results["has_embedded_credentials"] = True
        results["tags"].append("Embedded Credentials (Spoofing Risk)")

    # 1. IP-Based Links
    ip_obj = check_obfuscated_ip(hostname)
    if ip_obj:
        results["is_ip_based"] = True
        results["tags"].append("IP-Based Link")

    # 2. Shortened URLs
    if domain_only in SHORTENER_DOMAINS:
        results["is_shortened"] = True
        results["tags"].append("Shortened URL")

    # --- ADVANCED: DDNS and Cloud Storage ---
    if domain_only in DDNS_DOMAINS:
        results["tags"].append("Dynamic DNS (Disposable)")
    
    if hostname.lower() in CLOUD_STORAGE_DOMAINS:
        results["tags"].append("Cloud Storage / Raw File Host")

    # 3. File Download Detection
    path_lower = parsed_url.path.lower()
    query_params = parse_qs(parsed_url.query.lower())
    has_dangerous_ext = any(path_lower.endswith(e) for e in DANGEROUS_EXTENSIONS)
    
    if not has_dangerous_ext:
        for param_values in query_params.values():
            if any(any(val.endswith(e) for e in DANGEROUS_EXTENSIONS) for val in param_values):
                has_dangerous_ext = True
                break

    if has_dangerous_ext:
        results["is_download"] = True
        results["tags"].append("Direct Download")

    # 4. App Deep Links (Mobile Intents)
    if scheme not in ["http", "https", "", "data", "javascript"]:
        results["is_app_deep_link"] = True
        if scheme == "intent":
            pkg_match = re.search(r'package=([^;]+)', parsed_url.fragment)
            if pkg_match:
                results["tags"].append(f"Launches App ({pkg_match.group(1)})")
            else:
                results["tags"].append("App Deep Link (Android Intent)")
        else:
            results["tags"].append(f"App Deep Link ({scheme})")

    if not results["tags"]:
        results["tags"].append("Standard Website")

    return results