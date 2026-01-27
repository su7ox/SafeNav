from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.normalization import normalize_url
from app.core.fingerprinting import identify_link_type
from app.core.tracing import trace_redirects
from app.core.ssl_check import inspect_ssl
from app.core.reputation import check_domain_reputation
from app.core.lexical import check_lexical_risk
from app.core.ml_engine import predict_risk
from app.core.content_scan import inspect_content # Module VIII
from app.utils.scoring import calculate_fusion_score  # Fusion Logic [cite: 265, 269]

router = APIRouter()

class ScanRequest(BaseModel):
    url: str

@router.post("/scan")
async def scan_url(request: ScanRequest):
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")

    # 1. Normalization & Initial ID [cite: 43, 79]
    normalized_url, hostname = normalize_url(request.url)
    fingerprint = identify_link_type(normalized_url, hostname)
    
    # 2. Network & Crypto Analysis (Async/Parallel recommended in prod) [cite: 112, 142]
    trace = await trace_redirects(normalized_url)
    ssl_data = inspect_ssl(hostname)
    reputation = check_domain_reputation(normalized_url)
    
    # 3. Textual & Statistical Analysis [cite: 203]
    lexical = check_lexical_risk(normalized_url, hostname)
    
    # 4. Content & ML Analysis [cite: 227, 250]
    # content_scan uses HTML retrieved during redirect trace
    content_data = inspect_content(trace.get("html_content"), normalized_url)
    ml_result = predict_risk(normalized_url, hostname, lexical, reputation)

    # 5. Risk Score Aggregation [cite: 265, 268]
    all_warnings = (
        fingerprint["tags"] + trace["warning_flags"] + 
        ssl_data["warning_flags"] + reputation["warning_flags"] + 
        lexical["warning_flags"] + content_data["warning_flags"]
    )
    
    # The Fusion Algorithm handles weights and overrides [cite: 274]
    final_score = calculate_fusion_score(ml_result["ml_probability"], all_warnings)

    # 6. Tiered Results [cite: 286]
    verdict = "Safe" if final_score <= 30 else "Caution" if final_score <= 69 else "High Risk"

    return {
        "url": normalized_url,
        "final_destination": trace["final_url"],
        "risk_score": final_score,
        "verdict": verdict,
        "details": {
            "ml_probability": ml_result["ml_probability"],
            "hop_count": trace["hop_count"],
            "cert_age": ssl_data["cert_age_days"]
        },
        "reasoning": list(set(all_warnings)) # Explainability section [cite: 291]
    }