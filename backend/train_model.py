import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# 1. Mock Dataset (In production, load a CSV with PhishTank/Tranco data)
# Features: [url_len, host_len, dot_count, hyphen_count, has_at, entropy, age_days]
data = {
    'url_len': [25, 100, 15, 80, 20, 95, 12, 110],
    'host_len': [12, 45, 10, 35, 15, 40, 8, 50],
    'dot_count': [2, 5, 1, 4, 1, 6, 1, 5],
    'hyphen_count': [0, 3, 0, 4, 0, 2, 0, 5],
    'has_at': [0, 1, 0, 1, 0, 1, 0, 1],
    'entropy': [2.5, 4.2, 2.1, 4.5, 2.8, 4.1, 2.0, 4.8],
    'age_days': [3000, 2, 1500, 5, 2000, 1, 1000, 3],
    'label': [0, 1, 0, 1, 0, 1, 0, 1]  # 0 = Safe, 1 = Malicious
}

df = pd.DataFrame(data)

# 2. Split Data
X = df.drop('label', axis=1)
y = df['label']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 3. Train Random Forest
print("Training SafeNav ML Engine...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 4. Save the Model
os.makedirs('app/models', exist_ok=True)
joblib.dump(model, 'app/models/url_classifier.joblib')
print("Model saved to app/models/url_classifier.joblib")