import numpy as np
import joblib # For loading the pre-trained Scikit-learn model
from app.core.lexical import calculate_entropy

# Path to your pre-trained Random Forest model
MODEL_PATH = "app/models/url_classifier.joblib"

def extract_features(url, hostname, lexical_data, reputation_data):
    """
    Transforms URL data into a numerical vector as specified in 
    Section 9.1 of the Technical Report.
    """
    features = [
        len(url),                         # URL Length [cite: 231]
        len(hostname),                    # Domain Length [cite: 231]
        url.count('.'),                   # Dot count [cite: 231]
        url.count('-'),                   # Hyphen count [cite: 231]
        1 if "@" in url else 0,           # URL Masking [cite: 231]
        lexical_data["entropy"],          # Domain Entropy [cite: 232]
        reputation_data.get("domain_age_days", 0) or 0, # Age [cite: 233]
    ]
    return np.array(features).reshape(1, -1)

def predict_risk(url, hostname, lexical_data, reputation_data):
    report = {
        "ml_probability": 0.0,
        "ml_verdict": "Indeterminate",
        "top_features": []
    }

    try:
        # Load the Random Forest model
        model = joblib.load(MODEL_PATH) [cite: 235]
        
        # 1. Vectorization [cite: 242]
        feature_vector = extract_features(url, hostname, lexical_data, reputation_data)
        
        # 2. Inference [cite: 243]
        # returns [prob_benign, prob_malicious]
        probabilities = model.predict_proba(feature_vector)[0] [cite: 244]
        report["ml_probability"] = float(probabilities[1]) # Probability of malice [cite: 245]
        
        # 3. Verdict based on 80% threshold [cite: 278]
        if report["ml_probability"] > 0.8:
            report["ml_verdict"] = "High Risk"
        elif report["ml_probability"] > 0.5:
            report["ml_verdict"] = "Suspicious"
        else:
            report["ml_verdict"] = "Safe"

    except FileNotFoundError:
        # Fallback if model is not yet trained/saved
        report["ml_verdict"] = "Model not found"
    except Exception as e:
        report["ml_verdict"] = f"ML Error: {str(e)}"

    return report