def calculate_fusion_score(ml_prob: float, warnings: list):
    """
    Synthesizes disparate signals into a coherent safety verdict[cite: 22].
    Formula: Risk = min(100, (alpha * ML_Score) + sum(Penalty * Weight)) [cite: 274]
    """
    # Base probabilistic score (0-100) [cite: 271]
    base_score = ml_prob * 100
    penalty_points = 0
    
    # Weights and Penalties Table [cite: 277]
    weights = {
        "Insecure Login Form (HTTP)": 100, # Critical Override [cite: 275, 277]
        "Potential Typosquat": 50,         # High severity [cite: 277]
        "New Domain (< 1 week)": 40,       # High severity [cite: 277]
        "Suspicious Keyword": 20,          # Medium severity [cite: 277]
        "Cross-Domain Redirect Detected": 15,# Low severity [cite: 277]
        "Automated/Free DV Certificate": 10# Low severity [cite: 277]
    }

    for warning in warnings:
        for key, value in weights.items():
            if key in warning:
                if value == 100: return 100 # Immediate override [cite: 275]
                penalty_points += value

    # Final calculation with 0.5 alpha weight for ML
    return int(min(100, (0.5 * base_score) + penalty_points))