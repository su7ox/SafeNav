def calculate_risk_score(scan_results: dict) -> dict:
    total_score = 0
    risk_factors = []

    category_scores = {
        "lexical": 0,
        "ssl": 0,
        "reputation": 0,
        "content": 0
    }
    def add_risk(points: int, message: str, category: str):
        """Helper function to apply penalties and log the reason."""
        nonlocal total_score
        total_score += points
        category_scores[category] += points
        risk_factors.append(f"{message} (+{points})")
    # --- 1. Lexical / URL Checks ---
    url = scan_results.get('url', '').lower()
    
    if scan_results.get('has_ip_in_domain', False):
        add_risk(45, "IP address used instead of a domain name", "lexical")
        
    url_len = scan_results.get('url_length', 0)
    if url_len > 100:
        add_risk(15, "Abnormally long URL length (>100 chars)", "lexical")
    elif url_len > 75:
        add_risk(5, "Unusually long URL length (>75 chars)", "lexical")

    if scan_results.get('num_subdomains', 0) > 3:
        add_risk(20, "Excessive number of subdomains (often used in phishing)", "lexical")

    # Check for social engineering keywords in the URL
    suspicious_keywords = ['login', 'secure', 'account', 'update', 'verify', 'bank', 'paypal', 'signin', 'support']
    found_keywords = [kw for kw in suspicious_keywords if kw in url]
    if found_keywords:
        add_risk(10 * len(found_keywords), f"Suspicious keywords in URL ({', '.join(found_keywords)})", "lexical")
    # Abuse-heavy TLDs
    suspicious_tlds = ['.xyz', '.top', '.pw', '.cc', '.info', '.club', '.online', '.tk', '.ml', '.ga', '.cf', '.gq']
    if scan_results.get('tld') in suspicious_tlds:
        add_risk(25, f"Highly abused Top-Level Domain ({scan_results.get('tld')})", "lexical")
    # --- 2. ADVANCED SSL/TLS Checks ---
    ssl_data = scan_results.get('ssl', scan_results)
    ssl_warnings = ssl_data.get('warning_flags', [])

    # Core Validity
    if not ssl_data.get('is_valid', True):
        add_risk(65, "Invalid, expired, or missing SSL certificate", "ssl")    
    if ssl_data.get('is_self_signed', False):
        add_risk(65, "Self-signed certificate detected (Highly suspicious for public sites)", "ssl")
    ssl_age = ssl_data.get('cert_age_days', 999)
    if ssl_age < 2:
        add_risk(40, "SSL certificate is incredibly new (< 48 hours old)", "ssl")
    elif ssl_age < 14:
        add_risk(25, "SSL certificate is very new (< 14 days old)", "ssl")
    elif ssl_age < 60:
        add_risk(10, "SSL certificate is relatively new (< 60 days old)", "ssl")
    # Deep Inspection 
    if any("Automated/Free DV" in flag for flag in ssl_warnings):
        add_risk(10, "Domain uses a free/automated SSL issuer (common in phishing)", "ssl")    
    if any("Deprecated/Weak TLS" in flag for flag in ssl_warnings):
        add_risk(25, "Server uses deprecated or weak TLS protocol", "ssl")    
    if any("Weak Cipher" in flag for flag in ssl_warnings):
        add_risk(15, "Server negotiated a weak cipher suite", "ssl")
    if any("phishing kit signal" in flag for flag in ssl_warnings):
        add_risk(35, "Suspicious Subject Alternative Name (SAN) pattern (Phishing kit signal)", "ssl")
    
    if any("High number of SANs" in flag for flag in ssl_warnings) and not any("phishing kit signal" in flag for flag in ssl_warnings):
         add_risk(10, "High number of domains packed onto a single certificate", "ssl")
    if any("No CT Log Entries" in flag for flag in ssl_warnings):
        add_risk(25, "Certificate Transparency logs missing (Hidden/Suspicious certificate)", "ssl")    
    if any("Abnormally Short" in flag for flag in ssl_warnings):
        add_risk(15, "Certificate lifespan is abnormally short", "ssl")
    if scan_results.get('is_blacklisted', False):
        
        add_risk(100, "Domain is explicitly flagged on a threat blacklist", "reputation")
    
 # --- 3. IP Intelligence ---
    ip_data = scan_results.get("ip_intel", {})
    ip_warnings = ip_data.get("warning_flags", [])
 
    if any("VPN / Proxy" in f for f in ip_warnings):
        add_risk(30, "IP flagged as VPN / Proxy / Tor Exit Node", "reputation")
 
    if any("High-Risk Country" in f for f in ip_warnings):
        add_risk(20, "Site hosted in a country with high phishing infrastructure abuse", "reputation")
 
    if any("Suspicious Hosting ASN" in f for f in ip_warnings):
        add_risk(35, "Site hosted on ASN frequently associated with phishing/bulletproof hosting", "reputation")
 
    if ip_data.get("country_mismatch", False):
        add_risk(15, "Domain registered in a different country than its hosting location", "reputation")
 
    # Absence of IP resolution = domain doesn't exist or DNS is broken
    if ip_data and ip_data.get("ip_address") is None:
        add_risk(20, "Could not resolve domain to an IP address (DNS failure or non-existent domain)", "reputation")

    domain_age = scan_results.get('domain_age_days')
    if domain_age is None:
        domain_age = 999 # If age is unknown, assume it's very new to be cautious
        
    if domain_age < 30:
        add_risk(45, "Domain was registered very recently (< 30 days ago)", "reputation")
    elif domain_age < 90:
        add_risk(20, "Domain is relatively new (< 90 days ago)", "reputation")

    # --- 4. Content / Fingerprinting ---
    if scan_results.get('has_obfuscated_scripts', False):
        add_risk(40, "Heavily obfuscated or packed JavaScript detected", "content")
        
    if scan_results.get('requests_external_executables', False):
        add_risk(70, "Page attempts to download executable payloads (.exe, .apk, .bat)", "content")
        
    if scan_results.get('has_hidden_iframes', False):
        add_risk(35, "Hidden iframes detected (often used for cryptojacking or drive-by downloads)", "content")

    if scan_results.get('forms_post_to_external_domain', False):
        add_risk(30, "HTML forms submit user data to an external/different domain", "content")

    # --- Final Score Normalization ---
    final_score = min(total_score, 100)
    # Determine Granular Risk Tier
    if final_score >= 75:
        risk_level = "CRITICAL"
    elif final_score >= 50:
        risk_level = "HIGH"
    elif final_score >= 25:
        risk_level = "WARNING"
    else:
        risk_level = "SAFE"
    return {
        "final_score": final_score,
        "risk_level": risk_level,
        "category_breakdown": category_scores,
        "risk_factors": risk_factors
    }