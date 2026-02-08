import ssl
import socket
import certifi  # <--- NEW IMPORT
from datetime import datetime
from urllib.parse import urlparse

def inspect_ssl(hostname: str):
    report = {
        "is_valid": False,   # <--- NEW FIELD (Required by endpoints.py)
        "is_https": False,
        "issuer": "Unknown", # Default to Unknown instead of None
        "cert_age_days": 0,
        "validation_type": "Unknown",
        "warning_flags": []
    }
    
    # Use certifi's CA bundle to verify certificates
    # This prevents false positives on valid sites like Google/Gemini
    context = ssl.create_default_context(cafile=certifi.where())
    
    try:
        # Establish a secure connection to port 443
        with socket.create_connection((hostname, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                
                # If we got here without error, the cert is valid and trusted
                report["is_https"] = True
                report["is_valid"] = True 
                
                # 1. Issuer Analysis
                # Handle cases where issuer might be nested
                issuer_info = {}
                for item in cert.get('issuer', []):
                    key, value = item[0]
                    issuer_info[key] = value
                
                common_name = issuer_info.get('commonName', 'Unknown')
                report["issuer"] = common_name
                
                # Flag free/automated issuers often used in phishing
                if any(provider in common_name for provider in ["R3", "Let's Encrypt", "cPanel"]):
                    report["warning_flags"].append("Automated/Free DV Certificate")

                # 2. Certificate Age Calculation
                not_before_str = cert.get('notBefore')
                if not_before_str:
                    not_before = datetime.strptime(not_before_str, '%b %d %H:%M:%S %Y %Z')
                    age = (datetime.utcnow() - not_before).days
                    report["cert_age_days"] = age
                    
                    # Heuristic: Critical risk if cert is < 48 hours old
                    if age < 2:
                        report["warning_flags"].append("Very New Certificate (< 48h)")

                # 3. Validation Type (DV vs OV/EV)
                subject_info = {}
                for item in cert.get('subject', []):
                    key, value = item[0]
                    subject_info[key] = value
                    
                if 'organizationName' in subject_info:
                    report["validation_type"] = "OV/EV (High Trust)"
                else:
                    report["validation_type"] = "DV (Standard)"

    except ssl.SSLError as e:
        report["warning_flags"].append(f"SSL Verification Error: {str(e)}")
        # is_valid remains False
    except socket.timeout:
         report["warning_flags"].append("SSL Handshake Timed Out")
    except Exception as e:
        report["warning_flags"].append(f"SSL Check Failed: {str(e)}")
        
    return report