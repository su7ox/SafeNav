import ssl
import socket
import certifi
import requests
from datetime import datetime
from cryptography import x509
from cryptography.hazmat.primitives.asymmetric import rsa, ec, dsa

# ─────────────────────────────────────────────
#  TRUSTED CA LIST
# ─────────────────────────────────────────────
TRUSTED_CERTIFICATE_AUTHORITIES = [
    # Free / ACME-based
    "R3", "Let's Encrypt", "ZeroSSL", "Buypass",
    "ISRG Root X1", "ISRG Root X2", "DST Root CA X3",

    # Hosting / CDN providers
    "cPanel", "Cloudflare", "Cloudflare Inc ECC CA", "Cloudflare Inc RSA CA",

    # Big Tech
    "Google Trust Services", "GTS", "GTS CA 1C3", "GTS CA 1D4",
    "Amazon", "Amazon Root CA 1", "Amazon Root CA 2", "Amazon Root CA 3", "Amazon Root CA 4",
    "Microsoft Azure TLS Issuing CA", "Microsoft RSA TLS CA",

    # DigiCert family
    "DigiCert", "DigiCert Inc", "DigiCert SHA2", "DigiCert TLS RSA SHA256", "DigiCert Global Root",

    # Commercial CAs
    "Sectigo", "Sectigo Limited",
    "TrustAsia", "TrustAsia Technologies",
    "GlobalSign", "GlobalSign nv-sa", "GlobalSign Organization Validation CA",
    "Entrust", "Entrust Datacard",
    "IdenTrust",
    "Comodo", "Comodo CA", "COMODO RSA",
    "USERTrust",
    "GeoTrust", "RapidSSL", "Thawte",
    "SSL.com", "Certum", "SwissSign",
    "QuoVadis", "T-TeleSec GlobalRoot",
    "D-TRUST", "Actalis", "Trustwave", "Network Solutions",
]

# Free/automated DV issuers — flagged for risk scoring
FREE_DV_PROVIDERS = [
    "R3", "Let's Encrypt", "cPanel", "ZeroSSL", "TrustAsia",
    "Cloudflare", "Google Trust Services", "GTS",
    "Amazon", "Buypass", "Sectigo",
]

WEAK_CIPHERS = ["RC4", "3DES", "NULL", "EXPORT", "anon", "DES", "RC2", "IDEA"]

# ─────────────────────────────────────────────
#  HELPER FUNCTIONS
# ─────────────────────────────────────────────

def is_trusted_ca(issuer_cn: str) -> bool:
    """Partial case-insensitive match against the trusted CA list."""
    issuer_lower = issuer_cn.lower()
    return any(ca.lower() in issuer_lower for ca in TRUSTED_CERTIFICATE_AUTHORITIES)


def is_free_dv_provider(issuer_cn: str) -> bool:
    """Check if the issuer is a free/automated DV certificate provider."""
    issuer_lower = issuer_cn.lower()
    return any(provider.lower() in issuer_lower for provider in FREE_DV_PROVIDERS)


def check_hsts(hostname: str) -> dict:
    """
    Check HSTS header from the live HTTPS response.
    Returns hsts_enabled, max_age, includes_subdomains, preload.
    Does NOT raise — returns safe defaults on failure.
    """
    result = {
        "hsts_enabled": False,
        "hsts_max_age": 0,
        "hsts_includes_subdomains": False,
        "hsts_preload": False,
    }
    try:
        resp = requests.get(
            f"https://{hostname}",
            timeout=5,
            allow_redirects=True,
            verify=certifi.where()
        )
        hsts_header = resp.headers.get("Strict-Transport-Security", "")
        if hsts_header:
            result["hsts_enabled"] = True
            for directive in hsts_header.lower().split(";"):
                directive = directive.strip()
                if directive.startswith("max-age="):
                    try:
                        result["hsts_max_age"] = int(directive.split("=")[1])
                    except ValueError:
                        pass
                elif directive == "includesubdomains":
                    result["hsts_includes_subdomains"] = True
                elif directive == "preload":
                    result["hsts_preload"] = True
    except Exception:
        pass  # Non-fatal: HSTS check failure doesn't invalidate the cert
    return result


def check_ct_logs(hostname: str) -> dict:
    """
    Query crt.sh to check Certificate Transparency log presence.
    Returns ct_log_count and earliest seen date.
    """
    result = {
        "ct_log_count": 0,
        "ct_earliest_seen": None,
        "ct_check_failed": False,
    }
    try:
        resp = requests.get(
            f"https://crt.sh/?q={hostname}&output=json",
            timeout=6
        )
        if resp.status_code == 200:
            entries = resp.json()
            result["ct_log_count"] = len(entries)
            if entries:
                dates = []
                for e in entries:
                    date_str = e.get("not_before") or e.get("entry_timestamp")
                    if date_str:
                        try:
                            dates.append(datetime.fromisoformat(date_str[:19]))
                        except ValueError:
                            pass
                if dates:
                    result["ct_earliest_seen"] = min(dates).strftime("%Y-%m-%d")
    except Exception:
        result["ct_check_failed"] = True
    return result


def analyze_public_key(cert_obj) -> dict:
    """
    Extract key type and size from a cryptography x509 cert object.
    Flags weak keys (RSA < 2048, EC < 256, DSA < 2048).
    """
    result = {
        "key_type": "Unknown",
        "key_bits": 0,
        "key_is_weak": False,
    }
    try:
        pub_key = cert_obj.public_key()
        if isinstance(pub_key, rsa.RSAPublicKey):
            result["key_type"] = "RSA"
            result["key_bits"] = pub_key.key_size
            result["key_is_weak"] = pub_key.key_size < 2048
        elif isinstance(pub_key, ec.EllipticCurvePublicKey):
            result["key_type"] = "EC"
            result["key_bits"] = pub_key.key_size
            result["key_is_weak"] = pub_key.key_size < 256
        elif isinstance(pub_key, dsa.DSAPublicKey):
            result["key_type"] = "DSA"
            result["key_bits"] = pub_key.key_size
            result["key_is_weak"] = pub_key.key_size < 2048
    except Exception:
        pass
    return result


def analyze_san_pattern(sans: list) -> list:
    """
    Check if SANs span unrelated base domains — a phishing kit signal.
    Returns a list of warning strings (empty if clean).
    """
    warnings = []
    dns_names = [v for t, v in sans if t == "DNS"]
    if not dns_names:
        return warnings

    base_domains = set(
        ".".join(d.lstrip("*.").split(".")[-2:]) for d in dns_names
    )
    if len(base_domains) > 3:
        warnings.append(
            f"SANs span {len(base_domains)} unrelated base domains (phishing kit signal)"
        )
    return warnings


# ─────────────────────────────────────────────
#  MAIN FUNCTION
# ─────────────────────────────────────────────

def inspect_ssl(hostname: str):
    report = {
        # Core validity
        "is_valid": False,
        "is_https": False,
        "issuer": "Unknown",

        # Dates
        "cert_age_days": 0,
        "days_to_expire": 0,
        "cert_total_lifespan_days": 0,        # NEW: total cert lifespan

        # Protocol
        "tls_version": "Unknown",
        "cipher_suite": "Unknown",            # NEW: cipher suite name
        "cipher_bits": 0,                     # NEW: cipher key bits

        # Cert identity
        "validation_type": "Unknown",
        "is_self_signed": False,
        "is_wildcard": False,                 # NEW: wildcard cert flag
        "san_count": 0,                       # NEW: total SAN count

        # Public key
        "key_type": "Unknown",                # NEW: RSA / EC / DSA
        "key_bits": 0,                        # NEW: key size in bits

        # HSTS
        "hsts_enabled": False,                # NEW: HSTS present
        "hsts_max_age": 0,                    # NEW: max-age seconds
        "hsts_includes_subdomains": False,    # NEW: includeSubDomains
        "hsts_preload": False,                # NEW: preload directive

        # Certificate Transparency
        "ct_log_count": 0,                    # NEW: entries in crt.sh
        "ct_earliest_seen": None,             # NEW: first CT log date
        "ct_check_failed": False,             # NEW: if crt.sh was unreachable

        # Org info (OV/EV)
        "org_name": None,                     # NEW: organizationName
        "org_country": None,                  # NEW: countryName
        "org_locality": None,                 # NEW: localityName

        "warning_flags": []
    }

    context = ssl.create_default_context(cafile=certifi.where())

    try:
        with socket.create_connection((hostname, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                der_cert = ssock.getpeercert(binary_form=True)

                report["is_https"] = True
                report["is_valid"] = True

                # ── 1. TLS Version ────────────────────────────────────────
                report["tls_version"] = ssock.version()
                if report["tls_version"] in ["TLSv1", "TLSv1.1"]:
                    report["warning_flags"].append(
                        f"Deprecated/Weak TLS Version ({report['tls_version']})"
                    )

                # ── 2. Cipher Suite ───────────────────────────────────────
                cipher = ssock.cipher()
                if cipher:
                    report["cipher_suite"] = cipher[0]
                    report["cipher_bits"] = cipher[2] or 0
                    if any(w in cipher[0] for w in WEAK_CIPHERS):
                        report["warning_flags"].append(
                            f"Weak Cipher Suite: {cipher[0]}"
                        )

                # ── 3. Issuer & Subject ───────────────────────────────────
                issuer_info = {k: v for item in cert.get("issuer", []) for k, v in item}
                subject_info = {k: v for item in cert.get("subject", []) for k, v in item}

                common_name = issuer_info.get("commonName", "Unknown")
                subject_cn = subject_info.get("commonName", "Unknown")
                report["issuer"] = common_name

                # OV/EV org fields
                report["org_name"]     = subject_info.get("organizationName")
                report["org_country"]  = subject_info.get("countryName")
                report["org_locality"] = subject_info.get("localityName")

                # Self-signed
                if common_name == subject_cn and common_name != "Unknown":
                    report["is_self_signed"] = True
                    report["warning_flags"].append("Self-Signed Certificate (High Risk)")

                # Unknown / untrusted CA
                if not report["is_self_signed"] and not is_trusted_ca(common_name):
                    report["warning_flags"].append(
                        f"Unknown/Untrusted CA: {common_name}"
                    )

                # Free/automated DV
                if is_free_dv_provider(common_name):
                    report["warning_flags"].append("Automated/Free DV Certificate")

                # ── 4. Wildcard Detection ─────────────────────────────────
                if subject_cn.startswith("*."):
                    report["is_wildcard"] = True
                    report["warning_flags"].append("Wildcard Certificate")

                # ── 5. Dates & Lifespan ───────────────────────────────────
                not_before_str = cert.get("notBefore")
                not_after_str  = cert.get("notAfter")

                if not_before_str and not_after_str:
                    not_before = datetime.strptime(not_before_str, "%b %d %H:%M:%S %Y %Z")
                    not_after  = datetime.strptime(not_after_str,  "%b %d %H:%M:%S %Y %Z")
                    now        = datetime.utcnow()

                    age              = (now - not_before).days
                    days_to_expire   = (not_after - now).days
                    total_lifespan   = (not_after - not_before).days

                    report["cert_age_days"]          = age
                    report["days_to_expire"]          = days_to_expire
                    report["cert_total_lifespan_days"] = total_lifespan

                    if age < 2:
                        report["warning_flags"].append("Very New Certificate (< 48h)")
                    if days_to_expire < 0:
                        report["warning_flags"].append("Certificate Expired")
                        report["is_valid"] = False
                    elif days_to_expire < 7:
                        report["warning_flags"].append("Certificate Expires Soon (< 7 days)")

                    # Lifespan anomaly
                    if total_lifespan < 10:
                        report["warning_flags"].append(
                            f"Abnormally Short Cert Lifespan ({total_lifespan} days)"
                        )
                    elif total_lifespan > 825:
                        report["warning_flags"].append(
                            f"Cert Lifespan Exceeds CAB Forum Max ({total_lifespan} days)"
                        )

                # ── 6. Validation Type ────────────────────────────────────
                if report["org_name"]:
                    report["validation_type"] = "OV/EV (High Trust)"
                else:
                    report["validation_type"] = "DV (Standard)"

                # ── 7. SANs Analysis ──────────────────────────────────────
                sans = cert.get("subjectAltName", [])
                report["san_count"] = len(sans)

                if len(sans) > 10:
                    report["warning_flags"].append(
                        f"High number of SANs ({len(sans)})"
                    )

                san_warnings = analyze_san_pattern(sans)
                report["warning_flags"].extend(san_warnings)

                # ── 8. Public Key Strength (via cryptography lib) ─────────
                try:
                    cert_obj = x509.load_der_x509_certificate(der_cert)
                    key_info = analyze_public_key(cert_obj)
                    report["key_type"]  = key_info["key_type"]
                    report["key_bits"]  = key_info["key_bits"]
                    if key_info["key_is_weak"]:
                        report["warning_flags"].append(
                            f"Weak Public Key: {key_info['key_type']} {key_info['key_bits']}-bit"
                        )
                except Exception:
                    pass  # Non-fatal if cryptography lib fails

    except ssl.SSLError as e:
        report["warning_flags"].append(f"SSL Verification Error: {str(e)}")
    except socket.timeout:
        report["warning_flags"].append("SSL Handshake Timed Out")
    except Exception as e:
        report["warning_flags"].append(f"SSL Check Failed: {str(e)}")

    # ── 9. HSTS Check (separate HTTP request, outside SSL context) ────────
    if report["is_https"]:
        hsts = check_hsts(hostname)
        report.update(hsts)
        if not hsts["hsts_enabled"]:
            report["warning_flags"].append("HSTS Not Configured")
        elif hsts["hsts_max_age"] < 31536000:  # < 1 year
            report["warning_flags"].append(
                f"HSTS max-age Too Low ({hsts['hsts_max_age']}s, recommend ≥ 31536000)"
            )

    # ── 10. Certificate Transparency Log Check (crt.sh) ──────────────────
    ct = check_ct_logs(hostname)
    report["ct_log_count"]    = ct["ct_log_count"]
    report["ct_earliest_seen"] = ct["ct_earliest_seen"]
    report["ct_check_failed"]  = ct["ct_check_failed"]

    if not ct["ct_check_failed"]:
        if ct["ct_log_count"] == 0:
            report["warning_flags"].append("No CT Log Entries Found (Suspicious)")
        elif ct["ct_earliest_seen"]:
            # If first CT appearance is very recent, flag it
            try:
                first_seen = datetime.strptime(ct["ct_earliest_seen"], "%Y-%m-%d")
                if (datetime.utcnow() - first_seen).days < 3:
                    report["warning_flags"].append(
                        f"CT Log: Certificate First Seen Very Recently ({ct['ct_earliest_seen']})"
                    )
            except ValueError:
                pass

    return report