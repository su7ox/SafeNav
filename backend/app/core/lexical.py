import math
import re
from Levenshtein import distance as lev_distance

# High-value targets for typosquatting detection [cite: 208]
BRAND_TARGETS = ["google", "facebook", "amazon", "paypal", "microsoft", "apple", "netflix"]

# Trust-inducing keywords often used by phishers [cite: 214]
SUSPICIOUS_KEYWORDS = ["login", "secure", "account", "verify", "update", "support", "billing", "signin"]

def calculate_entropy(text: str) -> float:
    """Calculates Shannon Entropy to detect random DGA strings[cite: 219, 220]."""
    if not text:
        return 0.0
    probabilities = [float(text.count(c)) / len(text) for c in set(text)]
    entropy = -sum(p * math.log2(p) for p in probabilities)
    return entropy

def check_lexical_risk(url: str, hostname: str):
    report = {
        "entropy": 0.0,
        "is_dga_candidate": False,
        "typosquat_target": None,
        "found_keywords": [],
        "warning_flags": []
    }

    # 1. Entropy Calculation (DGA Detection) [cite: 217, 221]
    # Split the hostname to check only the main domain part
    domain_part = hostname.split('.')[0]
    report["entropy"] = calculate_entropy(domain_part)
    
    # Threshold for high entropy (typically > 3.5 for short strings) [cite: 221]
    if report["entropy"] > 3.8:
        report["is_dga_candidate"] = True
        report["warning_flags"].append(f"High Lexical Entropy ({report['entropy']:.2f})")

    # 2. Typosquatting Detection (Levenshtein Distance) [cite: 207, 209]
    for target in BRAND_TARGETS:
        dist = lev_distance(domain_part, target)
        # Distance of 1 or 2 indicates a potential typosquat 
        if 0 < dist <= 2:
            report["typosquat_target"] = target
            report["warning_flags"].append(f"Potential Typosquat of '{target}'")
            break

    # 3. Keyword Analysis [cite: 212, 213]
    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in url.lower():
            report["found_keywords"].append(keyword)
            
    if report["found_keywords"]:
        report["warning_flags"].append(f"Suspicious Keywords: {', '.join(report['found_keywords'])}")

    return report