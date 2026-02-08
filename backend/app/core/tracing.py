import httpx
import socket
import ipaddress
from urllib.parse import urlparse, urljoin

# Module-specific constants
MAX_REDIRECTS = 10
TIMEOUT = 5.0
USER_AGENT = "Mozilla/5.0 (SafeNav Security Scanner) AppleWebKit/537.36 (KHTML, like Gecko)"

def is_safe_ip(hostname: str) -> bool:
    """Check if hostname resolves to a public IP (SSRF Protection)"""
    try:
        ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(ip)
        return not (ip_obj.is_private or ip_obj.is_loopback)
    except:
        return False  # If DNS fails, it's not "safe" to connect

async def trace_redirects(url: str):
    report = {
        "final_url": url,
        "hop_count": 0,
        "chain": [],
        "has_cross_domain": False,
        "warning_flags": [],
        "html_content": ""
    }
    
    headers = {"User-Agent": USER_AGENT}
    current_url = url
    visited_domains = set()

    async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False) as client:
        for _ in range(MAX_REDIRECTS):
            try:
                # 1. SSRF Check BEFORE connection
                parsed = urlparse(current_url)
                if not is_safe_ip(parsed.hostname):
                    report["warning_flags"].append("Blocked: Redirected to Private IP")
                    break

                # 2. Manual Request (No Auto-Redirect)
                response = await client.get(current_url, headers=headers)
                
                # Update Chain
                report["chain"].append(current_url)
                visited_domains.add(parsed.netloc)
                
                # 3. Check for Redirect
                if response.is_redirect:
                    next_url = response.headers.get("location")
                    if not next_url:
                        break
                        
                    # Handle relative redirects
                    current_url = urljoin(current_url, next_url)
                    report["hop_count"] += 1
                else:
                    # Final Destination Reached
                    report["final_url"] = str(response.url)
                    # Only save HTML if it's the final page
                    if response.status_code == 200:
                        report["html_content"] = response.text[:200000] # Cap at 200KB
                    break
                    
            except httpx.RequestError as e:
                report["warning_flags"].append(f"Trace Failed: {str(e)}")
                break
            except Exception as e:
                 report["warning_flags"].append(f"Error: {str(e)}")
                 break
    
    # Analyze Cross-Domain
    if len(visited_domains) > 1:
        report["has_cross_domain"] = True
        
    if report["hop_count"] > 3:
        report["warning_flags"].append("High Hop Count (>3)")
        
    return report