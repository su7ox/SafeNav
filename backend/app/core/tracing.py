import httpx
from urllib.parse import urlparse

# Module-specific constants
MAX_REDIRECTS = 10 # 
TIMEOUT = 5.0      # Keeping it "Fail-Fast" [cite: 15]
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" # [cite: 121]

async def trace_redirects(url: str):
    report = {
        "final_url": url,
        "hop_count": 0,
        "chain": [],
        "has_cross_domain": False,
        "warning_flags": []
    }
    
    headers = {"User-Agent": USER_AGENT} # [cite: 119]

    try:
        async with httpx.AsyncClient(follow_redirects=True, max_redirects=MAX_REDIRECTS, timeout=TIMEOUT) as client:
            # stream=True allows us to stop before downloading the body [cite: 124]
            async with client.stream("GET", url, headers=headers) as response:
                report["final_url"] = str(response.url)
                report["hop_count"] = len(response.history) # [cite: 127, 129]
                
                # Build the Redirect Chain report [cite: 128]
                current_domain = urlparse(url).netloc
                
                for resp in response.history:
                    hop_url = str(resp.url)
                    hop_domain = urlparse(hop_url).netloc
                    
                    # Cross-Domain check [cite: 130]
                    if hop_domain != current_domain:
                        report["has_cross_domain"] = True
                    
                    report["chain"].append(hop_url)
                
                # Flag suspicious behavior 
                if report["hop_count"] > 3:
                    report["warning_flags"].append("High Hop Count (>3)")
                if report["has_cross_domain"]:
                    report["warning_flags"].append("Cross-Domain Redirect Detected")

    except httpx.TooManyRedirects:
        report["warning_flags"].append("Redirect Loop Detected") # [cite: 133, 134]
    except Exception as e:
        report["warning_flags"].append(f"Trace Error: {str(e)}")

    return report