#!/usr/bin/env python3
"""Test phishing detection"""

import sys
sys.path.insert(0, '.')

from core.security import detect_phishing

test_cases = [
    # Should detect as phishing
    ("http://faceb0ok.com", True, "Should detect o->0 substitution"),
    ("http://g00gle-login.com", True, "Should detect o->0 + keywords"),
    ("http://paypai.com", True, "Should detect character omission"),
    ("https://apple-verify.com", True, "Should detect brand + keywords"),
    ("http://amaz0n-account.com", True, "Should detect character substitution"),
    
    # Should NOT detect as phishing
    ("https://facebook.com", False, "Legitimate Facebook"),
    ("https://google.com", False, "Legitimate Google"),
    ("http://example.com", False, "Generic domain"),
    ("https://github.com", False, "Legitimate GitHub"),
]

print("🧪 Testing Phishing Detection")
print("=" * 80)

for url, expected_phishing, description in test_cases:
    result = detect_phishing(url)
    
    is_phishing = result['is_phishing']
    passed = is_phishing == expected_phishing
    
    status = "✅ PASS" if passed else "❌ FAIL"
    
    print(f"{status}: {description}")
    print(f"   URL: {url}")
    print(f"   Expected phishing: {expected_phishing}")
    print(f"   Detected phishing: {is_phishing}")
    print(f"   Phishing score: {result['phishing_score']:.1f}/100")
    
    if result['typosquatting']['is_typosquatting']:
        print(f"   Typosquatting: {result['typosquatting']['detected_brand']} "
              f"(confidence: {result['typosquatting']['confidence']:.1f}%)")
    
    if result['homograph_attack']['is_homograph']:
        print(f"   Homograph attack detected!")
    
    if result['suspicious_keywords']['has_suspicious_keywords']:
        print(f"   Suspicious keywords: {result['suspicious_keywords']['total_count']} found")
    
    print()

print("=" * 80)
print("Test complete! Check if faceb0ok.com is now detected correctly.")