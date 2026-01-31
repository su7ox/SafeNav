import joblib
import numpy as np
import os
import math

# Load model if it exists
MODEL_PATH = "app/models/url_classifier.joblib"
try:
    model = joblib.load(MODEL_PATH)
except:
    model = None

def calculate_entropy(text):
    if not text:
        return 0
    entropy = 0
    for x in range(256):
        p_x = float(text.count(chr(x)))/len(text)
        if p_x > 0:
            entropy += - p_x*math.log(p_x, 2)
    return entropy

def extract_features(url, hostname, lexical_data, reputation_data):
    # This must match the training features exactly
    return [
        len(url),                               # Length
        len(hostname),                          # DomainLen
        url.count('.'),                         # Dots
        url.count('-'),                         # Hyphens
        url.count('@'),                         # AtSymbol
        lexical_data.get("entropy", 0.0),       # Entropy
        reputation_data.get("domain_age_days", 0) # DomainAge
    ]

def predict_risk(url, hostname, lexical_data, reputation_data):
    features = extract_features(url, hostname, lexical_data, reputation_data)
    
    if model:
        try:
            # Reshape for single sample
            features_np = np.array(features).reshape(1, -1)
            probability = model.predict_proba(features_np)[0][1] # Probability of Class 1 (Malicious)
            return {
                "ml_verdict": "Malicious" if probability > 0.5 else "Safe",
                "ml_probability": round(probability * 100, 2)
            }
        except Exception as e:
            print(f"ML Prediction Error: {e}")
            return {"ml_verdict": "Error", "ml_probability": 0.0}
    else:
        # Fallback if no model trained yet
        return {"ml_verdict": "Model Missing", "ml_probability": 0.0}