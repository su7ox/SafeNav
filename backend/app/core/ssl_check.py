import ssl
import socket
from datetime import datetime
from urllib.parse import urlparse

def inspect_ssl(hostname: str):
    report = {
        "is_https": False,
        "issuer": None,
        "cert_age_days": None,
        "validation_type": "Unknown",
        "warning_flags": []
    }
    
    context = ssl.create_default_context()
    
    try:
        # Establish a secure connection to port 443 [cite: 148]
        with socket.create_connection((hostname, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert() # [cite: 149]
                report["is_https"] = True
                
                # 1. Issuer Analysis [cite: 156]
                issuer = dict(x[0] for x in cert['issuer'])
                common_name = issuer.get('commonName', 'Unknown')
                report["issuer"] = common_name
                
                # Flag free/automated issuers often used in phishing [cite: 157, 158]
                if any(provider in common_name for provider in ["R3", "Let's Encrypt", "cPanel"]):
                    report["warning_flags"].append("Automated/Free DV Certificate")

                # 2. Certificate Age Calculation [cite: 159, 160]
                not_before = datetime.strptime(cert['notBefore'], '%b %d %H:%M:%S %Y %Z')
                age = (datetime.utcnow() - not_before).days
                report["cert_age_days"] = age
                
                # Heuristic: Critical risk if cert is < 48 hours old [cite: 162]
                if age < 2:
                    report["warning_flags"].append("Very New Certificate (< 48h)")

                # 3. Validation Type (DV vs OV/EV) [cite: 150, 154]
                subject = dict(x[0] for x in cert['subject'])
                if 'organizationName' in subject:
                    report["validation_type"] = "OV/EV (High Trust)"
                else:
                    report["validation_type"] = "DV (Standard)" # [cite: 152]

    except ssl.SSLError as e:
        report["warning_flags"].append(f"SSL Verification Error: {str(e)}") # [cite: 173]
    except Exception:
        report["warning_flags"].append("No HTTPS/SSL detected on Port 443")
        
    return report