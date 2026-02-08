import whois
import tldextract
import socket  # <--- NEW
from datetime import datetime

SUSPICIOUS_TLDS = {".xyz", ".top", ".tk", ".gq", ".zip", ".bid", ".casa"}

def check_domain_reputation(url: str):
    report = {
        "domain_age_days": None,
        "registrar": None,
        "is_suspicious_tld": False,
        "warning_flags": []
    }
    
    extracted = tldextract.extract(url)
    domain = f"{extracted.domain}.{extracted.suffix}"
    tld = f".{extracted.suffix}"
    
    if tld in SUSPICIOUS_TLDS:
        report["is_suspicious_tld"] = True
        report["warning_flags"].append(f"Suspicious TLD detected ({tld})")
    
    try:
        # --- FIX: Set a default timeout for the WHOIS socket ---
        socket.setdefaulttimeout(5) 
        
        w = whois.whois(domain)
        creation_date = w.creation_date
        
        # Handle list of dates (common with some registrars)
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
            
        if creation_date:
            # Normalize timezone
            if creation_date.tzinfo is not None:
                creation_date = creation_date.replace(tzinfo=None)
                
            now = datetime.utcnow()
            age_days = (now - creation_date).days

            report["domain_age_days"] = age_days
            report["registrar"] = w.registrar
            
            if age_days < 7:
                report["warning_flags"].append("Critical Risk: New Domain (< 1 week)")
            elif age_days < 30:
                report["warning_flags"].append("High Risk: Fresh Domain (< 1 month)")
        else:
            report["warning_flags"].append("Indeterminate: Creation date redacted")
            
    except Exception as e:
        # Check if it was a timeout
        if "timed out" in str(e).lower():
             report["warning_flags"].append("WHOIS Lookup Timed Out")
        else:
             report["warning_flags"].append(f"WHOIS lookup failed: {str(e)}")
        
    return report