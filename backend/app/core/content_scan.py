from bs4 import BeautifulSoup

def inspect_content(html_content: str, base_url: str):
    """
    Parses HTML to detect dynamic content usage.
    (Login detection removed as it requires Phase 2 dynamic analysis).
    """
    report = {
        "dynamic_content_detected": False,
        "warning_flags": []
    }

    if not html_content:
        return report

    try:
        soup = BeautifulSoup(html_content, 'html.parser')

        # Detect Dynamic Content (React/Angular/Vue hints)
        # If many scripts are present, we warn that static analysis is limited.
        script_tags = soup.find_all("script")
        if len(script_tags) > 5:
            report["dynamic_content_detected"] = True
            report["warning_flags"].append("Heavy Dynamic Content (Analysis Limited)")

    except Exception as e:
        report["warning_flags"].append(f"Content Parse Error: {str(e)}")

    return report