import urllib.parse
import idna
import re

def normalize_url(url: str):
    # 1. Strip whitespace and control characters (ASCII 0-31) [cite: 61]
    url = "".join(char for char in url.strip() if ord(char) > 31)
    
    # 2. Recursive Percent-Decoding (Max 5 iterations to prevent infinite loops) [cite: 57]
    for _ in range(5):
        decoded = urllib.parse.unquote(url)
        if decoded == url:
            break
        url = decoded

    # 3. Standardize Scheme and Hostname [cite: 64, 67]
    parsed = urllib.parse.urlsplit(url)
    scheme = parsed.scheme.lower() if parsed.scheme else "http"
    
    # 4. Punycode Conversion for Homograph Defense [cite: 70, 71]
    if parsed.hostname:
        try:
            hostname = idna.encode(parsed.hostname).decode('ascii')
        except idna.IDNAError:
            hostname = parsed.hostname.lower()
            
        # Reconstruct the normalized URL [cite: 47]
        normalized_url = parsed._replace(scheme=scheme, netloc=hostname).geturl()
        return normalized_url, hostname
        
    return url, ""