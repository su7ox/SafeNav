from bs4 import BeautifulSoup
from urllib.parse import urlparse

def inspect_content(html_content: str, base_url: str):
    """
    Parses HTML to detect insecure login forms and dynamic content prevalence.
    """
    report = {
        "has_login_form": False,
        "is_insecure_login": False,
        "dynamic_content_detected": False,
        "warning_flags": []
    }

    if not html_content:
        return report

    soup = BeautifulSoup(html_content, 'html.parser') # [cite: 255]

    # 1. Search for password inputs [cite: 258]
    password_inputs = soup.find_all("input", {"type": "password"})
    
    if password_inputs:
        report["has_login_form"] = True
        
        # 2. Inspect the parent form tag's action [cite: 259]
        for inp in password_inputs:
            form = inp.find_parent("form")
            if form:
                action = form.get("action", "").lower()
                page_scheme = urlparse(base_url).scheme.lower()
                
                # Violation: Form on HTTP page OR Form submitting to HTTP [cite: 260]
                if page_scheme == "http" or action.startswith("http:"):
                    report["is_insecure_login"] = True
                    report["warning_flags"].append("Insecure Login Form (HTTP)") # [cite: 261]
                    break

    # 3. Detect Dynamic Content (React/Angular hints) [cite: 263]
    script_tags = soup.find_all("script")
    if len(script_tags) > 10 and not report["has_login_form"]:
        report["dynamic_content_detected"] = True
        report["warning_flags"].append("Dynamic Content Detected (Requires Tier 2)") # [cite: 264]

    return report